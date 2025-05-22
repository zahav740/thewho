# 🔧 N8N Workflow для TheWho - Планирование производства

## 📋 Краткое описание
Создайте автоматизированный workflow в n8n для обработки данных заказов от приложения TheWho, их планирования по станкам и распределения операций с уведомлениями.

## 🚀 Структура Workflow

### 1️⃣ Webhook Trigger - "Прием данных заказов"
```yaml
Тип: Webhook
Метод: POST
Путь: /webhook/thewho-orders
Аутентификация: None (или добавить API ключ)
```

**Ожидаемые данные:**
```json
{
  "eventType": "production_planning",
  "timestamp": "2025-05-18T18:33:17.000Z",
  "source": "TheWho App",
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
            "operationType": "milling",
            "estimatedTime": 30,
            "status": "pending",
            "machine": "Doosan Yashana"
          },
          {
            "id": "op-2",
            "sequenceNumber": 2,
            "operationType": "turning",
            "estimatedTime": 20,
            "status": "pending",
            "machine": "Okuma"
          }
        ]
      }
    ]
  }
}
```

### 2️⃣ Data Validation - "Проверка данных"
```javascript
// Проверяем структуру данных
const inputData = $json;

if (!inputData.data || !inputData.data.orders) {
  throw new Error('Invalid data structure: missing orders');
}

const orders = inputData.data.orders;
const validOrders = [];
const errors = [];

// Валидируем каждый заказ
orders.forEach(order => {
  if (!order.id || !order.drawingNumber || !order.deadline) {
    errors.push(`Order missing required fields: ${order.id || 'unknown'}`);
    return;
  }
  
  if (!order.operations || order.operations.length === 0) {
    errors.push(`Order ${order.id} has no operations`);
    return;
  }
  
  // Проверяем операции
  const validOperations = order.operations.filter(op => 
    op.id && op.operationType && op.estimatedTime > 0
  );
  
  if (validOperations.length > 0) {
    validOrders.push({
      ...order,
      operations: validOperations
    });
  } else {
    errors.push(`Order ${order.id} has no valid operations`);
  }
});

return [{
  json: {
    validOrders: validOrders,
    validationErrors: errors,
    processedAt: new Date().toISOString(),
    originalOrderCount: orders.length,
    validOrderCount: validOrders.length
  }
}];
```

