// Адаптированные алгоритмы планирования для TheWho приложения
import { Order, Operation, Shift, Machine, MACHINES } from '../types';
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
    supports3Axis: false,
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

  // Основной алгоритм планирования
  public async planOrders(orders: Order[]): Promise<PlanningResult[]> {
    // Сортируем заказы по приоритету и дедлайну
    const sortedOrders = this.sortOrdersByPriorityAndDeadline(orders);
    const planningResults: PlanningResult[] = [];
    
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
        // Определяем самую раннюю дату начала с учетом зависимостей
        const earliestStartDate = this.determineEarliestStartDate(operation, completedOperations, order);
        
        // Выбираем подходящий станок
        const selectedMachine = this.selectMachine(operation, order, earliestStartDate);
        
        if (!selectedMachine) {
          console.warn(`No suitable machine found for operation ${operation.id}`);
          continue;
        }

        // Определяем время наладки
        const setupTime = this.determineSetupTime(operation, selectedMachine);
        
        // Рассчитываем время выполнения
        const baseTime = (operation.estimatedTime || 0) * Number(order.quantity);
        const efficiencyFactor = typeof selectedMachine.efficiencyFactor === 'number' ? selectedMachine.efficiencyFactor : 1;
        const adjustedTime = baseTime / efficiencyFactor;
        
        // Добавляем буферное время
        const bufferTime = adjustedTime * (selectedMachine.historicalDowntimeProbability || 0.1);
        
        // Общее время
        const totalTime = adjustedTime + setupTime + bufferTime;
        
        // Рассчитываем дату окончания с учетом израильского календаря
        const endDate = await this.calculateEndDate(earliestStartDate, totalTime);
        
        // Создаем результат планирования
        const planningResult: PlanningResult = {
          id: `plan-${order.id}-${operation.id}`,
          orderId: order.id,
          operationId: operation.id,
          machine: selectedMachine.name,
          plannedStartDate: earliestStartDate.toISOString(),
          plannedEndDate: endDate.toISOString(),
          quantityAssigned: order.quantity,
          remainingQuantity: order.quantity,
          expectedTimeMinutes: Math.round(adjustedTime),
          setupTimeMinutes: Math.round(setupTime),
          bufferTimeMinutes: Math.round(bufferTime),
          status: 'planned'
        };
        
        planningResults.push(planningResult);
        
        // Обновляем карту завершенных операций
        completedOperations.set(operation.id, endDate);
        
        // Обновляем текущий тип наладки станка
        selectedMachine.currentSetupType = this.getOperationSetupType(operation);
      }
    }
    
    return planningResults;
  }

  // Адаптивное планирование на основе фактических данных
  public async adaptivePlanning(orders: Order[], shifts: Shift[]): Promise<PlanningResult[]> {
    // Обновляем коэффициенты отклонения операций
    this.updateOperationDeviationFactors(orders, shifts);
    
    // Пересчитываем план с учетом фактических данных
    return this.planOrders(orders);
  }

  // Сортировка заказов по приоритету и дедлайну
  private sortOrdersByPriorityAndDeadline(orders: Order[]): Order[] {
    return orders.sort((a, b) => {
      // Сначала по приоритету (больший приоритет = выше важность)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Затем по дедлайну (раньше = выше важность)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
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



  // Выбор подходящего станка с учетом токарных и фрезерных операций
  private selectMachine(operation: Operation, _order: Order, _startDate: Date): MachineConfiguration | null {
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
          return false;
      }
    });
    
    if (compatibleMachines.length === 0) {
      return null;
    }

    // Если указан предпочтительный станок в операции
    if (operation.machine) {
      const preferredMachine = compatibleMachines.find(m => m.name === operation.machine);
      if (preferredMachine) {
        return preferredMachine;
      }
    }
    
    // Выбираем станок с наименьшей загрузкой
    return compatibleMachines.reduce((best, current) => {
      // Пока что используем простое сравнение по эффективности
      // Метод calculateMachineLoad будет добавлен позже
      const bestLoad = best.efficiencyFactor;
      const currentLoad = current.efficiencyFactor;
      // Возвращаем станок с высшей эффективностью
      return currentLoad < bestLoad ? current : best;
    });
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

  // Удаляем старый метод проверки праздников
  // Теперь используется IsraeliCalendar.isHoliday()

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
          if (orderOperation) {
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
          return false;
      }
    });
    
    if (compatibleMachines.length === 0) {
      return null;
    }

    // Возвращаем станок с наименьшей загрузкой
    // Возвращаем первый совместимый станок
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
  
  // Обновление плана после завершения наладки
  public async markSetupCompleted(resultId: string, actualSetupTime: number, existingResults: PlanningResult[]): Promise<PlanningResult[]> {
    return Promise.all(existingResults.map(async (result) => {
      if (result.id === resultId) {
        const updated = { ...result };
        updated.setupTimeMinutes = actualSetupTime;
        updated.status = 'in-progress';
        
        // Пересчитываем время окончания с учетом фактического времени наладки
        const totalMinutes = updated.expectedTimeMinutes + actualSetupTime + updated.bufferTimeMinutes;
        const startDate = new Date(updated.plannedStartDate);
        updated.plannedEndDate = (await this.calculateEndDate(startDate, totalMinutes)).toISOString();
        
        return updated;
      }
      return result;
    }));
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
          return false;
      }
    });
  }

  // Создание алертов
  public createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Alert {
    return {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
  }
}

// Утилиты для работы с планированием
export class PlanningUtils {
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
          id: `alert-deadline-${order.id}`,
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
