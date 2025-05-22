// Полностью переработанный модуль планирования для TheWho
// Это файл заменит существующий productionPlanningFix.ts

import { Order, Operation, Shift, Machine, MACHINES } from '../types';
import IsraeliCalendar from './israeliCalendar';
import { PlanningResult, Alert, MachineConfiguration, MACHINE_CONFIGURATIONS, ForceMajeure } from './productionPlanning';

// Класс для управления планированием с учетом израильского календаря
export class ProductionPlannerFix {
  private machineConfigs: MachineConfiguration[];
  
  constructor(machineConfigs: MachineConfiguration[] = MACHINE_CONFIGURATIONS) {
    this.machineConfigs = machineConfigs;
  }

  // Основной алгоритм планирования с полностью исправленной логикой
  public async planOrders(orders: Order[]): Promise<PlanningResult[]> {
    console.log('\n🚀 === НАЧИНАЕМ ПЛАНИРОВАНИЕ ПРОИЗВОДСТВА (ИСПРАВЛЕННАЯ ВЕРСИЯ) ===');
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
            machineSelection = await this.findSlotForCriticalOrder(operation, order, earliestStartDate, machineSchedule, sortedOrders);
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
            id: `plan-${order.id}-${operation.id}`,
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

  // ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ функция обновления наладки и перепланирования
  public async markSetupCompleted(
    resultId: string, 
    setupData: number | { actualSetupTime: number; actualStartTime?: string; newMachine?: Machine }, 
    existingResults: PlanningResult[],
    allOrders: Order[]
  ): Promise<{ 
    updatedResults: PlanningResult[]; 
    replanningResults: PlanningResult[]; 
    affectedMachine: Machine;
  }> {
    // Обрабатываем как старый формат (только число), так и новый формат (объект)
    const actualSetupTime = typeof setupData === 'number' ? setupData : setupData.actualSetupTime;
    const actualStartTime = typeof setupData === 'object' ? setupData.actualStartTime : undefined;
    const newMachine = typeof setupData === 'object' ? setupData.newMachine : undefined;
    
    console.log(`🔧 НОВАЯ ВЕРСИЯ: Обновление наладки для операции ${resultId}. Фактическое время: ${actualSetupTime} мин.`, 
      actualStartTime ? `Начало: ${actualStartTime}` : '',
      newMachine ? `Новый станок: ${newMachine}` : '');
    
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
    const machineToUse = newMachine || oldMachine;
    const machineChanged = oldMachine !== machineToUse;
    
    console.log(`🏠 Обновляем наладку на станке ${machineChanged ? `${oldMachine} -> ${machineToUse}` : oldMachine}`);
    
    // ШАГИ АЛГОРИТМА:
    // 1. Обновляем текущую операцию (новый станок, время наладки, статус)
    // 2. Если станок изменился, перепланируем операции на обоих станках
    // 3. Если станок не изменился, перепланируем операции только на одном станке
    
    // Обновляем текущую операцию
    let updatedResults = [...existingResults]; // Создаем новый массив, чтобы избежать мутации
    const resultIndex = updatedResults.findIndex(r => r.id === resultId);
    
    if (resultIndex >= 0) {
      const result = updatedResults[resultIndex];
      const updated = { ...result };
      
      // Обновляем информацию о наладке
      const timeDifference = actualSetupTime - updated.setupTimeMinutes;
      updated.setupTimeMinutes = actualSetupTime;
      updated.status = 'in-progress';
      
      // Если указан новый станок, обновляем его
      if (machineChanged) {
        console.log(`🔄 СМЕНА СТАНКА: с ${updated.machine} на ${machineToUse}`);
        updated.machine = machineToUse;
        updated.rescheduledReason = `Перенесено на другой станок (с ${oldMachine} на ${machineToUse})`;
        updated.lastRescheduledAt = new Date().toISOString();
      }
      
      // Обновляем время начала, если указано
      if (actualStartTime) {
        const plannedDate = new Date(updated.plannedStartDate);
        const [hours, minutes] = actualStartTime.split(':').map(Number);
        
        const actualStartDate = new Date(plannedDate);
        actualStartDate.setHours(hours, minutes, 0, 0);
        
        updated.plannedStartDate = actualStartDate.toISOString();
        console.log(`🕰️ Обновлено время начала: ${actualStartDate.toLocaleString()}`);
      }
      
      // Пересчитываем время окончания с учетом фактического времени наладки
      const totalMinutes = updated.expectedTimeMinutes + actualSetupTime + updated.bufferTimeMinutes;
      const startDate = new Date(updated.plannedStartDate);
      updated.plannedEndDate = (await this.calculateEndDate(startDate, totalMinutes)).toISOString();
      
      console.log(`⚙️ Операция ${resultId}: разница во времени наладки: ${timeDifference} мин.`);
      
      // Обновляем результат в массиве
      updatedResults[resultIndex] = updated;
    }
    
    // Создаем расписание станков для перепланирования
    const machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>> = new Map();
    
    // Определяем, какие станки затронуты (старый, новый или оба)
    const affectedMachines: Machine[] = machineChanged ? [oldMachine, machineToUse] : [oldMachine];
    
    // Инициализируем расписание для каждого затронутого станка
    for (const machine of affectedMachines) {
      // Находим все выполненные/выполняющиеся операции на этом станке
      const completedOperations = updatedResults
        .filter(r => r.machine === machine && ['completed', 'in-progress'].includes(r.status))
        .map(r => ({
          start: new Date(r.plannedStartDate),
          end: new Date(r.plannedEndDate),
          operationId: r.operationId
        }));
      
      machineSchedule.set(machine, completedOperations);
    }
    
    // Находим все операции, которые необходимо перепланировать (со статусом 'planned')
    const operationsToReplan = updatedResults
      .filter(r => 
        affectedMachines.includes(r.machine) && // На затронутых станках
        r.status === 'planned' && // Только запланированные
        r.id !== resultId // Исключаем текущую операцию
      )
      .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());
    
    console.log(`🔄 Найдено ${operationsToReplan.length} операций для перепланирования на станках: ${affectedMachines.join(', ')}`);
    
    // Перепланируем каждую операцию
    const replanningResults: PlanningResult[] = [];
    
    for (const resultToReplan of operationsToReplan) {
      // Находим соответствующий заказ и операцию
      const order = allOrders.find(o => o.id === resultToReplan.orderId);
      const operation = order?.operations.find(op => op.id === resultToReplan.operationId);
      
      if (!order || !operation) {
        console.error(`❗ Не найден заказ или операция для ${resultToReplan.id}`);
        continue;
      }
      
      // Определяем самую раннюю дату начала для этой операции
      // 1. Если это операция того же заказа, что и обновляемая, учитываем зависимости
      // 2. Если это операция другого заказа, начинаем с текущего времени
      
      let earliestStart: Date;
      
      if (resultToReplan.orderId === targetResult.orderId) {
        // Операция из того же заказа - проверяем зависимости
        const orderOperations = order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        const currentOpIndex = orderOperations.findIndex(op => op.id === operation.id);
        const updatedResultIndex = resultIndex >= 0 ? resultIndex : -1;
        
        if (currentOpIndex > 0) {
          // Ищем предыдущую операцию
          const prevOperation = orderOperations[currentOpIndex - 1];
          const prevResult = updatedResults.find(r => r.operationId === prevOperation.id);
          
          if (prevResult) {
            // Используем время окончания предыдущей операции
            earliestStart = new Date(prevResult.plannedEndDate);
          } else {
            // Если предыдущая операция не найдена, используем текущее время
            earliestStart = new Date();
          }
        } else {
          // Это первая операция заказа - начинаем с текущего времени
          earliestStart = new Date();
        }
      } else {
        // Операция из другого заказа - просто используем текущее время
        earliestStart = new Date();
      }
      
      // Получаем конфигурацию станка
      const machineConfig = this.machineConfigs.find(mc => mc.name === resultToReplan.machine)!;
      
      // Рассчитываем длительность операции
      const estimatedDuration = (operation.estimatedTime || 0) * Number(order.quantity || 1);
      
      // Ищем доступный слот
      const availableTime = await this.findAvailableTimeSlot(
        resultToReplan.machine,
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
            `Перепланировано из-за смены станка (${oldMachine} -> ${machineToUse})` :
            `Перепланировано после обновления наладки на станке ${oldMachine}${actualStartTime ? ' и времени начала' : ''}`
        };
        
        replanningResults.push(replanedResult);
        
        // Обновляем расписание
        const schedule = machineSchedule.get(resultToReplan.machine) || [];
        schedule.push({
          start: availableTime,
          end: endDate,
          operationId: operation.id
        });
        
        // Сортируем по времени начала для корректного поиска слотов
        schedule.sort((a, b) => a.start.getTime() - b.start.getTime());
        machineSchedule.set(resultToReplan.machine, schedule);
        
        console.log(`✅ Перепланирована операция ${operation.sequenceNumber} заказа ${order.drawingNumber} на ${availableTime.toLocaleString()} - ${endDate.toLocaleString()}`);
      } else {
        console.warn(`⚠️ Не удалось найти слот для перепланирования операции ${resultToReplan.id}`);
      }
    }
    