### 3️⃣ Machine Planning - "Планирование по станкам"
```javascript
// Конфигурация станков из TheWho с учетом токарных и фрезерных операций
const machines = [
  { name: "Doosan Yashana", type: "milling", supports3Axis: true, supports4Axis: true, supportsTurning: false, supportsMilling: true, efficiency: 1.0, downtime: 0.08 },
  { name: "Doosan Hadasha", type: "milling", supports3Axis: true, supports4Axis: true, supportsTurning: false, supportsMilling: true, efficiency: 1.1, downtime: 0.05 },
  { name: "Doosan 3", type: "milling", supports3Axis: true, supports4Axis: false, supportsTurning: false, supportsMilling: true, efficiency: 0.9, downtime: 0.12 },
  { name: "Pinnacle Gdola", type: "milling", supports3Axis: false, supports4Axis: true, supportsTurning: false, supportsMilling: true, efficiency: 1.2, downtime: 0.06 },
  { name: "Mitsubishi", type: "milling", supports3Axis: true, supports4Axis: false, supportsTurning: false, supportsMilling: true, efficiency: 0.8, downtime: 0.15 },
  { name: "Okuma", type: "turning", supports3Axis: false, supports4Axis: false, supportsTurning: true, supportsMilling: false, efficiency: 1.0, downtime: 0.07 },
  { name: "JonFord", type: "turning", supports3Axis: false, supports4Axis: false, supportsTurning: true, supportsMilling: false, efficiency: 0.85, downtime: 0.10 }
];

const orders = $json.validOrders;
const planningResults = [];
const machineSchedules = {};

// Инициализируем расписания станков
machines.forEach(machine => {
  machineSchedules[machine.name] = {
    machine: machine,
    operations: [],
    totalTime: 0,
    freeSlots: [{ start: new Date(), end: null }]
  };
});

// Функция выбора станка с учетом токарных и фрезерных операций
function selectMachine(operation, machines, schedules) {
  const compatible = machines.filter(m => {
    // Проверка совместимости по типу операции
    switch (operation.operationType) {
      case '3-axis':
        return m.supports3Axis && m.supportsMilling;
      case '4-axis':
        return m.supports4Axis && m.supportsMilling;
      case 'milling':
        return m.supportsMilling;
      case 'turning':
        return m.supportsTurning;
      default:
        return false;
    }
  });
  
  if (compatible.length === 0) return null;
  
  // Предпочитаем указанный станок если он совместим
  if (operation.machine) {
    const preferred = compatible.find(m => m.name === operation.machine);
    if (preferred) return preferred;
  }
  
  // Выбираем станок с минимальной загрузкой
  return compatible.reduce((best, current) => {
    const bestLoad = schedules[best.name].totalTime;
    const currentLoad = schedules[current.name].totalTime;
    return currentLoad < bestLoad ? current : best;
  });
}

// Функция расчета времени с учетом типа операции
function calculateOperationTime(operation, quantity, machine) {
  const baseTime = operation.estimatedTime * quantity;
  const adjustedTime = baseTime / machine.efficiency;
  
  // Определяем время наладки в зависимости от типа операции
  let setupTime;
  switch (operation.operationType) {
    case '4-axis':
      setupTime = 90; // 4-коорд фрезерование - сложная наладка
      break;
    case '3-axis':
      setupTime = 60; // 3-коорд фрезерование
      break;
    case 'milling':
      setupTime = 45; // Обычное фрезерное
      break;
    case 'turning':
      setupTime = 30; // Токарная обработка
      break;
    default:
      setupTime = 60;
  }
  
  const bufferTime = adjustedTime * machine.downtime;
  
  return {
    expected: Math.round(adjustedTime),
    setup: setupTime,
    buffer: Math.round(bufferTime),
    total: Math.round(adjustedTime + setupTime + bufferTime)
  };
}

// Функция расчета рабочего времени (8:00-24:00, пн-чт)
function calculateWorkingEndTime(startTime, totalMinutes) {
  const workStart = 8; // 8:00
  const workEnd = 24;  // 24:00
  const dailyMinutes = (workEnd - workStart) * 60; // 960 минут

  let currentTime = new Date(startTime);
  let remainingMinutes = totalMinutes;
  
  // Если начинаем не в рабочее время, перемещаем на начало следующего рабочего дня
  if (currentTime.getHours() < workStart) {
    currentTime.setHours(workStart, 0, 0, 0);
  } else if (currentTime.getHours() >= workEnd) {
    currentTime.setDate(currentTime.getDate() + 1);
    currentTime.setHours(workStart, 0, 0, 0);
  }
  
  while (remainingMinutes > 0) {
    // Пропускаем выходные (пт=5, сб=6)
    if (currentTime.getDay() === 5 || currentTime.getDay() === 6) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(workStart, 0, 0, 0);
      continue;
    }
    
    // Считаем доступные минуты в текущем дне
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const usedMinutes = (currentHour - workStart) * 60 + currentMinute;
    const availableMinutes = dailyMinutes - usedMinutes;
    
    if (remainingMinutes <= availableMinutes) {
      // Операция завершается в этот день
      currentTime.setMinutes(currentTime.getMinutes() + remainingMinutes);
      remainingMinutes = 0;
    } else {
      // Переходим к следующему рабочему дню
      remainingMinutes -= availableMinutes;
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(workStart, 0, 0, 0);
    }
  }
  
  return currentTime;
}

// Сортируем заказы по приоритету и дедлайну
const sortedOrders = orders.sort((a, b) => {
  if (a.priority !== b.priority) return b.priority - a.priority;
  return new Date(a.deadline) - new Date(b.deadline);
});

// Планируем каждый заказ
for (const order of sortedOrders) {
  // Сортируем операции по sequenceNumber
  const sortedOps = order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  let orderStartTime = new Date();
  
  for (const operation of sortedOps) {
    // Выбираем станок
    const machine = selectMachine(operation, machines, machineSchedules);
    if (!machine) {
      console.warn(`No machine available for operation ${operation.id}`);
      continue;
    }
    
    // Рассчитываем время
    const timing = calculateOperationTime(operation, order.quantity, machine);
    
    // Определяем время начала (после предыдущей операции этого заказа)
    const schedule = machineSchedules[machine.name];
    let startTime = new Date(Math.max(orderStartTime, new Date()));
    
    // Если станок занят, ищем свободное время
    if (schedule.operations.length > 0) {
      const lastOperation = schedule.operations[schedule.operations.length - 1];
      const machineAvailable = new Date(lastOperation.plannedEndDate);
      startTime = new Date(Math.max(startTime, machineAvailable));
    }
    
    // Рассчитываем время окончания
    const endTime = calculateWorkingEndTime(startTime, timing.total);
    
    // Проверяем дедлайн
    const deadline = new Date(order.deadline);
    const isOnSchedule = endTime <= deadline;
    const daysToDeadline = Math.ceil((deadline - endTime) / (1000 * 60 * 60 * 24));
    
    // Создаем результат планирования
    const result = {
      id: `plan-${order.id}-${operation.id}`,
      orderId: order.id,
      operationId: operation.id,
      drawingNumber: order.drawingNumber,
      operationType: operation.operationType,
      machine: machine.name,
      machineEfficiency: machine.efficiency,
      plannedStartDate: startTime.toISOString(),
      plannedEndDate: endTime.toISOString(),
      quantity: order.quantity,
      estimatedTimeMinutes: timing.expected,
      setupTimeMinutes: timing.setup,
      bufferTimeMinutes: timing.buffer,
      totalTimeMinutes: timing.total,
      priority: order.priority,
      isOnSchedule: isOnSchedule,
      daysToDeadline: daysToDeadline,
      deadline: order.deadline,
      status: 'planned'
    };
    
    planningResults.push(result);
    
    // Обновляем расписание станка
    schedule.operations.push(result);
    schedule.totalTime += timing.total;
    
    // Следующая операция этого заказа начинается после текущей
    orderStartTime = endTime;
  }
}

// Анализируем результаты
const analysis = {
  totalOrders: orders.length,
  totalOperations: planningResults.length,
  onScheduleOperations: planningResults.filter(r => r.isOnSchedule).length,
  lateOperations: planningResults.filter(r => !r.isOnSchedule).length,
  machineUtilization: {},
  averageLeadTimeDays: 0
};

// Анализ загрузки станков
Object.entries(machineSchedules).forEach(([machineName, schedule]) => {
  analysis.machineUtilization[machineName] = {
    operationsCount: schedule.operations.length,
    totalTimeHours: Math.round(schedule.totalTime / 60 * 10) / 10,
    efficiency: schedule.machine.efficiency,
    loadPercentage: Math.round((schedule.totalTime / (8 * 60 * 5)) * 100) // 5 рабочих дней
  };
});

// Средний срок выполнения
if (planningResults.length > 0) {
  const totalLeadTime = planningResults.reduce((sum, result) => {
    const leadTime = new Date(result.plannedEndDate) - new Date(result.plannedStartDate);
    return sum + leadTime / (1000 * 60 * 60 * 24);
  }, 0);
  analysis.averageLeadTimeDays = Math.round(totalLeadTime / planningResults.length * 10) / 10;
}

return [{
  json: {
    planningResults: planningResults,
    analysis: analysis,
    machineSchedules: Object.fromEntries(
      Object.entries(machineSchedules).map(([name, schedule]) => [
        name, 
        {
          ...schedule.machine,
          operationsCount: schedule.operations.length,
          totalTimeHours: Math.round(schedule.totalTime / 60 * 10) / 10
        }
      ])
    ),
    processedAt: new Date().toISOString()
  }
}];
```

