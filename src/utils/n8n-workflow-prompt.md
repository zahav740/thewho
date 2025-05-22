# Промпт для создания Production Planning Workflow в n8n

## Описание задачи
Создать workflow в n8n для автоматического планирования производства на основе данных заказов, поступающих через webhook от приложения TheWho.

## Структура workflow

### 1. Webhook Trigger
```
Название: "Order Data Received"
Тип: HTTP Request Trigger
Метод: POST
Путь: /webhook/production-planning
```

**Ожидаемая структура входящих данных:**
```json
{
  "eventType": "production_planning",
  "timestamp": "2025-05-18T...",
  "source": "TheWho App",
  "environment": "localhost",
  "data": {
    "orders": [
      {
        "id": "order-123",
        "drawingNumber": "DWG-001",
        "deadline": "2025-05-25T00:00:00.000Z",
        "quantity": 50,
        "priority": 2,
        "operations": [
          {
            "id": "op-1",
            "sequenceNumber": 1,
            "operationType": "3-axis",
            "estimatedTime": 30,
            "status": "pending"
          }
        ]
      }
    ],
    "summary": {
      "totalOrders": 5,
      "totalOperations": 15
    }
  }
}
```

### 2. Data Processing Node
```
Название: "Parse Order Data"
Тип: Code Node (JavaScript)
```

**Код для обработки:**
```javascript
// Извлекаем данные заказов
const orders = $json.data.orders;
const machines = [
  { name: "Doosan Yashana", supports3Axis: true, supports4Axis: true, efficiency: 1.0 },
  { name: "Doosan Hadasha", supports3Axis: true, supports4Axis: true, efficiency: 1.1 },
  { name: "Doosan 3", supports3Axis: true, supports4Axis: false, efficiency: 0.9 },
  { name: "Pinnacle Gdola", supports3Axis: false, supports4Axis: true, efficiency: 1.2 },
  { name: "Mitsubishi", supports3Axis: true, supports4Axis: false, efficiency: 0.8 },
  { name: "Okuma", supports3Axis: true, supports4Axis: true, efficiency: 1.0 },
  { name: "JonFord", supports3Axis: true, supports4Axis: false, efficiency: 0.85 }
];

// Функция для выбора станка
function selectMachine(operationType, machines) {
  const compatibleMachines = machines.filter(machine => {
    if (operationType === '3-axis') {
      return machine.supports3Axis;
    } else {
      return machine.supports4Axis;
    }
  });
  
  // Выбираем станок с наибольшей эффективностью
  return compatibleMachines.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  );
}

// Функция расчета времени
function calculateTime(operation, quantity, machine) {
  const baseTime = operation.estimatedTime * quantity;
  const adjustedTime = baseTime / machine.efficiency;
  const setupTime = operation.operationType === '4-axis' ? 60 : 30;
  const bufferTime = adjustedTime * 0.1; // 10% буфер
  
  return {
    expectedTime: Math.round(adjustedTime),
    setupTime: setupTime,
    bufferTime: Math.round(bufferTime),
    totalTime: Math.round(adjustedTime + setupTime + bufferTime)
  };
}

// Функция расчета рабочих дат
function calculateWorkingDates(startDate, totalMinutes) {
  const workingHoursPerDay = 16; // 16 часов в день
  const minutesPerDay = workingHoursPerDay * 60;
  
  let currentDate = new Date(startDate);
  let remainingMinutes = totalMinutes;
  
  while (remainingMinutes > 0) {
    // Пропускаем выходные (пятница = 5, суббота = 6)
    if (currentDate.getDay() === 5 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    if (remainingMinutes <= minutesPerDay) {
      // Добавляем оставшиеся минуты к текущей дате
      currentDate.setMinutes(currentDate.getMinutes() + remainingMinutes);
      remainingMinutes = 0;
    } else {
      // Переходим к следующему рабочему дню
      remainingMinutes -= minutesPerDay;
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return currentDate;
}

// Планирование каждого заказа
const planningResults = [];
let currentDate = new Date();

// Сортируем заказы по приоритету и дедлайну
const sortedOrders = orders.sort((a, b) => {
  if (a.priority !== b.priority) {
    return b.priority - a.priority; // Больший приоритет первым
  }
  return new Date(a.deadline) - new Date(b.deadline); // Ранний дедлайн первым
});

for (const order of sortedOrders) {
  // Сортируем операции по sequenceNumber
  const sortedOperations = order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  for (const operation of sortedOperations) {
    // Выбираем станок
    const machine = selectMachine(operation.operationType, machines);
    
    // Рассчитываем время
    const timeCalc = calculateTime(operation, order.quantity, machine);
    
    // Рассчитываем даты
    const startDate = new Date(currentDate);
    const endDate = calculateWorkingDates(startDate, timeCalc.totalTime);
    
    // Проверяем соответствие дедлайну
    const deadline = new Date(order.deadline);
    const isOnSchedule = endDate <= deadline;
    
    // Создаем результат планирования
    const planningResult = {
      id: `plan-${order.id}-${operation.id}`,
      orderId: order.id,
      operationId: operation.id,
      drawingNumber: order.drawingNumber,
      machine: machine.name,
      machineEfficiency: machine.efficiency,
      plannedStartDate: startDate.toISOString(),
      plannedEndDate: endDate.toISOString(),
      quantityAssigned: order.quantity,
      expectedTimeMinutes: timeCalc.expectedTime,
      setupTimeMinutes: timeCalc.setupTime,
      bufferTimeMinutes: timeCalc.bufferTime,
      totalTimeMinutes: timeCalc.totalTime,
      isOnSchedule: isOnSchedule,
      daysToDeadline: Math.ceil((deadline - endDate) / (1000 * 60 * 60 * 24)),
      operationType: operation.operationType,
      priority: order.priority,
      status: 'planned'
    };
    
    planningResults.push(planningResult);
    
    // Обновляем текущую дату для следующей операции
    currentDate = new Date(endDate);
    
    // Небольшая пауза между операциями (30 минут)
    currentDate.setMinutes(currentDate.getMinutes() + 30);
  }
}

// Анализ результатов
const analysis = {
  totalOperations: planningResults.length,
  onScheduleOperations: planningResults.filter(r => r.isOnSchedule).length,
  lateOperations: planningResults.filter(r => !r.isOnSchedule).length,
  machineUtilization: {},
  priorityDistribution: {},
  averageLeadTime: 0
};

// Анализ загрузки станков
machines.forEach(machine => {
  const machineOperations = planningResults.filter(r => r.machine === machine.name);
  const totalTime = machineOperations.reduce((sum, op) => sum + op.totalTimeMinutes, 0);
  analysis.machineUtilization[machine.name] = {
    operations: machineOperations.length,
    totalTimeHours: Math.round(totalTime / 60),
    efficiency: machine.efficiency
  };
});

// Анализ по приоритетам
orders.forEach(order => {
  analysis.priorityDistribution[order.priority] = 
    (analysis.priorityDistribution[order.priority] || 0) + 1;
});

// Средний срок выполнения
if (planningResults.length > 0) {
  const totalLeadTime = planningResults.reduce((sum, result) => {
    const leadTime = new Date(result.plannedEndDate) - new Date(result.plannedStartDate);
    return sum + leadTime;
  }, 0);
  analysis.averageLeadTime = Math.round(totalLeadTime / planningResults.length / (1000 * 60 * 60 * 24));
}

return [{
  json: {
    planningResults: planningResults,
    analysis: analysis,
    processedAt: new Date().toISOString(),
    inputSummary: $json.data.summary
  }
}];
```

