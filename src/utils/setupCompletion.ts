// В этом файле содержится обновленная версия метода markSetupCompleted,
// которая поддерживает смену станка при наладке

import { ProductionPlanner, PlanningResult } from './productionPlanning';
import { Order, Machine } from '../types';

/**
 * Обновленный метод для отметки о завершении наладки с поддержкой смены станка
 */
export async function markSetupCompleted(
  planner: ProductionPlanner,
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
  
  console.log(`🔧 Обновление наладки для операции ${resultId}. Фактическое время: ${actualSetupTime} мин.`, 
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
  
  // Обновляем текущую операцию
  const updatedResults = await Promise.all(existingResults.map(async (result) => {
    if (result.id === resultId) {
      const updated = { ...result };
      const _timeDifference = actualSetupTime - updated.setupTimeMinutes;
      updated.setupTimeMinutes = actualSetupTime;
      updated.status = 'in-progress';
      
      // Если указан новый станок, обновляем его
      if (machineChanged) {
        console.log(`🔄 Меняем станок с ${updated.machine} на ${machineToUse}`);
        updated.machine = machineToUse;
        updated.rescheduledReason = `Перенесено на другой станок (с ${oldMachine} на ${machineToUse})`;
        updated.lastRescheduledAt = new Date().toISOString();
      }
      
      // Обновляем время начала, если указано
      if (actualStartTime) {
        const plannedDate = new Date(updated.plannedStartDate);
        const timeStr = actualStartTime;
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        const actualStartDate = new Date(plannedDate);
        actualStartDate.setHours(hours, minutes, 0, 0);
        
        updated.plannedStartDate = actualStartDate.toISOString();
        console.log(`🕰️ Обновлено время начала: ${actualStartDate.toLocaleString()}`);
      }
      
      // Пересчитываем время окончания с учетом фактического времени наладки
      const totalMinutes = updated.expectedTimeMinutes + actualSetupTime + updated.bufferTimeMinutes;
      const startDate = new Date(updated.plannedStartDate);
      
      // Используем метод calculateEndDate из planner (будет передан при вызове)
      // @ts-ignore - обходим типизацию, так как метод приватный
      updated.plannedEndDate = (await planner.calculateEndDate(startDate, totalMinutes)).toISOString();
      
      console.log(`⚙️ Операция ${resultId}: разница во времени наладки: ${_timeDifference} мин.`);
      
      return updated;
    }
    return result;
  }));
  
  // Находим все операции, которые нужно перепланировать
  // Если станок изменился, нам нужно перепланировать операции на обоих станках
  const machineResults = updatedResults
    .filter(r => (r.machine === oldMachine || r.machine === machineToUse) && r.status === 'planned')
    .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime());
  
  console.log(`🔄 Найдено ${machineResults.length} операций для перепланирования на станке ${machineChanged ? `${oldMachine} и ${machineToUse}` : oldMachine}`);
  
  // Создаем новое расписание для станков
  const machineSchedule: Map<Machine, Array<{ start: Date; end: Date; operationId: string }>> = new Map();
  
  // Инициализируем расписание с выполненными/выполняющимися операциями для обоих станков
  const existingSlots = updatedResults
    .filter(r => (r.machine === oldMachine || r.machine === machineToUse) && ['completed', 'in-progress'].includes(r.status))
    .map(r => ({
      start: new Date(r.plannedStartDate),
      end: new Date(r.plannedEndDate),
      operationId: r.operationId,
      machine: r.machine
    }));
  
  // Группируем по станкам
  for (const slot of existingSlots) {
    if (!machineSchedule.has(slot.machine)) {
      machineSchedule.set(slot.machine, []);
    }
    
    machineSchedule.get(slot.machine)!.push({
      start: slot.start,
      end: slot.end,
      operationId: slot.operationId
    });
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
    
    // Определяем целевую машину (станок)
    const targetMachine = resultToReplan.machine;
    
    // Поиск нового слота
    // @ts-ignore - обходим типизацию, так как метод приватный
    const machineConfig = planner.machineConfigs.find(mc => mc.name === targetMachine)!;
    const estimatedDuration = (operation.estimatedTime || 0) * Number(order.quantity || 1);
    
    // @ts-ignore - обходим типизацию, так как метод приватный
    const availableTime = await planner.findAvailableTimeSlot(
      targetMachine,
      earliestStart,
      estimatedDuration,
      machineSchedule
    );
    
    if (availableTime) {
      // Определяем время наладки
      // @ts-ignore - обходим типизацию, так как метод приватный
      const setupTime = planner.determineSetupTime(operation, machineConfig);
      
      // Рассчитываем время выполнения
      const adjustedTime = estimatedDuration / machineConfig.efficiencyFactor;
      const bufferTime = adjustedTime * machineConfig.historicalDowntimeProbability;
      const totalTime = adjustedTime + setupTime + bufferTime;
      
      // Рассчитываем дату окончания
      // @ts-ignore - обходим типизацию, так как метод приватный
      const endDate = await planner.calculateEndDate(availableTime, totalTime);
      
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
      const schedule = machineSchedule.get(targetMachine) || [];
      schedule.push({
        start: availableTime,
        end: endDate,
        operationId: operation.id
      });
      schedule.sort((a, b) => a.start.getTime() - b.start.getTime());
      machineSchedule.set(targetMachine, schedule);
      
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
  
  const affectedMachines = machineChanged ? `${oldMachine} и ${machineToUse}` : oldMachine;
  console.log(`🎆 Перепланирование завершено. Обновлено ${replanningResults.length} операций на станках ${affectedMachines}`);
  
  return {
    updatedResults: finalResults,
    replanningResults,
    affectedMachine: machineToUse // Возвращаем новый станок как затронутый
  };
}