### 4️⃣ Alert Generator - "Генерация уведомлений"
```javascript
const { planningResults, analysis } = $json;
const alerts = [];

// Критические алерты для просроченных заказов
planningResults.forEach(result => {
  if (!result.isOnSchedule) {
    const severity = result.daysToDeadline < -7 ? 'critical' : 
                    result.daysToDeadline < -3 ? 'high' : 'medium';
    
    alerts.push({
      id: `deadline-${result.orderId}-${result.operationId}`,
      type: 'deadline_risk',
      severity: severity,
      title: `Заказ ${result.drawingNumber} опаздывает`,
      description: `Операция ${result.operationType} на станке ${result.machine} завершится с опозданием на ${Math.abs(result.daysToDeadline)} дн.`,
      order: result.drawingNumber,
      machine: result.machine,
      daysLate: Math.abs(result.daysToDeadline),
      plannedEnd: result.plannedEndDate,
      deadline: result.deadline,
      createdAt: new Date().toISOString()
    });
  }
});

// Алерты перегрузки станков
Object.entries(analysis.machineUtilization).forEach(([machine, util]) => {
  if (util.loadPercentage > 100) {
    alerts.push({
      id: `overload-${machine}`,
      type: 'resource_overload',
      severity: util.loadPercentage > 150 ? 'high' : 'medium',
      title: `Перегрузка станка ${machine}`,
      description: `Станок загружен на ${util.loadPercentage}% (${util.totalTimeHours}ч, ${util.operationsCount} операций)`,
      machine: machine,
      loadPercentage: util.loadPercentage,
      operationsCount: util.operationsCount,
      createdAt: new Date().toISOString()
    });
  }
});

// Алерт низкой эффективности планирования
const onTimePercentage = (analysis.onScheduleOperations / analysis.totalOperations) * 100;
if (onTimePercentage < 80) {
  alerts.push({
    id: `efficiency-warning`,
    type: 'planning_efficiency',
    severity: onTimePercentage < 60 ? 'high' : 'medium',
    title: `Низкая эффективность планирования`,
    description: `Только ${Math.round(onTimePercentage)}% операций выполняются в срок`,
    onTimePercentage: Math.round(onTimePercentage),
    totalOperations: analysis.totalOperations,
    createdAt: new Date().toISOString()
  });
}

return [{
  json: {
    ...($json),
    alerts: alerts,
    alertsSummary: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length
    }
  }
}];
```