    // Применяем результаты перепланирования к общему массиву
    const finalResults = updatedResults.map(result => {
      const replannedResult = replanningResults.find(rr => rr.id === result.id);
      return replannedResult || result;
    });
    
    // Логируем результат
    const machinesInfo = machineChanged ? `${oldMachine} и ${machineToUse}` : oldMachine;
    console.log(`🎆 Перепланирование завершено. Обновлено ${replanningResults.length} операций на станках: ${machinesInfo}`);
    
    return {
      updatedResults: finalResults,
      replanningResults,
      affectedMachine: machineToUse // Используем новый станок как затронутый
    };
  }

  // Вспомогательные методы, скопированные из основного класса
  
  private sortedOrders: Order[] = [];
  
  private isOperationCompleted(operation: Operation, order: Order): boolean {
    // Проверяем дополнительные поля, которые могут быть добавлены при обогащении данных
    const extendedOperation = operation as Operation & {
      completionStatus?: string;
      completedUnits?: number;
    };
    
    // Проверка по статусу завершения
    if (extendedOperation.completionStatus === 'completed') {
      return true;
    }
    
    // Проверка по количеству выполненных единиц
    if (typeof extendedOperation.completedUnits === 'number' && extendedOperation.completedUnits >= order.quantity) {
      return true;
    }
    
    // Проверка по фактическому времени
    if (operation.actualTime && operation.estimatedTime && operation.actualTime >= operation.estimatedTime) {
      return true;
    }
    
    return false;
  }
  
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

  private async selectMachineWithScheduling(
    operation: Operation, 
    order: Order, 
    earliestStartDate: Date,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>,
    emergencyMode: boolean = false
  ): Promise<{ machine: MachineConfiguration; availableStartTime: Date } | null> {
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
          return machine.isActive;
      }
    });
    
    if (compatibleMachines.length === 0) {
      return null;
    }

    // Рассчитываем примерное время выполнения для планирования
    const setupTime = this.determineSetupTime(operation, compatibleMachines[0]); // примерное время наладки
    const baseTimeMinutes = (operation.estimatedTime || 0) * Number(order.quantity || 1);
    const estimatedDuration = baseTimeMinutes + setupTime;
    
    // Если указан предпочтительный станок в операции, проверяем его первым
    if (operation.machine) {
      const preferredMachine = compatibleMachines.find(m => m.name === operation.machine);
      if (preferredMachine) {
        const availableTime = await this.findAvailableTimeSlot(
          preferredMachine.name,
          earliestStartDate,
          estimatedDuration,
          machineSchedule
        );
        if (availableTime) {
          return { machine: preferredMachine, availableStartTime: availableTime };
        }
      }
    }
    
    // Ищем станок с наименьшим временем ожидания
    let bestOption: { machine: MachineConfiguration; availableStartTime: Date } | null = null;
    let shortestWait = Infinity;

    for (const machine of compatibleMachines) {
      const availableTime = await this.findAvailableTimeSlot(
        machine.name,
        earliestStartDate,
        estimatedDuration,
        machineSchedule
      );
      
      if (availableTime) {
        const waitTime = availableTime.getTime() - earliestStartDate.getTime();
        
        if (waitTime < shortestWait) {
          shortestWait = waitTime;
          bestOption = { machine, availableStartTime: availableTime };
        }
      }
    }

    return bestOption;
  }

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
        candidateStart = await this.getNextWorkingDayStart(candidateStart);
        iterations++;
        continue;
      }
      
      // ОГРАНИЧЕНИЕ 2: Проверка общего времени в день
      const maxWorkingMinutesPerDay = 960; // 16 часов работы
      
      // Рассчитываем примерное общее время операции для проверки лимитов
      const setupTime = this.determineSetupTime({ operationType: 'milling' } as Operation, this.machineConfigs[0]);
      const bufferTime = estimatedDuration * 0.1; // Примерно 10% буфер
      const totalOperationTime = estimatedDuration + setupTime + bufferTime;
      
      const existingTotalTime = this.getTotalTimeForDay(machineName, candidateDate, machineSchedule);
      const existingTimeNum = typeof existingTotalTime === 'number' ? existingTotalTime : Number(existingTotalTime);
      const operationTimeNum = typeof totalOperationTime === 'number' ? totalOperationTime : Number(totalOperationTime);
      
      if (existingTimeNum + operationTimeNum > maxWorkingMinutesPerDay) {
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
    
    // Проверяем, не превышает ли время ожидания разумные пределы
    const maxWaitDays = 60; // Стандартный лимит ожидания
    if (candidateStart.getTime() - earliestStart.getTime() > maxWaitDays * 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return candidateStart;
  }
  
  private async getNextWorkingDayStart(currentDate: Date): Promise<Date> {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0);
    
    const nextWorkingDay = await IsraeliCalendar.getNextWorkingDay(nextDay);
    nextWorkingDay.setHours(8, 0, 0, 0);
    
    return nextWorkingDay;
  }
  
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

  private getOperationSetupType(operation: Operation): string {
    return `${operation.operationType}-setup`;
  }

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

  private async findSlotForCriticalOrder(
    operation: Operation,
    order: Order,
    earliestStartDate: Date,
    machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>>,
    allOrders: Order[]
  ): Promise<{ machine: MachineConfiguration; availableStartTime: Date } | null> {
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
      return null;
    }
    
    // Рассчитываем время выполнения критической операции
    const setupTime = this.determineSetupTime(operation, compatibleMachines[0]);
    const baseTimeMinutes = (operation.estimatedTime || 0) * Number(order.quantity || 1);
    const estimatedDuration = baseTimeMinutes + setupTime;
    
    // Пытаемся найти место на каждом совместимом станке
    for (const machine of compatibleMachines) {
      const schedule = machineSchedule.get(machine.name) || [];
      
      // Пытаемся сдвинуть менее важные операции
      const availableTime = await this.findAvailableTimeSlot(
        machine.name,
        earliestStartDate,
        estimatedDuration,
        machineSchedule
      );
      
      if (availableTime) {
        return {
          machine,
          availableStartTime: availableTime
        };
      }
    }
    
    return null;
  }

  // Сортированные заказы
  private preprocessOrdersForPlanning(orders: Order[]): Order[] {
    const currentDate = new Date();
    const processedOrders: Order[] = [];
    
    for (const order of orders) {
      let processedOrder = { ...order };
      const deadline = new Date(order.deadline);
      
      // Проверяем, просрочен ли дедлайн
      if (deadline < currentDate) {
        const daysOverdue = Math.ceil((currentDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        
        // Добавляем степень просрочки для сортировки внутри приоритета
        (processedOrder as any).daysOverdue = daysOverdue;
        (processedOrder as any).isOverdue = true;
        
        // Вычисляем новый реалистичный дедлайн
        const newDeadline = this.calculateRealisticDeadline(processedOrder, currentDate);
        processedOrder.deadline = newDeadline.toISOString();
      } else {
        // Для не просроченных заказов
        (processedOrder as any).daysOverdue = 0;
        (processedOrder as any).isOverdue = false;
      }
      
      processedOrders.push(processedOrder);
    }
    
    // Сохраняем обработанные заказы для критического планирования
    this.sortedOrders = processedOrders;
    
    return processedOrders;
  }
  
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
  
  private sortOrdersByPriorityAndDeadline(orders: Order[]): Order[] {
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
    
    return sorted;
  }

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
    
    return isCritical;
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
          return machine.isActive;
      }
    });
  }
}
