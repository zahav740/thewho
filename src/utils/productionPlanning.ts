// Адаптированные алгоритмы планирования для TheWho приложения с исправлением проблемы назначения нескольких операций на один станок
import { Order, Operation, Shift, Machine, MACHINES } from '../types';
import { v4 as uuidv4 } from 'uuid';
import IsraeliCalendar from './israeliCalendar';

// Дополнительные типы для планирования
export interface PlanningResult {
  id: string;
  orderId: string;
  operationId: string;
  machine: Machine;
  plannedStartDate: string;
  plannedEndDate: string;
  quantityAssigned: number;
  remainingQuantity: number;
  expectedTimeMinutes: number;
  setupTimeMinutes: number;
  bufferTimeMinutes: number;
  status: 'planned' | 'in-progress' | 'completed' | 'rescheduled';
  lastRescheduledAt?: string;
  rescheduledReason?: string;
}

export interface ForceMajeure {
  id: string;
  type: 'machine_breakdown' | 'tool_shortage' | 'operator_absence' | 
        'material_shortage' | 'quality_issue' | 'power_outage' | 'other';
  entityType: 'machine' | 'operator' | 'order';
  entityId: string;
  startTime: string;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  status: 'active' | 'resolved' | 'partially_resolved';
  affectedOrders: string[];
  affectedOperations: string[];
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Alert {
  id: string;
  type: 'deadline_risk' | 'performance_deviation' | 'force_majeure' | 
        'resource_shortage' | 'queue_overload' | 'system_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedEntityType: 'order' | 'operation' | 'machine' | 'system';
  affectedEntityId?: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'ignored';
  createdAt: string;
  resolvedAt?: string;
}

export interface MachineConfiguration {
  name: Machine;
  type: "milling" | "turning";
  supports3Axis: boolean;
  supports4Axis: boolean;
  supportsTurning: boolean;
  supportsMilling: boolean;
  efficiencyFactor: number;
  historicalDowntimeProbability: number;
  workingHoursPerDay: number;
  isActive: boolean;
  currentSetupType?: string;
}

// Конфигурация станков с учетом токарных и фрезерных работ
export const MACHINE_CONFIGURATIONS: MachineConfiguration[] = [
  {
    name: "Doosan Yashana",
    type: "milling",
    supports3Axis: true,
    supports4Axis: true,
    supportsTurning: false,
    supportsMilling: true,
    efficiencyFactor: 1.0,
    historicalDowntimeProbability: 0.08,
    workingHoursPerDay: 960,
    isActive: true
  },
  {
    name: "Doosan Hadasha",
    type: "milling",
    supports3Axis: true,
    supports4Axis: true,
    supportsTurning: false,
    supportsMilling: true,
    efficiencyFactor: 1.1,
    historicalDowntimeProbability: 0.05,
    workingHoursPerDay: 960,
    isActive: true
  },
  {
    name: "Doosan 3",
    type: "milling",
    supports3Axis: true,
    supports4Axis: false,
    supportsTurning: false,
    supportsMilling: true,
    efficiencyFactor: 0.9,
    historicalDowntimeProbability: 0.12,
    workingHoursPerDay: 960,
    isActive: true
  },
  {
    name: "Pinnacle Gdola",
    type: "milling",
    supports3Axis: true,
    supports4Axis: true,
    supportsTurning: false,
    supportsMilling: true,
    efficiencyFactor: 1.2,
    historicalDowntimeProbability: 0.06,
    workingHoursPerDay: 960,
    isActive: true
  },
  {
    name: "Mitsubishi",
    type: "milling",
    supports3Axis: true,
    supports4Axis: false,
    supportsTurning: false,
    supportsMilling: true,
    efficiencyFactor: 0.8,
    historicalDowntimeProbability: 0.15,
    workingHoursPerDay: 960,
    isActive: true
  },
  {
    name: "Okuma",
    type: "turning",
    supports3Axis: false,
    supports4Axis: false,
    supportsTurning: true,
    supportsMilling: false,
    efficiencyFactor: 1.0,
    historicalDowntimeProbability: 0.07,
    workingHoursPerDay: 960,
    isActive: true
  },
  {
    name: "JonFord",
    type: "turning",
    supports3Axis: false,
    supports4Axis: false,
    supportsTurning: true,
    supportsMilling: false,
    efficiencyFactor: 0.85,
    historicalDowntimeProbability: 0.10,
    workingHoursPerDay: 960,
    isActive: true
  }
];

// Класс для управления планированием с учетом израильского календаря
export class ProductionPlanner {
  private machineConfigs: MachineConfiguration[];
  
  constructor(machineConfigs: MachineConfiguration[] = MACHINE_CONFIGURATIONS) {
    this.machineConfigs = machineConfigs;
  }