### 5️⃣ Database Storage - "Сохранение в БД"
**PostgreSQL Node:**
```sql
-- Создание таблицы планирования
CREATE TABLE IF NOT EXISTS production_planning (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  operation_id VARCHAR(255) NOT NULL,
  drawing_number VARCHAR(255) NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  machine VARCHAR(100) NOT NULL,
  machine_efficiency DECIMAL(3,2),
  planned_start_date TIMESTAMP NOT NULL,
  planned_end_date TIMESTAMP NOT NULL,
  quantity INTEGER NOT NULL,
  estimated_time_minutes INTEGER NOT NULL,
  setup_time_minutes INTEGER NOT NULL,
  buffer_time_minutes INTEGER NOT NULL,
  total_time_minutes INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  is_on_schedule BOOLEAN NOT NULL,
  days_to_deadline INTEGER,
  deadline TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка данных планирования
INSERT INTO production_planning 
(id, order_id, operation_id, drawing_number, operation_type, machine, 
 machine_efficiency, planned_start_date, planned_end_date, quantity,
 estimated_time_minutes, setup_time_minutes, buffer_time_minutes, 
 total_time_minutes, priority, is_on_schedule, days_to_deadline, 
 deadline, status)
VALUES 
{{ $json.planningResults.map(r => `(
  '${r.id}', '${r.orderId}', '${r.operationId}', '${r.drawingNumber}',
  '${r.operationType}', '${r.machine}', ${r.machineEfficiency},
  '${r.plannedStartDate}', '${r.plannedEndDate}', ${r.quantity},
  ${r.estimatedTimeMinutes}, ${r.setupTimeMinutes}, ${r.bufferTimeMinutes},
  ${r.totalTimeMinutes}, ${r.priority}, ${r.isOnSchedule}, 
  ${r.daysToDeadline}, '${r.deadline}', '${r.status}'
)`).join(',') }}
ON CONFLICT (id) DO UPDATE SET
  planned_start_date = EXCLUDED.planned_start_date,
  planned_end_date = EXCLUDED.planned_end_date,
  is_on_schedule = EXCLUDED.is_on_schedule,
  days_to_deadline = EXCLUDED.days_to_deadline,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;
```

### 6️⃣ Split on Alerts - "Условный узел"
**IF Node:**
```
Condition: {{ $json.alerts.length > 0 }}
```

### 7️⃣ Send Notifications - "Отправка уведомлений"
**Telegram Bot Node:**
```
Chat ID: YOUR_CHAT_ID
Message:
🚨 *Планирование TheWho* - {{ $json.alerts.length }} проблем обнаружено

📊 *Статистика:*
• Всего операций: {{ $json.analysis.totalOperations }}
• В срок: {{ $json.analysis.onScheduleOperations }} ✅
• С опозданием: {{ $json.analysis.lateOperations }} ⚠️  
• Средний срок: {{ $json.analysis.averageLeadTimeDays }} дн.

🔴 *Критические проблемы:*
{{ $json.alerts.filter(a => a.severity === 'critical').map(a => 
  `• ${a.title}\n  ${a.description}`
).join('\n') }}

🟠 *Высокий приоритет:*
{{ $json.alerts.filter(a => a.severity === 'high').map(a => 
  `• ${a.title}\n  ${a.description}`
).join('\n') }}

🟡 *Средний приоритет:*
{{ $json.alerts.filter(a => a.severity === 'medium').map(a => 
  `• ${a.title}\n  ${a.description}`
).join('\n') }}

📅 Время: {{ new Date().toLocaleString('ru-RU') }}
```