### 3. Decision Node - Alert Check
```
Название: "Check for Alerts"
Тип: IF Node
```

**Условие:**
```
{{ $json.analysis.lateOperations > 0 }}
```

### 4. Alert Generation (True branch)
```
Название: "Generate Alerts"
Тип: Code Node (JavaScript)
```

**Код для генерации алертов:**
```javascript
const planningResults = $json.planningResults;
const alerts = [];

// Генерируем алерты для операций с нарушением дедлайна
planningResults.forEach(result => {
  if (!result.isOnSchedule) {
    alerts.push({
      id: `alert-${result.orderId}-${result.operationId}`,
      type: 'deadline_risk',
      severity: result.daysToDeadline < -7 ? 'critical' : 'high',
      title: `Заказ ${result.drawingNumber} не успевает к дедлайну`,
      description: `Операция ${result.operationId} на станке ${result.machine} завершится с опозданием на ${Math.abs(result.daysToDeladline)} дней`,
      affectedOrder: result.drawingNumber,
      machine: result.machine,
      daysLate: Math.abs(result.daysToDeadline),
      createdAt: new Date().toISOString()
    });
  }
});

// Проверяем перегрузку станков
const machineLoad = $json.analysis.machineUtilization;
Object.entries(machineLoad).forEach(([machineName, load]) => {
  if (load.totalTimeHours > 200) { // Более 200 часов загрузки
    alerts.push({
      id: `alert-overload-${machineName}`,
      type: 'resource_shortage',
      severity: 'medium',
      title: `Перегрузка станка ${machineName}`,
      description: `Станок загружен на ${load.totalTimeHours} часов (${load.operations} операций)`,
      machine: machineName,
      loadHours: load.totalTimeHours,
      operations: load.operations,
      createdAt: new Date().toISOString()
    });
  }
});

return [{
  json: {
    alerts: alerts,
    alertCount: alerts.length,
    planningResults: $json.planningResults,
    analysis: $json.analysis
  }
}];
```

