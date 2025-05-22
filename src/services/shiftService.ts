import { supabase } from './supabase';
import { Shift, Setup } from '../types';
import { v4 as uuidv4 } from 'uuid';
// import { shiftPlanningSync } from './shiftPlanningSync';

export const shiftService = {
  async saveShift(shiftData: Omit<Shift, 'id'>): Promise<Shift> {
    const shiftId = uuidv4();
    
    // Check required fields
    if (!shiftData.date || !shiftData.machine) {
      throw new Error("Missing required fields: date or machine");
    }
    
    // Create the shift
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        id: shiftId,
        date: shiftData.date,
        machine: shiftData.machine,
        is_night: shiftData.isNight,
        operators: shiftData.operators,
        operations: shiftData.operations,
        setups: shiftData.setups || []
      })
      .select();
    
    if (error) throw error;
    
    // Update operations with completed units
    if (shiftData.operations && shiftData.operations.length > 0) {
      await this.updateOperationsProgress(shiftData.operations);
    }
    
    // Handle setups if present
    if (shiftData.setups && shiftData.setups.length > 0) {
      for (const setup of shiftData.setups) {
        await this.saveSetup({
          ...setup,
          id: uuidv4()
        });
      }
    }
    
    // Автоматическая синхронизация с планированием
    /*
    try {
      console.log('🔄 Запускаем автоматическую синхронизацию после сохранения смены...');
      await shiftPlanningSync.autoSyncAfterShiftSave(shiftId);
    } catch (error) {
      console.warn('⚠️ Ошибка автоматической синхронизации:', error);
      // Не прерываем выполнение, если синхронизация не удалась
    }
    */
    
    return {
      id: shiftId,
      date: shiftData.date,
      machine: shiftData.machine,
      isNight: shiftData.isNight,
      operators: shiftData.operators,
      operations: shiftData.operations,
      setups: shiftData.setups
    };
  },
  
  async getShifts(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select()
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(shift => ({
      id: shift.id,
      date: shift.date,
      machine: shift.machine,
      isNight: shift.is_night,
      operators: shift.operators,
      operations: shift.operations,
      setups: shift.setups
    }));
  },
  
  async getShiftsByMachine(machine: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select()
      .eq('machine', machine)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(shift => ({
      id: shift.id,
      date: shift.date,
      machine: shift.machine,
      isNight: shift.is_night,
      operators: shift.operators,
      operations: shift.operations,
      setups: shift.setups
    }));
  },
  
  async updateOperationsProgress(shiftOperations: { operationId: string; completedUnits: number; timeSpent: number }[]): Promise<void> {
    for (const operation of shiftOperations) {
      // Get current operation
      const { data: currentOperation, error } = await supabase
        .from('operations')
        .select('id, completed_units, order_id, status')
        .eq('id', operation.operationId)
        .single();
      
      if (error) continue;
      
      // Get order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('quantity')
        .eq('id', currentOperation.order_id)
        .single();
      
      if (orderError) continue;
      
      // Update completed units
      const completedUnits = (currentOperation.completed_units || 0) + operation.completedUnits;
      
      // Determine status
      let status = currentOperation.status;
      if (completedUnits >= order.quantity) {
        status = 'completed';
      } else if (completedUnits > 0) {
        status = 'in-progress';
      }
      
      // Update operation
      await supabase
        .from('operations')
        .update({
          completed_units: completedUnits,
          status: status
        })
        .eq('id', operation.operationId);
      
      // Update order progress
      await this.updateOrderProgress(currentOperation.order_id);
    }
  },
  
  async updateOrderProgress(orderId: string): Promise<void> {
    // Get all operations for the order
    const { data: operations, error } = await supabase
      .from('operations')
      .select('status')
      .eq('order_id', orderId);
    
    if (error) throw error;
    
    // Calculate progress
    const totalOperations = operations.length;
    const completedOperations = operations.filter(op => op.status === 'completed').length;
    const inProgressOperations = operations.filter(op => op.status === 'in-progress').length;
    
    const completionPercentage = totalOperations > 0 ? 
      ((completedOperations + inProgressOperations * 0.5) / totalOperations) * 100 : 0;
    
    // Determine status
    let status = 'planned';
    if (completedOperations === totalOperations) {
      status = 'completed';
    } else if (completedOperations + inProgressOperations > 0) {
      status = 'in-progress';
    }
    
    // Update order
    await supabase
      .from('orders')
      .update({
        completion_percentage: completionPercentage,
        status: status
      })
      .eq('id', orderId);
  },
  
  async saveSetup(setupData: Setup): Promise<Setup> {
    const { data, error } = await supabase
      .from('setups')
      .insert({
        id: setupData.id || uuidv4(),
        drawing_number: setupData.drawingNumber,
        setup_type: setupData.setupType,
        operation_number: setupData.operationNumber,
        time_spent: setupData.timeSpent,
        operator: setupData.operator,
        start_time: setupData.startTime,
        date: setupData.date,
        machine: setupData.machine
      })
      .select();
    
    if (error) throw error;
    
    return {
      id: data[0].id,
      drawingNumber: data[0].drawing_number,
      setupType: data[0].setup_type,
      operationNumber: data[0].operation_number,
      timeSpent: data[0].time_spent,
      operator: data[0].operator,
      startTime: data[0].start_time,
      date: data[0].date,
      machine: data[0].machine
    };
  },
  
  async getSetups(): Promise<Setup[]> {
    const { data, error } = await supabase
      .from('setups')
      .select()
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(setup => ({
      id: setup.id,
      drawingNumber: setup.drawing_number,
      setupType: setup.setup_type,
      operationNumber: setup.operation_number,
      timeSpent: setup.time_spent,
      operator: setup.operator,
      startTime: setup.start_time,
      date: setup.date,
      machine: setup.machine
    }));
  }
};