### 8️⃣ Success Response - "Ответ успеха"
**Respond to Webhook Node:**
```json
{
  "status": "success",
  "message": "Планирование выполнено успешно",
  "timestamp": "{{ new Date().toISOString() }}",
  "results": {
    "totalOrders": {{ $json.analysis.totalOrders }},
    "totalOperations": {{ $json.analysis.totalOperations }},
    "onScheduleOperations": {{ $json.analysis.onScheduleOperations }},
    "lateOperations": {{ $json.analysis.lateOperations }},
    "alertsGenerated": {{ $json.alerts.length }},
    "averageLeadTimeDays": {{ $json.analysis.averageLeadTimeDays }}
  },
  "machineUtilization": {{ JSON.stringify($json.analysis.machineUtilization) }},
  "alerts": {{ JSON.stringify($json.alertsSummary) }},
  "planningId": "{{ Date.now() }}"
}
```

### 9️⃣ Error Handler - "Обработка ошибок"
**Code Node для catch-блока:**
```javascript
const error = $input.first().error || {};

console.error('Planning workflow error:', error);

return [{
  json: {
    status: 'error',
    message: 'Ошибка при планировании производства',
    error: {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      details: error.details || 'No additional details'
    },
    timestamp: new Date().toISOString(),
    input: $json
  }
}];
```

**Error Response Node:**
```json
{
  "status": "error",
  "message": "{{ $json.message }}",
  "timestamp": "{{ $json.timestamp }}",
  "error": "{{ $json.error.message }}"
}
```

## 🔧 Настройка workflow

### Шаг 1: Создание в n8n
1. Создайте новый workflow
2. Добавьте все узлы из списка выше
3. Соедините узлы согласно логике:
   ```
   Webhook → Validation → Planning → Alert Generation → Split
   ├── (if alerts) → Notifications
   └── Database Storage → Response
   ```

### Шаг 2: Настройка webhook в TheWho
В файле `src/hooks/useProductionPlanning.ts` обновите URL:
```typescript
const url = 'https://your-n8n-domain.com/webhook/thewho-orders';
```

### Шаг 3: Настройка базы данных
- Создайте соединение PostgreSQL в n8n
- Выполните SQL скрипт создания таблицы

### Шаг 4: Настройка уведомлений
- Создайте Telegram бота
- Добавьте chat ID в настройки узла

## 🧪 Тестирование

### Тестовые данные:
```bash
curl -X POST "https://your-n8n-domain.com/webhook/thewho-orders" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "production_planning",
    "timestamp": "2025-05-18T18:33:17.000Z",
    "source": "TheWho App",
    "data": {
      "orders": [
        {
          "id": "test-order-1",
          "drawingNumber": "TEST-001",
          "deadline": "2025-05-25T00:00:00.000Z",
          "quantity": 10,
          "priority": 3,
          "operations": [
            {
              "id": "test-op-1",
              "sequenceNumber": 1,
              "operationType": "milling",
              "estimatedTime": 45,
              "status": "pending"
            },
            {
              "id": "test-op-2",
              "sequenceNumber": 2,
              "operationType": "turning",
              "estimatedTime": 30,
              "status": "pending"
            }
          ]
        }
      ]
    }
  }'
```

## 📈 Мониторинг

1. **Логи:** Проверяйте execution history в n8n
2. **Метрики:** Отслеживайте время выполнения workflow 
3. **Ошибки:** Настройте email уведомления об ошибках
4. **База данных:** Мониторьте размер таблицы планирования

## 🚀 Расширения

- **Машинное обучение:** Добавить предсказание времени выполнения
- **Календарь:** Интеграция с Google Calendar/Outlook
- **Дашборд:** Создать дашборд в Grafana/Power BI
- **Mobile:** Push-уведомления через FCM
- **ERP:** Интеграция с 1C/SAP