### 5. Database Storage Node
```
Название: "Store Planning Results"
Тип: PostgreSQL Node (или другая БД)
```

**SQL для создания таблицы:**
```sql
CREATE TABLE IF NOT EXISTS planning_results (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255),
  operation_id VARCHAR(255),
  drawing_number VARCHAR(255),
  machine VARCHAR(255),
  planned_start_date TIMESTAMP,
  planned_end_date TIMESTAMP,
  quantity_assigned INTEGER,
  expected_time_minutes INTEGER,
  setup_time_minutes INTEGER,
  buffer_time_minutes INTEGER,
  total_time_minutes INTEGER,
  is_on_schedule BOOLEAN,
  days_to_deadline INTEGER,
  operation_type VARCHAR(50),
  priority INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**SQL для вставки данных:**
```sql
INSERT INTO planning_results (
  id, order_id, operation_id, drawing_number, machine,
  planned_start_date, planned_end_date, quantity_assigned,
  expected_time_minutes, setup_time_minutes, buffer_time_minutes,
  total_time_minutes, is_on_schedule, days_to_deadline,
  operation_type, priority, status
) VALUES (
  {{ $json.id }},
  {{ $json.orderId }},
  {{ $json.operationId }},
  {{ $json.drawingNumber }},
  {{ $json.machine }},
  {{ $json.plannedStartDate }},
  {{ $json.plannedEndDate }},
  {{ $json.quantityAssigned }},
  {{ $json.expectedTimeMinutes }},
  {{ $json.setupTimeMinutes }},
  {{ $json.bufferTimeMinutes }},
  {{ $json.totalTimeMinutes }},
  {{ $json.isOnSchedule }},
  {{ $json.daysToDeadline }},
  {{ $json.operationType }},
  {{ $json.priority }},
  {{ $json.status }}
) ON CONFLICT (id) DO UPDATE SET
  planned_start_date = EXCLUDED.planned_start_date,
  planned_end_date = EXCLUDED.planned_end_date,
  is_on_schedule = EXCLUDED.is_on_schedule,
  days_to_deadline = EXCLUDED.days_to_deadline,
  status = EXCLUDED.status;
```

### 6. Notification Node (Branch for alerts)
```
Название: "Send Alert Notifications"
Тип: Email Node / Slack Node / Telegram Node
```

**Для Email:**
```
Тема: Production Planning Alert - {{ $json.alerts.length }} проблем найдено
Тело письма:
В результате планирования производства обнаружены следующие проблемы:

