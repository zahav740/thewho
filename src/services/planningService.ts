import { supabase } from './supabase';
import { orderService } from './orderService';
import { calculateEndDate, findAvailableTimeSlot } from '../utils/planningAlgorithms';
import { v4 as uuidv4 } from 'uuid';

export const planningService = {
  async createInitialPlan(orderId: string): Promise<any[]> {
    // Получаем данные о заказе и его операциях
    const order = await orderService.getOrderById(orderId);
    
    // Получаем текущие результаты планирования для всех заказов
    const { data: existingResults, error: resultsError } = await supabase
      .from('planning_results')
      .select();
    
    if (resultsError) throw resultsError;
    
    // Сортируем операции по последовательности
    const sortedOperations = order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    // Создаем карту занятости станков на основе существующих результатов
    const machineSchedule = {};
    for (const result of existingResults) {
      if (!machineSchedule[result.machine]) {
        machineSchedule[result.machine] = [];
      }
      
      machineSchedule[result.machine].push({
        start: new Date(result.planned_start_date),
        end: new Date(result.planned_end_date),
        operationId: result.operation_id
      });
    }
    
    const planningResults = [];
    let lastEndDate = new Date(); // Начинаем с текущей даты
    
    for (const operation of sortedOperations) {
      // Определяем самую раннюю дату начала
      const earliestStartDate = new Date(Math.max(lastEndDate.getTime(), new Date().getTime()));
      
      // Выбираем станок и время начала
      const machineSelection = await findAvailableTimeSlot(
        operation.machine,
        earliestStartDate,
        operation.estimatedTime * order.quantity,
        machineSchedule
      );
      
      if (!machineSelection) {
        throw new Error(`Не удалось найти временной слот для операции ${operation.id}`);
      }
      
      // Определяем время наладки (упрощенно)
      const setupTime = 60; // Упрощенно: 60 минут для всех типов операций
      
      // Рассчитываем время выполнения
      const totalTimeMinutes = operation.estimatedTime * order.quantity;
      
      // Добавляем буферное время (10% от времени выполнения)
      const bufferTime = totalTimeMinutes * 0.1;
      
      // Рассчитываем дату окончания
      const endDate = calculateEndDate(
        machineSelection.availableStartTime,
        totalTimeMinutes + setupTime + bufferTime
      );
      
      // Создаем результат планирования
      const resultId = uuidv4();
      const planningResult = {
        id: resultId,
        order_id: orderId,
        operation_id: operation.id,
        machine: machineSelection.machine,
        planned_start_date: machineSelection.availableStartTime,
        planned_end_date: endDate,
        quantity_assigned: order.quantity,
        remaining_quantity: order.quantity,
        expected_time_minutes: Math.round(totalTimeMinutes),
        setup_time_minutes: Math.round(setupTime),
        buffer_time_minutes: Math.round(bufferTime),
        status: 'planned'
      };
      
      planningResults.push(planningResult);
      
      // Обновляем карту занятости станков
      if (!machineSchedule[machineSelection.machine]) {
        machineSchedule[machineSelection.machine] = [];
      }
      
      machineSchedule[machineSelection.machine].push({
        start: new Date(machineSelection.availableStartTime),
        end: new Date(endDate),
        operationId: operation.id
      });
      
      // Обновляем последнюю дату окончания
      lastEndDate = new Date(endDate);
    }
    
    // Сохраняем результаты планирования в базу данных
    const { data, error } = await supabase
      .from('planning_results')
      .insert(planningResults)
      .select();
    
    if (error) throw error;
    
    // Обновляем прогноз завершения заказа
    const forecastedCompletionDate = new Date(
      Math.max(...planningResults.map(pr => new Date(pr.planned_end_date).getTime()))
    );
    
    await supabase
      .from('orders')
      .update({
        forecasted_completion_date: forecastedCompletionDate,
        is_on_schedule: forecastedCompletionDate <= new Date(order.deadline),
        last_recalculation_at: new Date()
      })
      .eq('id', orderId);
    
    return data;
  },
  
  async getPlanningResults(orderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('planning_results')
      .select(`
        *,
        operations:operation_id(*)
      `)
      .eq('order_id', orderId)
      .order('planned_start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  async runAdaptivePlanning(orderId: string): Promise<any[]> {
    // Получаем данные о заказе и его операциях
    const order = await orderService.getOrderById(orderId);
    
    // Получаем данные о сменах
    const { data: shiftsData, error: shiftsError } = await supabase
      .from('shifts')
      .select('*');
    
    if (shiftsError) throw shiftsError;
    
    // Выбираем смены, относящиеся к операциям этого заказа
    const relevantShifts = shiftsData.filter(shift => {
      if (!shift.operations || !Array.isArray(shift.operations)) return false;
      
      return shift.operations.some(op => 
        order.operations.some(orderOp => orderOp.id === op.operationId)
      );
    });
    
    // Получаем текущие результаты планирования
    const { data: currentPlans, error: plansError } = await supabase
      .from('planning_results')
      .select()
      .eq('order_id', orderId);
    
    if (plansError) throw plansError;
    
    // Обогащаем операции данными о выполнении из смен
    const enrichedOperations = order.operations.map(operation => {
      // Находим все операции из смен для данной операции
      const completedOperations = [];
      
      for (const shift of relevantShifts) {
        if (shift.operations && Array.isArray(shift.operations)) {
          const matchingOps = shift.operations.filter(op => op.operationId === operation.id);
          completedOperations.push(...matchingOps);
        }
      }
      
      if (completedOperations.length === 0) {
        return operation;
      }
      
      // Суммируем выполненные единицы
      const completedUnits = completedOperations.reduce(
        (sum, op) => sum + (op.completedUnits || 0), 0
      );
      
      // Суммируем затраченное время
      const totalTime = completedOperations.reduce(
        (sum, op) => sum + (op.timeSpent || 0), 0
      );
      
      // Определяем статус операции
      let status = "pending";
      let actualTime = undefined;
      
      if (completedUnits >= order.quantity) {
        status = "completed";
        if (completedUnits > 0) {
          actualTime = Math.round(totalTime / completedUnits);
        }
      } else if (completedUnits > 0) {
        status = "in-progress";
      }
      
      return {
        ...operation,
        completedUnits,
        actualTime,
        status
      };
    });
    
    // Обновляем операции в базе данных
    for (const operation of enrichedOperations) {
      await supabase
        .from('operations')
        .update({
          completed_units: operation.completedUnits || 0,
          actual_time: operation.actualTime,
          status: operation.status
        })
        .eq('id', operation.id);
    }
    
    // Перепланируем незавершенные операции
    const updatedPlans = [];
    
    for (const operation of enrichedOperations) {
      // Пропускаем завершенные операции
      if (operation.status === 'completed') {
        continue;
      }
      
      // Находим текущий план
      const currentPlan = currentPlans.find(p => p.operation_id === operation.id);
      if (!currentPlan) continue;
      
      // Для незавершенных операций, которые еще не начались
      if (operation.status === 'pending' && new Date(currentPlan.planned_start_date) > new Date()) {
        // Получаем актуальное расписание всех станков
        const { data: allResults } = await supabase
          .from('planning_results')
          .select();
        
        // Создаем карту занятости станков
        const machineSchedule = {};
        
        for (const result of allResults) {
          // Пропускаем текущий план для избежания самоблокировки
          if (result.id === currentPlan.id) continue;
          
          if (!machineSchedule[result.machine]) {
            machineSchedule[result.machine] = [];
          }
          
          machineSchedule[result.machine].push({
            start: new Date(result.planned_start_date),
            end: new Date(result.planned_end_date),
            operationId: result.operation_id
          });
        }
        
        // Определяем самую раннюю дату начала
        const earliestStartDate = new Date();
        
        // Находим доступный слот
        const machineSelection = await findAvailableTimeSlot(
          currentPlan.machine,
          earliestStartDate,
          currentPlan.expected_time_minutes,
          machineSchedule
        );
        
        if (machineSelection) {
          // Рассчитываем дату окончания
          const endDate = calculateEndDate(
            machineSelection.availableStartTime,
            currentPlan.expected_time_minutes + currentPlan.setup_time_minutes + currentPlan.buffer_time_minutes
          );
          
          // Обновляем план в базе данных
          const { data, error } = await supabase
            .from('planning_results')
            .update({
              planned_start_date: machineSelection.availableStartTime,
              planned_end_date: endDate,
              status: 'rescheduled',
              last_rescheduled_at: new Date(),
              rescheduled_reason: 'Адаптивное перепланирование'
            })
            .eq('id', currentPlan.id)
            .select();
          
          if (error) throw error;
          updatedPlans.push(data[0]);
        }
      }
    }
    
    // Обновляем прогноз завершения заказа
    const { data: allCurrentPlans } = await supabase
      .from('planning_results')
      .select()
      .eq('order_id', orderId);
    
    if (allCurrentPlans.length > 0) {
      const forecastedCompletionDate = new Date(
        Math.max(...allCurrentPlans.map(pr => new Date(pr.planned_end_date).getTime()))
      );
      
      await supabase
        .from('orders')
        .update({
          forecasted_completion_date: forecastedCompletionDate,
          is_on_schedule: forecastedCompletionDate <= new Date(order.deadline),
          last_recalculation_at: new Date(),
          completion_percentage: this.calculateCompletionPercentage(enrichedOperations)
        })
        .eq('id', orderId);
    }
    
    return updatedPlans;
  },
  
  calculateCompletionPercentage(operations) {
    const totalOperations = operations.length;
    if (totalOperations === 0) return 0;
    
    const completedOperations = operations.filter(op => op.status === 'completed').length;
    const inProgressOperations = operations.filter(op => op.status === 'in-progress').length;
    
    return ((completedOperations + inProgressOperations * 0.5) / totalOperations) * 100;
  }
};