  // Основной алгоритм планирования с гарантией, что один станок выполняет только одну операцию
  public async planOrders(orders: Order[]): Promise<PlanningResult[]> {
    console.log('\n🚀 === НАЧИНАЕМ ПЛАНИРОВАНИЕ ПРОИЗВОДСТВА ===');
    console.log('📝 Входные данные:');
    console.log(`   📦 Заказов получено: ${orders.length}`);
    
    if (orders.length === 0) {
      console.warn('⚠️ Нет заказов для планирования!');
      return [];
    }
    
    // Выводим краткую информацию о каждом заказе
    orders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.drawingNumber} - дедлайн: ${new Date(order.deadline).toLocaleDateString('ru-RU')}, приоритет: ${order.priority}`);
    });
    
    // Предварительная обработка заказов: проверка просроченных дедлайнов
    const processedOrders = this.preprocessOrdersForPlanning(orders);
    
    console.log(`\n📊 После предварительной обработки: ${processedOrders.length} заказов`);
    
    // Сортируем заказы по приоритету и дедлайну
    const sortedOrders = this.sortOrdersByPriorityAndDeadline(processedOrders);
    const planningResults: PlanningResult[] = [];
    
    // Карта занятости станков: machine -> [{ start, end, operationId }]
    const machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>> = new Map();
    
    // Инициализируем расписание для каждого станка
    for (const machine of this.machineConfigs) {
      machineSchedule.set(machine.name, []);
    }
    
    console.log('🔧 Начинаем планирование с контролем занятости станков...');
    
    for (const order of sortedOrders) {
      if (!order.operations || order.operations.length === 0) {
        continue;
      }

      // Строим граф зависимостей операций
      const dependencyGraph = this.buildDependencyGraph(order.operations);
      
      // Топологическая сортировка операций
      const sortedOperations = this.topologicalSort(order.operations, dependencyGraph);
      
      // Карта завершенных операций и их дат окончания
      const completedOperations: Map<string, Date> = new Map();
      
      for (const operation of sortedOperations) {
        // Проверяем, действительно ли операция не выполнена
        if (this.isOperationCompleted(operation, order)) {
          console.log(`⏭️ Операция ${operation.sequenceNumber} заказа ${order.drawingNumber} уже выполнена, пропускаем`);
          
          // Добавляем в карту завершенных с текущей датой
          const now = new Date();
          completedOperations.set(operation.id, now);
          continue;
        }
        
        console.log(`🔧 Планируем операцию ${operation.sequenceNumber} (ID: ${operation.id}) заказа ${order.drawingNumber}, тип: ${operation.operationType}`);
        
        // ДИАГНОСТИКА: Проверяем, почему операция может быть пропущена
        console.log(`🔍 Детальная проверка операции ${operation.sequenceNumber}:`);
        console.log(`   - ID операции: ${operation.id}`);
        console.log(`   - Тип операции: ${operation.operationType}`);
        console.log(`   - Время выполнения: ${operation.estimatedTime} мин`);
        console.log(`   - Заказ просрочен: ${(order as any).isOverdue || false}`);
        console.log(`   - Дней просрочки: ${(order as any).daysOverdue || 0}`);
        console.log(`   - Приоритет заказа: ${order.priority}`);
      
      // Определяем самую раннюю дату начала с учетом зависимостей
      const earliestStartDate = this.determineEarliestStartDate(operation, completedOperations, order);
      console.log(`   - Самая ранняя дата начала: ${earliestStartDate.toLocaleString()}`);
      
      // Определяем, является ли заказ критическим (просроченный или высокий приоритет)
      const isCriticalOrder = this.isCriticalOrder(order);
      console.log(`   - Критический заказ: ${isCriticalOrder}`);
      
      // Выбираем подходящий станок с учетом загрузки
      console.log(`   - Ищем подходящий станок для операции...`);
      let machineSelection = await this.selectMachineWithScheduling(operation, order, earliestStartDate, machineSchedule, isCriticalOrder);
      
      if (!machineSelection) {
        console.log(`   - 🔴 НЕ НАЙДЕН подходящий станок обычным способом`);
      } else {
        console.log(`   - ✅ Найден станок: ${machineSelection.machine.name}`);
      }
        
        // Если не нашли место для критического заказа, пытаемся освободить слот
        if (!machineSelection && isCriticalOrder) {
          console.log(`🚨 Критический заказ ${order.drawingNumber}: пытаемся освободить слот для операции ${operation.sequenceNumber}`);
          machineSelection = await this.findSlotForCriticalOrder(operation, order, earliestStartDate, machineSchedule, this.sortedOrders);
        }
        
        if (!machineSelection) {
          console.warn(`❌ Не найден подходящий станок для операции ${operation.sequenceNumber} заказа ${order.drawingNumber} (ID: ${operation.id}, тип: ${operation.operationType})`);
          continue;
        }

        const { machine: selectedMachine, availableStartTime } = machineSelection;

        // Определяем время наладки
        const setupTime = this.determineSetupTime(operation, selectedMachine);
        
        // Рассчитываем время выполнения
        const baseTimeMinutes = (operation.estimatedTime || 0) * Number(order.quantity || 1);
        const adjustedTime = baseTimeMinutes / (selectedMachine.efficiencyFactor || 1);
        
        // Добавляем буферное время
        const bufferTime = adjustedTime * (selectedMachine.historicalDowntimeProbability || 0.1);
        
        // Общее время
        const totalTime = adjustedTime + setupTime + bufferTime;
        
        // Рассчитываем дату окончания с учетом израильского календаря
        const endDate = await this.calculateEndDate(availableStartTime, totalTime);
        
        // Создаем результат планирования
        const planningResult: PlanningResult = {
          id: uuidv4(),
          orderId: order.id,
          operationId: operation.id,
          machine: selectedMachine.name,
          plannedStartDate: availableStartTime.toISOString(),
          plannedEndDate: endDate.toISOString(),
          quantityAssigned: order.quantity,
          remainingQuantity: order.quantity,
          expectedTimeMinutes: Math.round(adjustedTime),
          setupTimeMinutes: Math.round(setupTime),
          bufferTimeMinutes: Math.round(bufferTime),
          status: 'planned'
        };
        
        planningResults.push(planningResult);
        
        // ВАЖНО: Добавляем операцию в расписание станка
        const schedule = machineSchedule.get(selectedMachine.name) || [];
        schedule.push({
          start: availableStartTime,
          end: endDate,
          operationId: operation.id
        });
        // Сортируем по времени начала для корректного поиска слотов
        schedule.sort((a, b) => a.start.getTime() - b.start.getTime());
        machineSchedule.set(selectedMachine.name, schedule);
        
        console.log(`✅ Запланирована операция ${operation.sequenceNumber} заказа ${order.drawingNumber} на станке ${selectedMachine.name} с ${availableStartTime.toLocaleString()} до ${endDate.toLocaleString()}`);
        
        // Обновляем карту завершенных операций
        completedOperations.set(operation.id, endDate);
        
        // Обновляем текущий тип наладки станка
        selectedMachine.currentSetupType = this.getOperationSetupType(operation);
      }
    }
    
    console.log(`🎯 Планирование завершено. Запланировано ${planningResults.length} операций.`);
    
    // Выводим итоговое расписание для проверки
    console.log('📊 Итоговое расписание станков:');
    for (const [machineName, schedule] of machineSchedule) {
      if (schedule.length > 0) {
        console.log(`  ${machineName}: ${schedule.length} операций`);
        schedule.forEach((slot, index) => {
          console.log(`    ${index + 1}. ${slot.start.toLocaleString()} - ${slot.end.toLocaleString()} (${slot.operationId})`);
        });
      }
    }
    
    return planningResults;
  }

  // Адаптивное планирование на основе фактических данных
  public async adaptivePlanning(orders: Order[], shifts: Shift[]): Promise<PlanningResult[]> {
    console.log('\n📈 === НАЧИНАЕМ АДАПТИВНОЕ ПЛАНИРОВАНИЕ ===');
    console.log(`📊 Обновляем коэффициенты отклонения на основе ${shifts.length} смен...`);
    
    // Обновляем коэффициенты отклонения операций
    this.updateOperationDeviationFactors(orders, shifts);
    
    // Пересчитываем план с учетом фактических данных
    return this.planOrders(orders);
  }

  // Сортированные заказы (нужны для критического планирования)
  private sortedOrders: Order[] = [];
  
  // Предварительная обработка заказов: обработка просроченных дедлайнов
  private preprocessOrdersForPlanning(orders: Order[]): Order[] {
    const currentDate = new Date();
    const processedOrders: Order[] = [];
    
    console.log('\n📋 === ПРЕДВАРИТЕЛЬНАЯ ОБРАБОТКА ЗАКАЗОВ ===');
    console.log(`📅 Текущая дата: ${currentDate.toLocaleDateString('ru-RU')} (${currentDate.toISOString()})`);
    console.log(`📦 Всего заказов для обработки: ${orders.length}`);
    
    if (orders.length === 0) {
      console.log('⚠️ Нет заказов для обработки!');
      return [];
    }
    
    for (const order of orders) {
      let processedOrder = { ...order };
      const deadline = new Date(order.deadline);
      
      console.log(`\n🔍 Заказ ${order.drawingNumber}:`);
      console.log(`   📅 Дедлайн: ${deadline.toLocaleDateString('ru-RU')}`);
      console.log(`   🏗️ Операций: ${order.operations.length}`);
      console.log(`   🔢 Количество: ${order.quantity}`);
      console.log(`   ⭐ Приоритет: ${order.priority}`);
      
      // Проверяем, просрочен ли дедлайн
      if (deadline < currentDate) {
        const daysOverdue = Math.ceil((currentDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        console.warn(`⚠️ ПРОСРОЧЕННЫЙ ДЕДЛАЙН: Заказ ${order.drawingNumber} просрочен на ${daysOverdue} дней!`);
        
        // НЕ повышаем приоритет - оставляем исходный!
        console.log(`📌 Приоритет остается прежним: ${processedOrder.priority} (просрочка не меняет приоритет)`);
        
        // Добавляем степень просрочки для сортировки внутри приоритета
        (processedOrder as any).daysOverdue = daysOverdue;
        (processedOrder as any).isOverdue = true;
        
        // Вычисляем новый реалистичный дедлайн
        const newDeadline = this.calculateRealisticDeadline(processedOrder, currentDate);
        console.log(`📅 Переопределяем дедлайн с ${deadline.toLocaleDateString('ru-RU')} на ${newDeadline.toLocaleDateString('ru-RU')}`);
        processedOrder.deadline = newDeadline.toISOString();
        
        // Создаем алерт о просроченном заказе
        this.createOverdueOrderAlert(processedOrder, deadline, newDeadline);
      } else {
        const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`✅ Дедлайн в пределах нормы (через ${daysUntilDeadline} дней)`);
        
        // Для не просроченных заказов
        (processedOrder as any).daysOverdue = 0;
        (processedOrder as any).isOverdue = false;
      }
      
      // Проверяем статус операций
      let completedOps = 0;
      let inProgressOps = 0;
      let pendingOps = 0;
      
      processedOrder.operations.forEach(op => {
        const extendedOp = op as any;
        const status = extendedOp.completionStatus || 'unknown';
        
        switch (status) {
          case 'completed': completedOps++; break;
          case 'in-progress': inProgressOps++; break;
          case 'pending': pendingOps++; break;
          default: pendingOps++; break;
        }
      });
      
      console.log(`   📊 Статус операций: завершено ${completedOps}, в процессе ${inProgressOps}, ожидает ${pendingOps}`);
      
      processedOrders.push(processedOrder);
    }
    
    console.log(`\n✅ Обработано ${processedOrders.length} заказов`);
    
    // Сохраняем обработанные заказы для критического планирования
    this.sortedOrders = processedOrders;
    
    return processedOrders;
  }
  
  // Проверка, действительно ли операция завершена (через анализ смен)
  private isOperationCompleted(operation: Operation, order: Order): boolean {
    // ДИАГНОСТИКА: Подробно проверяем статус операции
    console.log(`      🔍 Проверка завершенности операции ${operation.sequenceNumber}:`);
    
    // Проверяем дополнительные поля, которые могли быть добавлены при обогащении
    const extendedOperation = operation as Operation & {
      completionStatus?: string;
      completedUnits?: number;
    };
    
    console.log(`        - completionStatus: ${extendedOperation.completionStatus || 'нет'}`);
    console.log(`        - completedUnits: ${extendedOperation.completedUnits || 'нет'}`);
    console.log(`        - actualTime: ${operation.actualTime || 'нет'}`);
    console.log(`        - estimatedTime: ${operation.estimatedTime || 'нет'}`);
    console.log(`        - Количество в заказе: ${order.quantity}`);
    
    // Основная проверка через статус
    if (extendedOperation.completionStatus === 'completed') {
      console.log(`        → Операция отмечена как completed`);
      return true;
    }
    
    // Дополнительная проверка по количеству выполненных единиц
    if (typeof extendedOperation.completedUnits === 'number' && extendedOperation.completedUnits >= order.quantity) {
      console.log(`        → Операция завершена по количеству: ${extendedOperation.completedUnits}/${order.quantity}`);
      return true;
    }
    
    // Если у операции есть actualTime и она равна или больше estimatedTime,
    // считаем выполненной
    if (operation.actualTime && operation.estimatedTime && operation.actualTime >= operation.estimatedTime) {
      console.log(`        → Операция завершена по времени: ${operation.actualTime} >= ${operation.estimatedTime}`);
      return true;
    }
    
    // По умолчанию считаем операцию не завершенной
    console.log(`        → Операция НЕ завершена (по умолчанию)`);
    return false;
  }
  
  // Вычисление реалистичного дедлайна для просроченного заказа
  private calculateRealisticDeadline(order: Order, fromDate: Date): Date {
    // Суммируем время всех операций
    const totalTimeMinutes = order.operations.reduce((total, op) => {
      return total + (op.estimatedTime || 0) * order.quantity;
    }, 0);
    
    // Добавляем 30% буфер и время наладки (примерно 60 мин на операцию)
    const bufferedTimeMinutes = totalTimeMinutes * 1.3 + (order.operations.length * 60);
    
    // Учитываем рабочие дни (примерно 8 часов в день)
    const workingDaysNeeded = Math.ceil(bufferedTimeMinutes / 480); // 480 мин = 8 часов
    
    // Создаем новую дату, добавляя рабочие дни + небольшой запас
    const calculatedDeadline = new Date(fromDate);
    
    // Добавляем дни с учетом выходных (множим на 1.4 для учета выходных)
    const calendarDaysToAdd = Math.ceil(workingDaysNeeded * 1.4) + 2; // +2 дня запас
    calculatedDeadline.setDate(calculatedDeadline.getDate() + calendarDaysToAdd);
    
    return calculatedDeadline;
  }
  
  // Создание алерта о просроченном заказе
  private createOverdueOrderAlert(order: Order, originalDeadline: Date, newDeadline: Date): void {
    const daysOverdue = Math.ceil((new Date().getTime() - originalDeadline.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`🚨 Создан алерт: Заказ ${order.drawingNumber} просрочен на ${daysOverdue} дней`);
    
    // В реальной системе здесь бы создавался алерт в базе данных
    // Пока просто логируем
  }
  private sortOrdersByPriorityAndDeadline(orders: Order[]): Order[] {
    console.log('\n🔄 === СОРТИРОВКА ЗАКАЗОВ ===');
    console.log('📋 Логика сортировки:');
    console.log('   1. По приоритету (МЕНЬШИЙ номер = ВЫШЕ важность: 1 > 2 > 3)');
    console.log('   2. Внутри приоритета: просроченные в порядке убывания просрочки');
    console.log('   3. Затем: обычные заказы по дедлайну (раньше = выше важность)');
    
    const sorted = orders.sort((a, b) => {
      // 1. Сначала по приоритету (МЕНЬШИЙ номер = ВЫШЕ важность: 1 > 2 > 3)
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Меньший номер приоритета идет первым
      }
      
      // 2. Внутри одного приоритета: просроченные сначала
      const aOverdue = (a as any).isOverdue || false;
      const bOverdue = (b as any).isOverdue || false;
      const aDaysOverdue = (a as any).daysOverdue || 0;
      const bDaysOverdue = (b as any).daysOverdue || 0;
      
      // Если один просрочен, а другой нет - просроченный идет первым
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Если оба просрочены - сортируем по степени просрочки (больше просрочка = выше)
      if (aOverdue && bOverdue) {
        return bDaysOverdue - aDaysOverdue; // От большей просрочки к меньшей
      }
      
      // 3. Если оба не просрочены - сортируем по дедлайну (раньше = выше важность)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    
    // Логируем результат сортировки
    console.log('\n📋 Результат сортировки:');
    sorted.forEach((order, index) => {
      const overdue = (order as any).isOverdue || false;
      const daysOverdue = (order as any).daysOverdue || 0;
      const overdueInfo = overdue ? ` (просрочен на ${daysOverdue} дней)` : '';
      const deadline = new Date(order.deadline).toLocaleDateString('ru-RU');
      
      console.log(`   ${index + 1}. ${order.drawingNumber} - приоритет ${order.priority}, дедлайн ${deadline}${overdueInfo}`);
    });
    
    return sorted;
  }

  // Построение графа зависимостей операций
  private buildDependencyGraph(operations: Operation[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Сортируем операции по sequenceNumber
    const sortedOps = operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    for (let i = 0; i < sortedOps.length; i++) {
      const operation = sortedOps[i];
      graph.set(operation.id, []);
      
      // Каждая операция зависит от предыдущей (кроме первой)
      if (i > 0) {
        const dependencies = graph.get(operation.id) || [];
        dependencies.push(sortedOps[i - 1].id);
        graph.set(operation.id, dependencies);
      }
    }
    
    return graph;
  }

  // Топологическая сортировка операций
  private topologicalSort(operations: Operation[], dependencyGraph: Map<string, string[]>): Operation[] {
    const visited = new Set<string>();
    const result: Operation[] = [];
    const operationMap = new Map(operations.map(op => [op.id, op]));
    
    const visit = (operationId: string) => {
      if (visited.has(operationId)) return;
      visited.add(operationId);
      
      const dependencies = dependencyGraph.get(operationId) || [];
      for (const depId of dependencies) {
        visit(depId);
      }
      
      const operation = operationMap.get(operationId);
      if (operation) {
        result.push(operation);
      }
    };
    
    for (const operation of operations) {
      visit(operation.id);
    }
    
    return result;
  }

  // Определение самой ранней даты начала операции с учетом последовательности
  private determineEarliestStartDate(operation: Operation, completedOperations: Map<string, Date>, order: Order): Date {
    const now = new Date();
    let earliestDate = now;
    
    // Находим предыдущую операцию в том же заказе
    const orderOperations = order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const currentIndex = orderOperations.findIndex(op => op.id === operation.id);
    
    if (currentIndex > 0) {
      // Если это не первая операция, ждем завершения предыдущей
      const previousOperation = orderOperations[currentIndex - 1];
      const previousEndDate = completedOperations.get(previousOperation.id);
      
      if (previousEndDate && previousEndDate > earliestDate) {
        earliestDate = previousEndDate;
      }
    }
    
    return earliestDate;
  }

  // ИСПРАВЛЕННЫЙ метод выбора станка с учетом расписания и загрузки
  private async selectMachineWithScheduling(
    operation: Operation, 
    order: Order, 
    earliestStartDate: Date,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>,
    emergencyMode: boolean = false
  ): Promise<{ machine: MachineConfiguration; availableStartTime: Date } | null> {
    console.log(`    🔎 Подробный поиск станка для операции ${operation.operationType}:`);
    
    // Фильтруем станки по типу операции
    const compatibleMachines = this.machineConfigs.filter(machine => {
      // Проверяем совместимость по типу операции
      switch (operation.operationType) {
        case '3-axis':
          return machine.supports3Axis && machine.supportsMilling && machine.isActive;
        case '4-axis':
          return machine.supports4Axis && machine.supportsMilling && machine.isActive;
        case 'milling':
          return machine.supportsMilling && machine.isActive;
        case 'turning':
          return machine.supportsTurning && machine.isActive;
        default:
          console.warn(`⚠️ Неизвестный тип операции: ${operation.operationType}. Разрешаем планирование на всех активных станках.`);
          return machine.isActive;
      }
    });
    
    console.log(`      - Совместимые станки: ${compatibleMachines.map(m => m.name).join(', ')}`);
    
    if (compatibleMachines.length === 0) {
      console.log(`      - ❌ Нет совместимых станков!`);
      return null;
    }

    // Рассчитываем примерное время выполнения для планирования
    const setupTime = this.determineSetupTime(operation, compatibleMachines[0]); // примерное время наладки
    const baseTimeMinutes = (operation.estimatedTime || 0) * Number(order.quantity || 1);
    const estimatedDuration = baseTimeMinutes + setupTime;
    
    console.log(`      - Операция: ${baseTimeMinutes} мин, наладка: ${setupTime} мин, общая продолжительность: ${estimatedDuration} мин`);
    console.log(`      - Самая ранняя дата начала: ${earliestStartDate.toLocaleString()}`);

    // Если указан предпочтительный станок в операции, проверяем его первым
    if (operation.machine) {
      const preferredMachine = compatibleMachines.find(m => m.name === operation.machine);
      if (preferredMachine) {
        console.log(`      - Проверяем предпочтительный станок: ${preferredMachine.name}`);
        const availableTime = await this.findAvailableTimeSlot(
          preferredMachine.name,
          earliestStartDate,
          estimatedDuration,
          machineSchedule
        );
        if (availableTime) {
          console.log(`🎯 Использован предпочтительный станок ${preferredMachine.name} для операции ${operation.sequenceNumber}`);
          return { machine: preferredMachine, availableStartTime: availableTime };
        } else {
          console.log(`      - Предпочтительный станок недоступен`);
        }
      }
    }
    
    // Ищем станок с наименьшим временем ожидания
    let bestOption: { machine: MachineConfiguration; availableStartTime: Date } | null = null;
    let shortestWait = Infinity;

    console.log(`      - Проверяем все совместимые станки...`);
    for (const machine of compatibleMachines) {
      console.log(`        • Проверяем ${machine.name}...`);
      const availableTime = await this.findAvailableTimeSlot(
        machine.name,
        earliestStartDate,
        estimatedDuration,
        machineSchedule
      );
      
      if (availableTime) {
        const waitTime = availableTime.getTime() - earliestStartDate.getTime();
        const waitDays = waitTime / (1000 * 60 * 60 * 24);
        console.log(`          - Доступен с ${availableTime.toLocaleString()}, ожидание: ${waitDays.toFixed(1)} дней`);
        
        if (waitTime < shortestWait) {
          shortestWait = waitTime;
          bestOption = { machine, availableStartTime: availableTime };
        }
      } else {
        console.log(`          - Недоступен`);
      }
    }

    if (bestOption) {
      const waitDays = shortestWait / (1000 * 60 * 60 * 24);
      console.log(`⏰ Выбран станок ${bestOption.machine.name} с ожиданием ${waitDays.toFixed(1)} дней`);
    } else {
      console.log(`      - ❌ Ни один станок не подошел`);
    }

    return bestOption;
  }

  // Поиск доступного временного слота для операции с ограничениями:
  // 1. Максимум 2 операции на станок в день
  // 2. Если операция заканчивается до 14:00, больше не назначать операций на этот день
  private async findAvailableTimeSlot(
    machineName: Machine,
    earliestStart: Date,
    estimatedDuration: number,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>
  ): Promise<Date | null> {
    const schedule = machineSchedule.get(machineName) || [];
    
    // Проверяем, может ли операция начаться в запрошенное время
    let candidateStart = new Date(earliestStart);
    
    // Убеждаемся, что начинаем в рабочее время
    candidateStart = await this.adjustToWorkingTime(candidateStart);
    
    let iterations = 0;
    const maxIterations = 100; // защита от бесконечного цикла
    
    while (iterations < maxIterations) {
      const candidateEnd = await this.calculateEndDate(candidateStart, estimatedDuration);
      const candidateDate = candidateStart.toDateString();
      
      // Получаем все операции на станке в кандидатурный день
      const operationsInDay = schedule.filter(slot => {
        return slot.start.toDateString() === candidateDate;
      });
      
      // ОГРАНИЧЕНИЕ 1: Максимум 2 операции на станок в день
      if (operationsInDay.length >= 2) {
        console.log(`⚠️ Станок ${machineName} уже имеет ${operationsInDay.length} операций на ${candidateDate}. Переходим к следующему дню.`);
        candidateStart = await this.getNextWorkingDayStart(candidateStart);
        iterations++;
        continue;
      }
      
      // ОГРАНИЧЕНИЕ 2: Проверка общего времени в день (включая наладку и буфер)
      
      // Рассчитываем примерное общее время операции для проверки лимитов
      const setupTime = this.determineSetupTime({ operationType: 'milling' } as Operation, this.machineConfigs[0]);
      const bufferTime = estimatedDuration * 0.1; // Примерно 10% буфер
      const totalOperationTime = estimatedDuration + setupTime + bufferTime;
      
      const existingTotalTime = this.getTotalTimeForDay(machineName, candidateDate, machineSchedule);
      const existingTimeNum = typeof existingTotalTime === 'number' ? existingTotalTime : Number(existingTotalTime);
      const operationTimeNum = typeof totalOperationTime === 'number' ? totalOperationTime : Number(totalOperationTime);
      
      if (existingTimeNum + operationTimeNum > PlanningUtils.MAX_WORKING_MINUTES_PER_DAY) {
        const overTime = existingTimeNum + operationTimeNum - PlanningUtils.MAX_WORKING_MINUTES_PER_DAY;
        console.log(`⚠️ Станок ${machineName} превысит дневной лимит времени на ${candidateDate}. Текущее время: ${existingTotalTime} мин, добавляемое время: ${totalOperationTime} мин (превышение: ${overTime} мин). Переходим к следующему дню.`);
        candidateStart = await this.getNextWorkingDayStart(candidateStart);
        iterations++;
        continue;
      }
      
      // ОГРАНИЧЕНИЕ 3: Если есть операция, заканчивающаяся до 14:00, больше не назначаем
      const hasEarlyEndingOperation = operationsInDay.some(slot => {
        const endHour = slot.end.getHours();
        const endMinute = slot.end.getMinutes();
        return endHour < 14 || (endHour === 14 && endMinute === 0);
      });
      
      if (hasEarlyEndingOperation) {
        console.log(`⚠️ Станок ${machineName} имеет операцию, заканчивающуюся до 14:00 на ${candidateDate}. Не назначаем больше операций на этот день.`);
        candidateStart = await this.getNextWorkingDayStart(candidateStart);
        iterations++;
        continue;
      }
      
      // ОГРАНИЧЕНИЕ 4: Проверяем, не закончится ли наша операция до 14:00
      const ourEndHour = candidateEnd.getHours();
      const ourEndMinute = candidateEnd.getMinutes();
      const ourEndsEarly = ourEndHour < 14 || (ourEndHour === 14 && ourEndMinute === 0);
      
      // Если наша операция заканчивается до 14:00 и в этот день уже есть операции, ищем другой день
      if (ourEndsEarly && operationsInDay.length > 0) {
        console.log(`⚠️ Операция на станке ${machineName} закончится до 14:00 (${candidateEnd.toLocaleTimeString()}), а в день ${candidateDate} уже есть операции. Переходим к следующему дню.`);
        candidateStart = await this.getNextWorkingDayStart(candidateStart);
        iterations++;
        continue;
      }
      
      // Проверяем конфликты с существующими операциями по времени
      const hasConflict = schedule.some(slot => {
        return (
          (candidateStart >= slot.start && candidateStart < slot.end) ||
          (candidateEnd > slot.start && candidateEnd <= slot.end) ||
          (candidateStart <= slot.start && candidateEnd >= slot.end)
        );
      });
      
      if (!hasConflict) {
        const endTime = candidateEnd.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        const dayInfo = ourEndsEarly ? ' (заканчивается рано - блокирует день)' : '';
        const totalTimeInfo = ` Общее время в день: ${existingTimeNum + operationTimeNum}/${PlanningUtils.MAX_WORKING_MINUTES_PER_DAY} мин.`;
        console.log(`✅ Найден свободный слот на станке ${machineName} на ${candidateDate}. Операция до ${endTime}${dayInfo}. Всего операций в этот день: ${operationsInDay.length + 1}.${totalTimeInfo}`);
        return candidateStart;
      }
      
      // Найти следующий свободный слот
      const conflictingSlots = schedule.filter(slot => 
        (candidateStart >= slot.start && candidateStart < slot.end) ||
        (candidateEnd > slot.start && candidateEnd <= slot.end) ||
        (candidateStart <= slot.start && candidateEnd >= slot.end)
      );
      
      if (conflictingSlots.length > 0) {
        // Берем конец самого позднего конфликтующего слота
        const latestEnd = conflictingSlots.reduce((latest, slot) => 
          slot.end > latest ? slot.end : latest, conflictingSlots[0].end);
        candidateStart = new Date(latestEnd);
        candidateStart = await this.adjustToWorkingTime(candidateStart);
      } else {
        break;
      }
      
      iterations++;
    }
    
    // В данном контексте emergencyMode не передается, используем параметр из аргументов findAvailableTimeSlot
    // Для обратной совместимости проверим, не превышает ли время ожидания разумные пределы
    const maxWaitDays = 60; // Стандартный лимит ожидания
    if (candidateStart.getTime() - earliestStart.getTime() > maxWaitDays * 24 * 60 * 60 * 1000) {
      console.warn(`⚠️ Станок ${machineName} слишком загружен. Время ожидания превышает ${maxWaitDays} дней.`);
      return null;
    }
    
    return candidateStart;
  }
  
  // Вспомогательный метод для получения начала следующего рабочего дня
  private async getNextWorkingDayStart(currentDate: Date): Promise<Date> {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    
    const nextWorkingDay = await IsraeliCalendar.getNextWorkingDay(nextDay);
    nextWorkingDay.setHours(8, 0, 0, 0);
    
    return nextWorkingDay;
  }
  
  // Расчет общего времени операций на станке в определенный день
  private getTotalTimeForDay(
    machineName: Machine,
    date: Date | string,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>
  ): number {
    const targetDate = typeof date === 'string' ? date : date.toDateString();
    const schedule = machineSchedule.get(machineName) || [];
    
    return schedule
      .filter(slot => slot.start.toDateString() === targetDate)
      .reduce((total, slot) => {
        const duration = slot.end.getTime() - slot.start.getTime();
        return total + Math.round(duration / (1000 * 60)); // конвертируем в минуты
      }, 0);
  }
  
  // Корректировка времени к рабочему времени
  private async adjustToWorkingTime(date: Date): Promise<Date> {
    const isWorking = await IsraeliCalendar.isWorkingDay(date);
    
    if (!isWorking) {
      // Переходим к следующему рабочему дню
      const nextWorkingDay = await IsraeliCalendar.getNextWorkingDay(date);
      nextWorkingDay.setHours(8, 0, 0, 0);
      return nextWorkingDay;
    }
    
    // Проверяем рабочие часы
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    if (hour < 8) {
      // До начала рабочего дня
      date.setHours(8, 0, 0, 0);
    } else if ((dayOfWeek >= 0 && dayOfWeek <= 4 && hour >= 16) || (dayOfWeek === 5 && hour >= 14)) {
      // После окончания рабочего дня
      const nextWorkingDay = await IsraeliCalendar.getNextWorkingDay(date);
      nextWorkingDay.setHours(8, 0, 0, 0);
      return nextWorkingDay;
    }
    
    return date;
  }

  // Определение времени наладки с учетом типа операции
  private determineSetupTime(operation: Operation, machine: MachineConfiguration): number {
    // Базовое время наладки в зависимости от типа операции
    let baseSetupTime: number;
    
    switch (operation.operationType) {
      case '4-axis':
        baseSetupTime = 90; // 4-коорд фрезерование - сложная наладка
        break;
      case '3-axis':
        baseSetupTime = 60; // 3-коорд фрезерование
        break;
      case 'milling':
        baseSetupTime = 45; // Обычное фрезерное
        break;
      case 'turning':
        baseSetupTime = 30; // Токарная обработка
        break;
      default:
        baseSetupTime = 60;
    }
    
    // Если станок уже настроен на тот же тип операции, время наладки меньше
    const currentSetupType = this.getOperationSetupType(operation);
    if (machine.currentSetupType === currentSetupType) {
      return baseSetupTime * 0.3; // 30% от базового времени
    }
    
    return baseSetupTime;
  }

  // Получение типа наладки операции
  private getOperationSetupType(operation: Operation): string {
    return `${operation.operationType}-setup`;
  }

  // Рассчет даты окончания с учетом израильского календаря и рабочих дней
  private async calculateEndDate(startDate: Date, totalMinutes: number): Promise<Date> {
    let currentDate = new Date(startDate);
    let remainingMinutes = totalMinutes;
    
    while (remainingMinutes > 0) {
      // Проверяем, является ли день рабочим (учитывает выходные и праздники Израиля)
      const isWorking = await IsraeliCalendar.isWorkingDay(currentDate);
      
      if (!isWorking) {
        // Переходим к следующему дню
        currentDate = await IsraeliCalendar.getNextWorkingDay(currentDate);
        currentDate.setHours(8, 0, 0, 0); // Начало рабочего дня
        continue;
      }
      
      // Определяем рабочие часы для текущего дня
      const dayOfWeek = currentDate.getDay();
      let dayMinutes: number;
      
      if (dayOfWeek >= 0 && dayOfWeek <= 4) {
        // Воскресенье-четверг: 8:00-16:00 (480 минут)
        dayMinutes = 480;
      } else if (dayOfWeek === 5) {
        // Пятница: 8:00-14:00 (360 минут)
        dayMinutes = 360;
      } else {
        // Суббота - не должно быть рабочим днем, но на всякий случай
        dayMinutes = 0;
      }
      
      // Считаем доступные минуты в текущем дне
      let availableMinutes = dayMinutes;
      
      // Если это первый день, учитываем текущее время
      if (currentDate.getTime() === startDate.getTime()) {
        const currentHour = currentDate.getHours();
        const currentMinute = currentDate.getMinutes();
        
        if (currentHour < 8) {
          // До начала рабочего дня
          currentDate.setHours(8, 0, 0, 0);
          availableMinutes = dayMinutes;
        } else {
          // В течение рабочего дня
          const endHour = dayOfWeek === 5 ? 14 : 16; // Пятница до 14:00, остальные до 16:00
          
          if (currentHour >= endHour) {
            // После окончания рабочего дня - переходим к следующему дню
            currentDate = await IsraeliCalendar.getNextWorkingDay(currentDate);
            currentDate.setHours(8, 0, 0, 0);
            continue;
          } else {
            // В течение рабочего дня
            const usedMinutes = (currentHour - 8) * 60 + currentMinute;
            availableMinutes = dayMinutes - usedMinutes;
          }
        }
      }
      
      if (remainingMinutes <= availableMinutes) {
        // Все оставшееся время помещается в текущий день
        currentDate.setMinutes(currentDate.getMinutes() + remainingMinutes);
        remainingMinutes = 0;
      } else {
        // Переходим к следующему рабочему дню
        remainingMinutes -= availableMinutes;
        currentDate = await IsraeliCalendar.getNextWorkingDay(currentDate);
        currentDate.setHours(8, 0, 0, 0);
      }
    }
    
    return currentDate;
  }

  // Обновление коэффициентов отклонения операций
  private updateOperationDeviationFactors(orders: Order[], shifts: Shift[]): void {
    const operationStats = new Map<string, {
      totalProduced: number;
      totalTimeSpent: number;
      totalExpectedTime: number;
    }>();

    // Собираем статистику по операциям из смен
    for (const shift of shifts) {
      for (const operation of shift.operations) {
        const stats = operationStats.get(operation.operationId) || {
          totalProduced: 0,
          totalTimeSpent: 0,
          totalExpectedTime: 0
        };
        
        stats.totalProduced += operation.completedUnits;
        stats.totalTimeSpent += Number(operation.timeSpent || 0);
        
        // Находим операцию в заказах для получения планового времени
        const order = orders.find(o => o.operations.some(op => op.id === operation.operationId));
        if (order) {
          const orderOperation = order.operations.find(op => op.id === operation.operationId);
          if (orderOperation && orderOperation.estimatedTime) {
            stats.totalExpectedTime += (orderOperation.estimatedTime || 0) * operation.completedUnits;
          }
        }
        
        operationStats.set(operation.operationId, stats);
      }
    }

    // Обновляем фактическое время операций на основе статистики
    for (const order of orders) {
      for (const operation of order.operations) {
        const stats = operationStats.get(operation.id);
        if (stats && stats.totalProduced > 0) {
          const actualTimePerUnit = stats.totalTimeSpent / stats.totalProduced;
          operation.actualTime = actualTimePerUnit;
        }
      }
    }
  }

  // Обработка форс-мажорных ситуаций
  public async handleForceMajeure(forceMajeure: ForceMajeure, orders: Order[]): Promise<PlanningResult[]> {
    // Находим затронутые операции
    const affectedOperations: Operation[] = [];
    
    for (const order of orders) {
      if (forceMajeure.affectedOrders.includes(order.id)) {
        affectedOperations.push(...order.operations);
      }
    }

    // Фильтруем операции по типу форс-мажора
    if (forceMajeure.entityType === 'machine') {
      const affectedMachine = forceMajeure.entityId as Machine;
      const filteredOperations = affectedOperations.filter(op => op.machine === affectedMachine);
      
      // Переназначаем операции на другие станки
      for (const operation of filteredOperations) {
        const alternativeMachine = this.findAlternativeMachine(operation, affectedMachine);
        if (alternativeMachine) {
          operation.machine = alternativeMachine.name;
        }
      }
    }

    // Пересчитываем план для затронутых заказов
    const affectedOrders = orders.filter(order => forceMajeure.affectedOrders.includes(order.id));
    return this.planOrders(affectedOrders);
  }

  // Проверка является ли заказ критическим (просроченный или высокий приоритет)
  private isCriticalOrder(order: Order): boolean {
    const deadline = new Date(order.deadline);
    const now = new Date();
    const isOverdue = (order as any).isOverdue || false;
    
    // Критические условия:
    // 1. Приоритет 1 (максимальный)
    // 2. Просроченный заказ (независимо от приоритета)
    // 3. Дедлайн в течение следующих 3 дней
    const isCritical = order.priority === 1 || 
                      isOverdue || 
                      (deadline.getTime() - now.getTime()) <= (3 * 24 * 60 * 60 * 1000);
    
    if (isCritical) {
      const reason = order.priority === 1 ? 'максимальный приоритет' :
                    isOverdue ? 'просроченный дедлайн' :
                    'близкий дедлайн';
      console.log(`🔥 Критический заказ: ${order.drawingNumber} (${reason})`);
    }
    
    return isCritical;
  }
  
  // Поиск слота для критического заказа путем сдвига менее важных операций
  private async findSlotForCriticalOrder(
    operation: Operation,
    order: Order,
    earliestStartDate: Date,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>,
    allOrders: Order[]
  ): Promise<{ machine: MachineConfiguration; availableStartTime: Date } | null> {
    console.log(`🔥 РЕЖИМ ЭКСТРЕННОГО ПЛАНИРОВАНИЯ для критического заказа ${order.drawingNumber}`);
    
    // Получаем совместимые станки
    const compatibleMachines = this.machineConfigs.filter(machine => {
      switch (operation.operationType) {
        case '3-axis':
          return machine.supports3Axis && machine.supportsMilling && machine.isActive;
        case '4-axis':
          return machine.supports4Axis && machine.supportsMilling && machine.isActive;
        case 'milling':
          return machine.supportsMilling && machine.isActive;
        case 'turning':
          return machine.supportsTurning && machine.isActive;
        default:
          return machine.isActive;
      }
    });
    
    if (compatibleMachines.length === 0) {
      console.log(`❌ Нет совместимых станков для операции ${operation.operationType}`);
      return null;
    }
    
    // Рассчитываем время выполнения критической операции
    const setupTime = this.determineSetupTime(operation, compatibleMachines[0]);
    const baseTimeMinutes = (operation.estimatedTime || 0) * Number(order.quantity || 1);
    const estimatedDuration = baseTimeMinutes + setupTime;
    
    console.log(`⏱️ Требуемое время для критической операции: ${estimatedDuration} мин (операция: ${baseTimeMinutes}, наладка: ${setupTime})`);
    
    // Пытаемся найти место на каждом совместимом станке
    for (const machine of compatibleMachines) {
      console.log(`\n🔍 Анализируем станок ${machine.name} для экстренного планирования...`);
      
      const schedule = machineSchedule.get(machine.name) || [];
      
      // Ищем возможность сдвинуть менее важные операции
      const shiftResult = await this.tryToShiftOperations(
        machine.name,
        earliestStartDate,
        estimatedDuration,
        order,
        schedule,
        allOrders
      );
      
      if (shiftResult) {
        console.log(`✅ Найден слот на станке ${machine.name} после сдвига операций`);
        
        // Применяем сдвиги в расписании
        this.applyOperationShifts(machine.name, shiftResult.shifts, machineSchedule);
        
        return {
          machine,
          availableStartTime: shiftResult.availableTime
        };
      }
    }
    
    console.log(`❌ Не удалось найти слот даже в режиме экстренного планирования`);
    return null;
  }
  
  // Попытка сдвинуть операции для освобождения места критическому заказу
  private async tryToShiftOperations(
    machineName: Machine,
    requiredStartTime: Date,
    requiredDuration: number,
    criticalOrder: Order,
    schedule: Array<{ start: Date; end: Date; operationId: string }>,
    allOrders: Order[]
  ): Promise<{ 
    availableTime: Date; 
    shifts: Array<{ operationId: string; newStart: Date; newEnd: Date; originalStart: Date }> 
  } | null> {
    const shifts: Array<{ operationId: string; newStart: Date; newEnd: Date; originalStart: Date }> = [];
    const modifiedSchedule = [...schedule];
    
    // Ищем конфликтующие операции
    const requiredEndTime = await this.calculateEndDate(requiredStartTime, requiredDuration);
    
    const conflictingOperations = modifiedSchedule.filter(slot => {
      return (
        (requiredStartTime >= slot.start && requiredStartTime < slot.end) ||
        (requiredEndTime > slot.start && requiredEndTime <= slot.end) ||
        (requiredStartTime <= slot.start && requiredEndTime >= slot.end)
      );
    });
    
    if (conflictingOperations.length === 0) {
      // Нет конфликтов - можем использовать слот
      return {
        availableTime: requiredStartTime,
        shifts: []
      };
    }
    
    console.log(`⚠️ Найдено ${conflictingOperations.length} конфликтующих операций`);
    
    // Анализируем каждую конфликтующую операцию
    for (const conflictOp of conflictingOperations) {
      // Находим заказ и операцию
      const conflictOrder = this.findOrderByOperationId(conflictOp.operationId, allOrders);
      if (!conflictOrder) {
        console.log(`⚠️ Не найден заказ для операции ${conflictOp.operationId}`);
        continue;
      }
      
      // Проверяем приоритет конфликтующего заказа
      const conflictOrderPriority = conflictOrder.priority;
      const criticalOrderPriority = criticalOrder.priority;
      
      // Сдвигаем только если у критического заказа выше приоритет
      if (criticalOrderPriority >= conflictOrderPriority) {
        console.log(`🔄 Сдвигаем операцию заказа ${conflictOrder.drawingNumber} (приоритет ${conflictOrderPriority} < ${criticalOrderPriority})`);
        
        // Вычисляем новое время начала (после критической операции)
        const newStartTime = new Date(requiredEndTime);
        
        // Рассчитываем продолжительность сдвигаемой операции
        const operationDuration = conflictOp.end.getTime() - conflictOp.start.getTime();
        const newEndTime = new Date(newStartTime.getTime() + operationDuration);
        
        shifts.push({
          operationId: conflictOp.operationId,
          newStart: newStartTime,
          newEnd: newEndTime,
          originalStart: conflictOp.start
        });
        
        // Обновляем временное расписание
        const index = modifiedSchedule.findIndex(s => s.operationId === conflictOp.operationId);
        if (index !== -1) {
          modifiedSchedule[index] = {
            ...conflictOp,
            start: newStartTime,
            end: newEndTime
          };
        }
      } else {
        console.log(`❌ Нельзя сдвинуть операцию заказа ${conflictOrder.drawingNumber} - приоритет выше или равен (${conflictOrderPriority} >= ${criticalOrderPriority})`);
        return null;
      }
    }
    
    // Проверяем, что после всех сдвигов нет новых конфликтов
    const finalConflicts = modifiedSchedule.filter(slot => {
      if (shifts.some(shift => shift.operationId === slot.operationId)) {
        return false; // Пропускаем сдвинутые операции
      }
      
      return (
        (requiredStartTime >= slot.start && requiredStartTime < slot.end) ||
        (requiredEndTime > slot.start && requiredEndTime <= slot.end) ||
        (requiredStartTime <= slot.start && requiredEndTime >= slot.end)
      );
    });
    
    if (finalConflicts.length > 0) {
      console.log(`❌ После сдвигов остались конфликты: ${finalConflicts.length}`);
      return null;
    }
    
    console.log(`✅ Успешно запланирован сдвиг ${shifts.length} операций`);
    
    return {
      availableTime: requiredStartTime,
      shifts
    };
  }
  
  // Применение сдвигов к расписанию станка
  private applyOperationShifts(
    machineName: Machine,
    shifts: Array<{ operationId: string; newStart: Date; newEnd: Date; originalStart: Date }>,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>
  ): void {
    const schedule = machineSchedule.get(machineName) || [];
    
    for (const shift of shifts) {
      const index = schedule.findIndex(slot => slot.operationId === shift.operationId);
      if (index !== -1) {
        schedule[index] = {
          start: shift.newStart,
          end: shift.newEnd,
          operationId: shift.operationId
        };
        
        const delayMinutes = Math.round((shift.newStart.getTime() - shift.originalStart.getTime()) / (1000 * 60));
        console.log(`📅 Операция ${shift.operationId} сдвинута на ${delayMinutes} минут`);
      }
    }
    
    // Пересортировываем расписание по времени начала
    schedule.sort((a, b) => a.start.getTime() - b.start.getTime());
    machineSchedule.set(machineName, schedule);
  }
  
  // Поиск заказа по ID операции
  private findOrderByOperationId(operationId: string, orders: Order[]): Order | null {
    for (const order of orders) {
      if (order.operations.some(op => op.id === operationId)) {
        return order;
      }
    }
    return null;
  }
  
  // Поиск альтернативного станка с учетом типа операции
  private findAlternativeMachine(operation: Operation, excludeMachine: Machine): MachineConfiguration | null {
    const compatibleMachines = this.machineConfigs.filter(machine => {
      if (machine.name === excludeMachine || !machine.isActive) {
        return false;
      }
      
      // Проверяем совместимость по типу операции
      switch (operation.operationType) {
        case '3-axis':
          return machine.supports3Axis && machine.supportsMilling;
        case '4-axis':
          return machine.supports4Axis && machine.supportsMilling;
        case 'milling':
          return machine.supportsMilling;
        case 'turning':
          return machine.supportsTurning;
        default:
          console.warn(`⚠️ Неизвестный тип операции: ${operation.operationType}. Разрешаем планирование на всех активных станках.`);
          return machine.isActive;
      }
    });
    
    if (compatibleMachines.length === 0) {
      return null;
    }

    // Возвращаем первый подходящий станок (можно улучшить алгоритм выбора)
    return compatibleMachines[0];
  }

  // Ручное обновление планирования операции
  public async updatePlanningResult(resultId: string, updates: Partial<PlanningResult>, existingResults: PlanningResult[]): Promise<PlanningResult[]> {
    const updatedResults = await Promise.all(existingResults.map(async (result) => {
      if (result.id === resultId) {
        const updated = { ...result, ...updates };
        if (updates.plannedStartDate || updates.expectedTimeMinutes || updates.setupTimeMinutes) {
          // Пересчитываем дату окончания если изменились начало или время
          const totalMinutes = updated.expectedTimeMinutes + updated.setupTimeMinutes + updated.bufferTimeMinutes;
          const startDate = new Date(updated.plannedStartDate);
          updated.plannedEndDate = (await this.calculateEndDate(startDate, totalMinutes)).toISOString();
          updated.status = 'rescheduled';
          updated.lastRescheduledAt = new Date().toISOString();
        }
        return updated;
      }
      return result;
    }));
    
    // Проверяем и обновляем зависимые операции того же заказа
    const updatedResult = updatedResults.find(r => r.id === resultId);
    if (updatedResult) {
      await this.cascadeUpdateDependentOperations(updatedResult, updatedResults);
    }
    
    return updatedResults;
  }
  
  // Каскадное обновление зависимых операций
  private async cascadeUpdateDependentOperations(updatedResult: PlanningResult, allResults: PlanningResult[]): Promise<void> {
    const orderResults = allResults.filter(r => r.orderId === updatedResult.orderId)
      .sort((a, b) => {
        // Сортируем по номеру операции (нужно получить из ID операции)
        const aOpId = a.operationId;
        const bOpId = b.operationId;
        return aOpId.localeCompare(bOpId);
      });
    
    const currentIndex = orderResults.findIndex(r => r.id === updatedResult.id);
    const newEndDate = new Date(updatedResult.plannedEndDate);
    
    // Обновляем все последующие операции в том же заказе
    for (let i = currentIndex + 1; i < orderResults.length; i++) {
      const nextResult = orderResults[i];
      const nextIndex = allResults.findIndex(r => r.id === nextResult.id);
      
      if (nextIndex !== -1) {
        // Следующая операция должна начаться не раньше окончания текущей
        const currentStart = new Date(allResults[nextIndex].plannedStartDate);
        if (currentStart < newEndDate) {
          allResults[nextIndex].plannedStartDate = newEndDate.toISOString();
          const totalMinutes = allResults[nextIndex].expectedTimeMinutes + 
                               allResults[nextIndex].setupTimeMinutes + 
                               allResults[nextIndex].bufferTimeMinutes;
          allResults[nextIndex].plannedEndDate = (await this.calculateEndDate(newEndDate, totalMinutes)).toISOString();
          allResults[nextIndex].status = 'rescheduled';
          allResults[nextIndex].lastRescheduledAt = new Date().toISOString();
          allResults[nextIndex].rescheduledReason = 'Зависимая операция перенесена';
        }
      }
    }
  }
  
  // Обновление плана после завершения наладки с автоматическим перепланированием
  public async markSetupCompleted(
    resultId: string, 
    setupData: { actualSetupTime: number; actualStartTime?: string; newMachine?: string },
    existingResults: PlanningResult[],
    allOrders: Order[]
  ): Promise<{ 
    updatedResults: PlanningResult[]; 
    replanningResults: PlanningResult[]; 
    affectedMachine: Machine;
    machineChanged: boolean;
  }> {
    console.log(`🔧 Обновление наладки для операции ${resultId}. Фактическое время: ${setupData.actualSetupTime} мин.`, 
      setupData.actualStartTime ? `Начало: ${setupData.actualStartTime}` : '',
      setupData.newMachine ? `Новый станок: ${setupData.newMachine}` : '');
    
    // Находим обновляемую операцию
    const targetResult = existingResults.find(r => r.id === resultId);
    if (!targetResult) {
      console.error(`❗ Операция ${resultId} не найдена`);
      return {
        updatedResults: existingResults,
        replanningResults: [],
        affectedMachine: "Doosan Yashana" as Machine
      };
    }
    
    // Определяем затрагиваемый станок (старый или новый)
    const oldMachine = targetResult.machine;
    const newMachine = setupData.newMachine as Machine || oldMachine;
    const machineChanged = oldMachine !== newMachine;
    
    console.log(`🏠 Обновляем наладку на станке ${machineChanged ? `${oldMachine} -> ${newMachine}` : oldMachine}`);
    
    // Обновляем текущую операцию
    const updatedResults = await Promise.all(existingResults.map(async (result) => {
      if (result.id === resultId) {
        const updated = { ...result };
        const _timeDifference = setupData.actualSetupTime - updated.setupTimeMinutes;
        updated.setupTimeMinutes = setupData.actualSetupTime;
        
        // Если указан новый станок, обновляем его
        if (machineChanged) {
          updated.machine = newMachine;
          updated.rescheduledReason = `Перенесено на другой станок (с ${oldMachine} на ${newMachine})`;
        }
        updated.status = 'in-progress';
        
        // Обновляем время начала, если указано
        if (setupData.actualStartTime) {
          const plannedDate = new Date(updated.plannedStartDate);
          const timeStr = setupData.actualStartTime;
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          const actualStartDate = new Date(plannedDate);
          actualStartDate.setHours(hours, minutes, 0, 0);
          
          updated.plannedStartDate = actualStartDate.toISOString();
          console.log(`🕰️ Обновлено время начала: ${actualStartDate.toLocaleString()}`);
        }
        
        // Пересчитываем время окончания с учетом фактического времени наладки
        const totalMinutes = updated.expectedTimeMinutes + setupData.actualSetupTime + updated.bufferTimeMinutes;
        const startDate = new Date(updated.plannedStartDate);
        updated.plannedEndDate = (await this.calculateEndDate(startDate, totalMinutes)).toISOString();
        
        console.log(`⚙️ Операция ${resultId}: разница во времени наладки: ${_timeDifference} мин.`);
        
        return updated;
      }
      return result;
    }));
    
    // Находим все операции, которые нужно перепланировать
    // Если станок изменился, нам нужно перепланировать операции на обоих станках
    const machinesToReschedule = machineChanged ? [oldMachine, newMachine] : [newMachine];
    
    const machineResults = updatedResults
      .filter(r => machinesToReschedule.includes(r.machine) && r.status === 'planned')
      .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());
    
    console.log(`🔄 Найдено ${machineResults.length} операций для перепланирования на станках ${machinesToReschedule.join(', ')}`); 
    
    // Создаем новое расписание для станка
    const machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>> = new Map();
    
    // Инициализируем расписание с выполненными/выполняющимися операциями
    for (const machine of machinesToReschedule) {
      const existingSlots = updatedResults
        .filter(r => r.machine === machine && ['completed', 'in-progress'].includes(r.status))
        .map(r => ({
          start: new Date(r.plannedStartDate),
          end: new Date(r.plannedEndDate),
          operationId: r.operationId
        }));
      
      machineSchedule.set(machine, existingSlots);
    }
    
    // Перепланируем оставшиеся операции
    const replanningResults: PlanningResult[] = [];
    
    for (const resultToReplan of machineResults) {
      // Находим соответствующие заказ и операцию
      const order = allOrders.find(o => o.id === resultToReplan.orderId);
      const operation = order?.operations.find(op => op.id === resultToReplan.operationId);
      
      if (!order || !operation) {
        console.error(`❗ Не найдены заказ или операция для ${resultToReplan.id}`);
        continue;
      }
      
      // Определяем самую раннюю дату начала (после текущей операции)
      const currentOperationEnd = new Date(updatedResults.find(r => r.id === resultId)!.plannedEndDate);
      const orderOperations = order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      const currentOpIndex = orderOperations.findIndex(op => op.id === operation.id);
      
      let earliestStart = currentOperationEnd;
      
      // Проверяем зависимости от предыдущих операций
      if (currentOpIndex > 0) {
        const prevOperation = orderOperations[currentOpIndex - 1];
        const prevResult = updatedResults.find(r => r.operationId === prevOperation.id);
        if (prevResult) {
          const prevEndDate = new Date(prevResult.plannedEndDate);
          if (prevEndDate > earliestStart) {
            earliestStart = prevEndDate;
          }
        }
      }
      
      // Поиск нового слота на соответствующем станке
      const currentMachine = resultToReplan.machine;
      const machineConfig = this.machineConfigs.find(mc => mc.name === currentMachine)!;
      const estimatedDuration = (operation.estimatedTime || 0) * Number(order.quantity || 1);
      
      const availableTime = await this.findAvailableTimeSlot(
        currentMachine,
        earliestStart,
        estimatedDuration,
        machineSchedule
      );
      
      if (availableTime) {
        // Определяем время наладки
        const setupTime = this.determineSetupTime(operation, machineConfig);
        
        // Рассчитываем время выполнения
        const adjustedTime = estimatedDuration / machineConfig.efficiencyFactor;
        const bufferTime = adjustedTime * machineConfig.historicalDowntimeProbability;
        const totalTime = adjustedTime + setupTime + bufferTime;
        
        // Рассчитываем дату окончания
        const endDate = await this.calculateEndDate(availableTime, totalTime);
        
        // Создаем обновленный результат
        const replanedResult: PlanningResult = {
          ...resultToReplan,
          plannedStartDate: availableTime.toISOString(),
          plannedEndDate: endDate.toISOString(),
          expectedTimeMinutes: Math.round(adjustedTime),
          setupTimeMinutes: Math.round(setupTime),
          bufferTimeMinutes: Math.round(bufferTime),
          status: 'rescheduled',
          lastRescheduledAt: new Date().toISOString(),
          rescheduledReason: machineChanged ? 
            `Перепланировано из-за смены станка (${oldMachine} -> ${newMachine})` :
            `Перепланировано после обновления наладки на станке ${currentMachine}${setupData.actualStartTime ? ' и времени начала' : ''}`
        };
        
        replanningResults.push(replanedResult);
        
        // Обновляем расписание
        const schedule = machineSchedule.get(currentMachine) || [];
        schedule.push({
          start: availableTime,
          end: endDate,
          operationId: operation.id
        });
        schedule.sort((a, b) => a.start.getTime() - b.start.getTime());
        machineSchedule.set(affectedMachine, schedule);
        
        console.log(`✅ Перепланирована операция ${operation.sequenceNumber} заказа ${order.drawingNumber} на ${availableTime.toLocaleString()} - ${endDate.toLocaleString()}`);
      } else {
        console.warn(`⚠️ Не удалось найти слот для перепланирования операции ${resultToReplan.id}`);
      }
    }
    
    // Обновляем основной массив результатов
    const finalResults = updatedResults.map(result => {
      const replannedResult = replanningResults.find(rr => rr.id === result.id);
      return replannedResult || result;
    });
    
    const affectedMachinesText = machineChanged ? `станках ${oldMachine} и ${newMachine}` : `станке ${newMachine}`;
    console.log(`🎆 Перепланирование завершено. Обновлено ${replanningResults.length} операций на ${affectedMachinesText}`);
    
    return {
      updatedResults: finalResults,
      replanningResults,
      affectedMachine: newMachine,
      machineChanged
    };
  }
  
  // Получение доступных станков для операции
  public getCompatibleMachines(operation: Operation): MachineConfiguration[] {
    return this.machineConfigs.filter(machine => {
      switch (operation.operationType) {
        case '3-axis':
          return machine.supports3Axis && machine.supportsMilling && machine.isActive;
        case '4-axis':
          return machine.supports4Axis && machine.supportsMilling && machine.isActive;
        case 'milling':
          return machine.supportsMilling && machine.isActive;
        case 'turning':
          return machine.supportsTurning && machine.isActive;
        default:
          console.warn(`⚠️ Неизвестный тип операции: ${operation.operationType}. Разрешаем планирование на всех активных станках.`);
          return machine.isActive;
      }
    });
  }

  // Создание алертов
  public createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Alert {
    return {
      ...alert,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
  }
}

// Утилиты для работы с планированием
export class PlanningUtils {
  // Максимальное количество операций на станок в день
  static readonly MAX_OPERATIONS_PER_MACHINE_PER_DAY = 2;
  
  // Максимальное рабочее время на станок в день (дневная + ночная смена)
  static readonly MAX_WORKING_MINUTES_PER_DAY = 960; // 16 часов работы
  
  // Проверка количества операций на станке в определенный день
  static countOperationsOnMachineForDay(planningResults: PlanningResult[], machine: Machine, date: Date): number {
    const dateString = date.toDateString();
    return planningResults.filter(result => 
      result.machine === machine && 
      new Date(result.plannedStartDate).toDateString() === dateString
    ).length;
  }
  
  // Расчет общего времени операций на станке в определенный день
  static getTotalTimeForMachineOnDay(planningResults: PlanningResult[], machine: Machine, date: Date): number {
    const dateString = date.toDateString();
    return planningResults
      .filter(result => 
        result.machine === machine && 
        new Date(result.plannedStartDate).toDateString() === dateString
      )
      .reduce((total, result) => 
        total + result.expectedTimeMinutes + result.setupTimeMinutes + result.bufferTimeMinutes, 
        0
      );
  }
  
  // Проверка возможности добавления операции на станок в день (с учетом ограничений)
  static canAddOperationToMachineOnDay(
    planningResults: PlanningResult[], 
    machine: Machine, 
    date: Date, 
    operationDuration?: number
  ): boolean {
    const dayResults = planningResults.filter(result => 
      result.machine === machine && 
      new Date(result.plannedStartDate).toDateString() === date.toDateString()
    );
    
    // Ограничение 1: Максимум 2 операции в день
    if (dayResults.length >= this.MAX_OPERATIONS_PER_MACHINE_PER_DAY) {
      return false;
    }
    
    // Ограничение 2: Проверка общего времени в день
    if (operationDuration !== undefined) {
      const currentTotalTime = this.getTotalTimeForMachineOnDay(planningResults, machine, date);
      if (currentTotalTime + operationDuration > this.MAX_WORKING_MINUTES_PER_DAY) {
        return false;
      }
    }
    
    // Ограничение 3: Если есть операция, заканчивающаяся до 14:00, нельзя добавлять больше операций
    const hasEarlyEndingOperation = dayResults.some(result => {
      const endDate = new Date(result.plannedEndDate);
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();
      return endHour < 14 || (endHour === 14 && endMinute === 0);
    });
    
    if (hasEarlyEndingOperation) {
      return false;
    }
    
    return true;
  }
  
  // Получение списка дней, заблокированных ранним окончанием операций
  static getDaysBlockedByEarlyOperations(planningResults: PlanningResult[], machine: Machine): Date[] {
    const blockedDays: Date[] = [];
    const dayOperations = new Map<string, PlanningResult[]>();
    
    // Группируем операции по дням
    planningResults
      .filter(result => result.machine === machine)
      .forEach(result => {
        const dateString = new Date(result.plannedStartDate).toDateString();
        if (!dayOperations.has(dateString)) {
          dayOperations.set(dateString, []);
        }
        dayOperations.get(dateString)!.push(result);
      });
    
    // Проверяем каждый день на наличие ранних операций
    dayOperations.forEach((operations, dateString) => {
      const hasEarlyEndingOperation = operations.some(result => {
        const endDate = new Date(result.plannedEndDate);
        const endHour = endDate.getHours();
        const endMinute = endDate.getMinutes();
        return endHour < 14 || (endHour === 14 && endMinute === 0);
      });
      
      if (hasEarlyEndingOperation) {
        blockedDays.push(new Date(dateString));
      }
    });
    
    return blockedDays;
  }
  
  // Получение списка дней с максимальной загрузкой для станка
  static getFullyLoadedDaysForMachine(planningResults: PlanningResult[], machine: Machine): Date[] {
    const dayOperations = new Map<string, number>();
    
    planningResults
      .filter(result => result.machine === machine)
      .forEach(result => {
        const dateString = new Date(result.plannedStartDate).toDateString();
        dayOperations.set(dateString, (dayOperations.get(dateString) || 0) + 1);
      });
    
    return Array.from(dayOperations.entries())
      .filter(([, count]) => count >= this.MAX_OPERATIONS_PER_MACHINE_PER_DAY)
      .map(([dateString]) => new Date(dateString));
  }
  
  // Получение статистики загрузки станков по дням (с учетом ограничений)
  static getMachineLoadStatistics(planningResults: PlanningResult[]): Record<Machine, {
    totalDays: number;
    fullyLoadedDays: number;
    blockedByEarlyOperations: number;
    averageOperationsPerDay: number;
    loadPercentage: number;
    earlyEndingOperations: number;
  }> {
    const statistics: Record<Machine, {
      totalDays: number;
      fullyLoadedDays: number;
      blockedByEarlyOperations: number;
      averageOperationsPerDay: number;
      loadPercentage: number;
      earlyEndingOperations: number;
    }> = {} as any;
    
    for (const machine of MACHINES) {
      const machineResults = planningResults.filter(result => result.machine === machine);
      
      if (machineResults.length === 0) {
        statistics[machine] = {
          totalDays: 0,
          fullyLoadedDays: 0,
          blockedByEarlyOperations: 0,
          averageOperationsPerDay: 0,
          loadPercentage: 0,
          earlyEndingOperations: 0
        };
        continue;
      }
      
      // Группируем операции по дням
      const dayOperations = new Map<string, PlanningResult[]>();
      machineResults.forEach(result => {
        const dateString = new Date(result.plannedStartDate).toDateString();
        if (!dayOperations.has(dateString)) {
          dayOperations.set(dateString, []);
        }
        dayOperations.get(dateString)!.push(result);
      });
      
      const totalDays = dayOperations.size;
      let fullyLoadedDays = 0;
      let blockedByEarlyOperations = 0;
      let earlyEndingOperations = 0;
      
      // Анализируем каждый день
      dayOperations.forEach((operations) => {
        // Полностью загруженные дни (2 операции)
        if (operations.length >= this.MAX_OPERATIONS_PER_MACHINE_PER_DAY) {
          fullyLoadedDays++;
        }
        
        // Проверяем наличие ранних операций
        const hasEarlyOperation = operations.some(result => {
          const endDate = new Date(result.plannedEndDate);
          const endHour = endDate.getHours();
          const endMinute = endDate.getMinutes();
          const isEarly = endHour < 14 || (endHour === 14 && endMinute === 0);
          if (isEarly) earlyEndingOperations++;
          return isEarly;
        });
        
        if (hasEarlyOperation) {
          blockedByEarlyOperations++;
        }
      });
      
      const averageOperationsPerDay = machineResults.length / totalDays;
      const loadPercentage = (averageOperationsPerDay / this.MAX_OPERATIONS_PER_MACHINE_PER_DAY) * 100;
      
      statistics[machine] = {
        totalDays,
        fullyLoadedDays,
        blockedByEarlyOperations,
        averageOperationsPerDay: Math.round(averageOperationsPerDay * 100) / 100,
        loadPercentage: Math.round(loadPercentage * 100) / 100,
        earlyEndingOperations
      };
    }
    
    return statistics;
  }
  
  // Конвертация заказов для webhook
  static convertOrdersForWebhook(orders: Order[], planningResults: PlanningResult[]): any {
    return {
      timestamp: new Date().toISOString(),
      source: 'TheWho Planning System',
      data: {
        orders: orders.map(order => ({
          ...order,
          planningResults: planningResults.filter(pr => pr.orderId === order.id)
        })),
        summary: {
          totalOrders: orders.length,
          totalOperations: orders.reduce((sum, order) => sum + order.operations.length, 0),
          planningResults: planningResults.length
        }
      }
    };
  }

  // Проверка соответствия дедлайнам
  static checkDeadlineCompliance(orders: Order[], planningResults: PlanningResult[]): Alert[] {
    const alerts: Alert[] = [];
    
    for (const order of orders) {
      const orderResults = planningResults.filter(pr => pr.orderId === order.id);
      if (orderResults.length === 0) continue;
      
      // Находим последнюю операцию заказа
      const lastResult = orderResults.reduce((latest, current) => 
        new Date(current.plannedEndDate) > new Date(latest.plannedEndDate) ? current : latest
      );
      
      const deadline = new Date(order.deadline);
      const completionDate = new Date(lastResult.plannedEndDate);
      
      if (completionDate > deadline) {
        alerts.push({
          id: `alert-deadline-${uuidv4()}`,
          type: 'deadline_risk',
          severity: 'high',
          title: `Заказ ${order.drawingNumber} не успевает к дедлайну`,
          description: `Плановая дата завершения: ${completionDate.toLocaleDateString()}, Дедлайн: ${deadline.toLocaleDateString()}`,
          affectedEntityType: 'order',
          affectedEntityId: order.id,
          status: 'new',
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return alerts;
  }

  // Анализ загрузки станков
  static analyzeMachineLoad(planningResults: PlanningResult[]): Record<Machine, number> {
    const machineLoad: Record<Machine, number> = {} as Record<Machine, number>;
    
    // Инициализируем нулевой загрузкой
    for (const machine of MACHINES) {
      machineLoad[machine] = 0;
    }
    
    // Считаем время по станкам
    for (const result of planningResults) {
      const totalTime = result.expectedTimeMinutes + result.setupTimeMinutes + result.bufferTimeMinutes;
      machineLoad[result.machine] = (machineLoad[result.machine] || 0) + totalTime;
    }
    
    return machineLoad;
  }
}