{{#each $json.alerts}}
- {{this.title}}
  Описание: {{this.description}}
  Серьезность: {{this.severity}}
  Время: {{this.createdAt}}

{{/each}}

Общая статистика:
- Всего операций: {{ $json.analysis.totalOperations }}
- В срок: {{ $json.analysis.onScheduleOperations }}
- С опозданием: {{ $json.analysis.lateOperations }}
- Средний срок выполнения: {{ $json.analysis.averageLeadTime }} дней

Просмотрите детали в системе планирования.
```

### 7. Response Node
```
Название: "Send Response"
Тип: Respond to Webhook Node
```

**Ответ:**
```json
{
  "status": "success",
  "message": "Planning completed successfully",
  "timestamp": "{{ new Date().toISOString() }}",
  "results": {
    "totalOperations": "{{ $json.analysis.totalOperations }}",
    "onSchedule": "{{ $json.analysis.onScheduleOperations }}",
    "late": "{{ $json.analysis.lateOperations }}",
    "alertsGenerated": "{{ $json.alerts ? $json.alerts.length : 0 }}"
  },
  "planningId": "{{ $json.planningResults[0].id.split('-')[1] }}"
}
```

### 8. Error Handling Node
```
Название: "Handle Errors"
Тип: Code Node (JavaScript)
```

**Код для обработки ошибок:**
```javascript
const error = $input.first().error;
console.error('Planning workflow error:', error);

return [{
  json: {
    status: 'error',
    message: 'Planning failed',
    error: error.message,
    timestamp: new Date().toISOString()
  }
}];
```

## Дополнительные узлы для расширенной функциональности

### 9. Machine Schedule Optimization
```
Название: "Optimize Machine Schedule"
Тип: Code Node (JavaScript)
```

**Код для оптимизации:**
```javascript
// Группируем операции по станкам
const machineGroups = {};
$json.planningResults.forEach(result => {
  if (!machineGroups[result.machine]) {
    machineGroups[result.machine] = [];
  }
  machineGroups[result.machine].push(result);
});

// Оптимизируем расписание для каждого станка
Object.keys(machineGroups).forEach(machine => {
  const operations = machineGroups[machine];
  
  // Сортируем по приоритету, затем по времени наладки (группируем похожие типы)
  operations.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    if (a.operationType !== b.operationType) {
      return a.operationType.localeCompare(b.operationType);
    }
    return a.setupTimeMinutes - b.setupTimeMinutes;
  });
  
  // Пересчитываем времена с учетом оптимизации наладки
  let currentTime = new Date();
  let lastOperationType = null;
  
  operations.forEach((operation, index) => {
    const startTime = new Date(currentTime);
    
    // Если тип операции тот же, что и предыдущий, уменьшаем время наладки
    if (lastOperationType === operation.operationType && index > 0) {
      operation.setupTimeMinutes = Math.round(operation.setupTimeMinutes * 0.3);
      operation.totalTimeMinutes = operation.expectedTimeMinutes + operation.setupTimeMinutes + operation.bufferTimeMinutes;
    }
    
    currentTime.setMinutes(currentTime.getMinutes() + operation.totalTimeMinutes);
    
    operation.plannedStartDate = startTime.toISOString();
    operation.plannedEndDate = currentTime.toISOString();
    operation.optimized = true;
    
    lastOperationType = operation.operationType;
  });
});

// Пересобираем результаты
const optimizedResults = Object.values(machineGroups).flat();

return [{
  json: {
    planningResults: optimizedResults,
    analysis: $json.analysis,
    optimizationApplied: true
  }
}];
```

### 10. Export to Calendar
```
Название: "Export to Google Calendar"
Тип: Google Calendar Node
```

**Настройки:**
- Операция: Create Event
- Calendar ID: production-planning@company.com
- Title: {{ $json.drawingNumber }} - {{ $json.operationType }} ({{ $json.machine }})
- Start Date: {{ $json.plannedStartDate }}
- End Date: {{ $json.plannedEndDate }}
- Description: 
  ```
  Заказ: {{ $json.drawingNumber }}
  Операция: {{ $json.operationId }}
  Станок: {{ $json.machine }}
  Количество: {{ $json.quantityAssigned }}
  Расчетное время: {{ $json.expectedTimeMinutes }} мин
  Время наладки: {{ $json.setupTimeMinutes }} мин
  Приоритет: {{ $json.priority }}
  Статус: {{ $json.isOnSchedule ? 'В срок' : 'Опаздывает' }}
  ```

## Инструкции по настройке

1. **Создание workflow:**
   - Создайте новый workflow в n8n
   - Добавьте узлы в указанном порядке
   - Соедините узлы согласно логике

2. **Настройка webhook:**
   - Скопируйте URL webhook из узла "Order Data Received"
   - Добавьте этот URL в настройки TheWho приложения

3. **Настройка базы данных:**
   - Создайте соединение с PostgreSQL
   - Выполните SQL скрипт для создания таблицы

4. **Настройка уведомлений:**
   - Настройте Email/Slack/Telegram узлы с вашими реквизитами
   - Добавьте получателей уведомлений

5. **Тестирование:**
   - Отправьте тестовые данные через TheWho приложение
   - Проверьте результаты в базе данных
   - Убедитесь в получении уведомлений

## Мониторинг и оптимизация

- **Логирование:** Добавьте узлы для логирования ключевых этапов
- **Метрики:** Отслеживайте время выполнения workflow
- **Ошибки:** Настройте уведомления об ошибках
- **Производительность:** Оптимизируйте узлы при большом объеме данных

## Расширения

- **Интеграция с ERP:** Добавьте узлы для синхронизации с ERP системой
- **Машинное обучение:** Интегрируйте ML модели для предсказания времени выполнения
- **Визуализация:** Создайте дашборды для мониторинга планирования
- **Мобильные уведомления:** Добавьте push-уведомления для мобильного приложения
