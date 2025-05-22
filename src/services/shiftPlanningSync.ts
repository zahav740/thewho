import { supabase } from './supabase';
import { Shift, Order, Operation } from '../types';
import { planningService } from './planningService';

/**
 * Сервис синхронизации смен с планированием
 * Основная задача: обеспечить соответствие между планом и фактом
 */
export const shiftPlanningSync = {
  
  /**
   * Синхронизирует данные смен с планированием
   * Обновляет статус операций и станки на основе фактических данных
   */
  async syncShiftsWithPlanning(): Promise<void> {
    console.log('🔄 Начинаем синхронизацию смен с планированием...');
    
    try {
      // Получаем все смены
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: true });
      
      if (shiftsError) throw shiftsError;
      
      // Получаем все заказы с операциями
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          operations:operations(*)
        `);
      
      if (ordersError) throw ordersError;
      
      // Получаем результаты планирования
      const { data: planningResults, error: planningError } = await supabase
        .from('planning_results')
        .select('*');
      
      if (planningError) throw planningError;
      
      const updates = {
        operationsToUpdate: [] as any[],
        planningToUpdate: [] as any[],
        machineChanges: [] as any[]
      };
      
      console.log(`📊 Найдено смен: ${shifts.length}, заказов: ${orders.length}, планирований: ${planningResults.length}`);
      
      // Обрабатываем каждую смену
      for (const shift of shifts) {
        console.log(`\n📅 Обрабатываем смену: ${shift.machine}, дата: ${new Date(shift.date).toLocaleDateString()}`);
        
        if (!shift.operations || !Array.isArray(shift.operations)) {
          console.log('  ⚠️ В смене нет операций');
          continue;
        }
        
        // Обрабатываем операции в смене
        for (const shiftOperation of shift.operations) {
          const result = await this.processShiftOperation(
            shiftOperation, 
            shift, 
            orders, 
            planningResults
          );
          
          if (result.operationUpdate) {
            updates.operationsToUpdate.push(result.operationUpdate);
          }
          
          if (result.planningUpdate) {
            updates.planningToUpdate.push(result.planningUpdate);
          }
          
          if (result.machineChange) {
            updates.machineChanges.push(result.machineChange);
          }
        }
        
        // Обрабатываем наладки в смене
        if (shift.setups && Array.isArray(shift.setups)) {
          for (const setup of shift.setups) {
            await this.processShiftSetup(setup, shift, orders, planningResults);
          }
        }
      }
      
      // Применяем все обновления
      await this.applyUpdates(updates);
      
      // Если были смены станков, запускаем перепланирование
      if (updates.machineChanges.length > 0) {
        console.log(`🔄 Обнаружены смены станков (${updates.machineChanges.length}), запускаем перепланирование...`);
        await this.triggerReplanning(updates.machineChanges);
      }
      
      console.log('✅ Синхронизация завершена успешно');
      
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      throw error;
    }
  },
  
  /**
   * Обрабатывает операцию из смены
   */
  async processShiftOperation(
    shiftOperation: any,
    shift: Shift,
    orders: any[],
    planningResults: any[]
  ): Promise<{
    operationUpdate?: any;
    planningUpdate?: any;
    machineChange?: any;
  }> {
    console.log(`  🔧 Обрабатываем операцию: ${shiftOperation.drawingNumber} (ID: ${shiftOperation.operationId})`);
    
    // Находим операцию и заказ
    const { operation, order } = this.findOperationByIdOrDrawing(
      shiftOperation.operationId,
      shiftOperation.drawingNumber,
      orders
    );
    
    if (!operation || !order) {
      console.warn(`    ⚠️ Не найдена операция для ${shiftOperation.drawingNumber}`);
      return {};
    }
    
    console.log(`    ✅ Найдена операция ${operation.sequence_number} в заказе ${order.drawing_number}`);
    
    // Находим соответствующий результат планирования
    const planningResult = planningResults.find(pr => pr.operation_id === operation.id);
    if (!planningResult) {
      console.warn(`    ⚠️ Не найден результат планирования для операции ${operation.id}`);
      return {};
    }
    
    // Вычисляем новые данные операции
    const currentCompleted = operation.completed_units || 0;
    const newCompleted = currentCompleted + shiftOperation.completedUnits;
    const totalRequired = order.quantity;
    
    // Определяем новый статус
    let newStatus = operation.status;
    if (newCompleted >= totalRequired) {
      newStatus = 'completed';
    } else if (newCompleted > 0) {
      newStatus = 'in-progress';
    }
    
    // Проверяем смену станка
    const machineChanged = planningResult.machine !== shift.machine;
    
    console.log(`    📊 Статус: ${operation.status} → ${newStatus}, выполнено: ${currentCompleted} + ${shiftOperation.completedUnits} = ${newCompleted}/${totalRequired}`);
    
    if (machineChanged) {
      console.log(`    🔄 СМЕНА СТАНКА: ${planningResult.machine} → ${shift.machine}`);
    }
    
    const result: any = {};
    
    // Обновление операции
    result.operationUpdate = {
      id: operation.id,
      completed_units: newCompleted,
      status: newStatus,
      actual_time: shiftOperation.timeSpent || operation.actual_time
    };
    
    // Обновление планирования (если была смена станка)
    if (machineChanged) {
      result.planningUpdate = {
        id: planningResult.id,
        machine: shift.machine,
        status: 'rescheduled',
        last_rescheduled_at: new Date().toISOString(),
        rescheduled_reason: `Операция перенесена с ${planningResult.machine} на ${shift.machine} по факту выполнения`
      };
      
      result.machineChange = {
        operationId: operation.id,
        orderId: order.id,
        oldMachine: planningResult.machine,
        newMachine: shift.machine,
        reason: 'Фактическое выполнение на другом станке'
      };
    }
    
    return result;
  },
  
  /**
   * Обрабатывает наладку из смены
   */
  async processShiftSetup(
    setup: any,
    shift: Shift,
    orders: any[],
    planningResults: any[]
  ): Promise<void> {
    console.log(`  🔧 Обрабатываем наладку: ${setup.drawingNumber}, операция: ${setup.operationNumber}`);
    
    // Находим операцию по чертежу и номеру операции
    const { operation } = this.findOperationByDrawingAndSequence(
      setup.drawingNumber,
      setup.operationNumber,
      orders
    );
    
    if (!operation) {
      console.warn(`    ⚠️ Не найдена операция для наладки ${setup.drawingNumber}:${setup.operationNumber}`);
      return;
    }
    
    // Находим результат планирования
    const planningResult = planningResults.find(pr => pr.operation_id === operation.id);
    if (!planningResult) {
      console.warn(`    ⚠️ Не найден результат планирования для наладки`);
      return;
    }
    
    // Обновляем время наладки в планировании
    const updates: any = {
      setup_time_minutes: setup.timeSpent
    };
    
    // Если наладка была на другом станке
    if (planningResult.machine !== shift.machine) {
      updates.machine = shift.machine;
      updates.status = 'rescheduled';
      updates.last_rescheduled_at = new Date().toISOString();
      updates.rescheduled_reason = `Наладка выполнена на станке ${shift.machine}`;
      
      console.log(`    🔄 Наладка на другом станке: ${planningResult.machine} → ${shift.machine}`);
    }
    
    await supabase
      .from('planning_results')
      .update(updates)
      .eq('id', planningResult.id);
    
    console.log(`    ✅ Обновлена наладка: ${setup.timeSpent} мин`);
  },
  
  /**
   * Применяет все накопленные обновления
   */
  async applyUpdates(updates: any): Promise<void> {
    console.log(`\n💾 Применяем обновления:`);
    console.log(`  - Операций: ${updates.operationsToUpdate.length}`);
    console.log(`  - Планирований: ${updates.planningToUpdate.length}`);
    console.log(`  - Смен станков: ${updates.machineChanges.length}`);
    
    // Обновляем операции
    for (const opUpdate of updates.operationsToUpdate) {
      const { id, ...updateData } = opUpdate;
      await supabase
        .from('operations')
        .update(updateData)
        .eq('id', id);
    }
    
    // Обновляем планирование
    for (const planUpdate of updates.planningToUpdate) {
      const { id, ...updateData } = planUpdate;
      await supabase
        .from('planning_results')
        .update(updateData)
        .eq('id', id);
    }
    
    console.log('✅ Все обновления применены');
  },
  
  /**
   * Запускает перепланирование для затронутых заказов
   */
  async triggerReplanning(machineChanges: any[]): Promise<void> {
    const affectedOrderIds = [...new Set(machineChanges.map(mc => mc.orderId))];
    
    console.log(`🔄 Запускаем перепланирование для заказов: ${affectedOrderIds.join(', ')}`);
    
    for (const orderId of affectedOrderIds) {
      try {
        await planningService.runAdaptivePlanning(orderId);
        console.log(`✅ Перепланирование завершено для заказа ${orderId}`);
      } catch (error) {
        console.error(`❌ Ошибка перепланирования заказа ${orderId}:`, error);
      }
    }
  },
  
  /**
   * Находит операцию по ID или по чертежу
   */
  findOperationByIdOrDrawing(
    operationId: string,
    drawingNumber: string,
    orders: any[]
  ): { operation?: any; order?: any } {
    // Сначала пытаемся найти по ID операции
    if (operationId) {
      for (const order of orders) {
        const operation = order.operations?.find((op: any) => op.id === operationId);
        if (operation) {
          return { operation, order };
        }
      }
    }
    
    // Если не нашли по ID, ищем по номеру чертежа
    if (drawingNumber) {
      const order = orders.find(o => o.drawing_number === drawingNumber);
      if (order && order.operations?.length > 0) {
        // Берем первую незавершенную операцию
        const operation = order.operations.find((op: any) => op.status !== 'completed') || order.operations[0];
        return { operation, order };
      }
    }
    
    return {};
  },
  
  /**
   * Находит операцию по чертежу и номеру операции
   */
  findOperationByDrawingAndSequence(
    drawingNumber: string,
    sequenceNumber: number,
    orders: any[]
  ): { operation?: any; order?: any } {
    const order = orders.find(o => o.drawing_number === drawingNumber);
    if (!order) return {};
    
    const operation = order.operations?.find((op: any) => op.sequence_number === sequenceNumber);
    return operation ? { operation, order } : {};
  },
  
  /**
   * Автоматическая синхронизация после сохранения смены
   */
  async autoSyncAfterShiftSave(shiftId: string): Promise<void> {
    console.log(`🚀 Автоматическая синхронизация после сохранения смены ${shiftId}`);
    
    try {
      // Небольшая задержка, чтобы данные успели сохраниться
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Запускаем полную синхронизацию
      await this.syncShiftsWithPlanning();
      
      console.log('✅ Автоматическая синхронизация завершена');
    } catch (error) {
      console.error('❌ Ошибка автоматической синхронизации:', error);
    }
  }
};
