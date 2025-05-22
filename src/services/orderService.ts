import { supabase } from './supabase';
import { Order, Operation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id'>): Promise<Order> {
    const orderId = uuidv4();
    const newOrder = {
      ...orderData,
      id: orderId,
      operations: orderData.operations.map(op => ({
        ...op,
        id: uuidv4(),
        orderId
      }))
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        id: newOrder.id,
        drawing_number: newOrder.drawingNumber,
        deadline: newOrder.deadline,
        quantity: newOrder.quantity,
        remaining_quantity: newOrder.quantity,
        priority: newOrder.priority,
        status: 'planned',
        completion_percentage: 0,
        pdf_url: newOrder.pdfUrl
      }])
      .select();
    
    if (error) throw error;
    
    // Insert operations
    const operationsToInsert = newOrder.operations.map(op => ({
      id: op.id,
      order_id: newOrder.id,
      sequence_number: op.sequenceNumber,
      machine: op.machine,
      operation_type: op.operationType,
      estimated_time: op.estimatedTime,
      completed_units: 0,
      status: 'pending',
      operators: op.operators || []
    }));
    
    const { error: operationsError } = await supabase
      .from('operations')
      .insert(operationsToInsert);
    
    if (operationsError) throw operationsError;
    
    return newOrder;
  },
  
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .order('deadline', { ascending: true });
    
    if (error) throw error;
    
    // Format into our application's structure
    const orders = await Promise.all(data.map(async (order) => {
      const { data: operations, error: opsError } = await supabase
        .from('operations')
        .select()
        .eq('order_id', order.id)
        .order('sequence_number', { ascending: true });
      
      if (opsError) throw opsError;
      
      return {
        id: order.id,
        drawingNumber: order.drawing_number,
        deadline: order.deadline,
        quantity: order.quantity,
        priority: order.priority,
        pdfUrl: order.pdf_url,
        operations: operations.map(op => ({
          id: op.id,
          orderId: op.order_id,
          sequenceNumber: op.sequence_number,
          machine: op.machine,
          operationType: op.operation_type,
          estimatedTime: op.estimated_time,
          completedUnits: op.completed_units,
          actualTime: op.actual_time,
          status: op.status,
          operators: op.operators
        }))
      };
    }));
    
    return orders;
  },
  
  async getOrderById(id: string): Promise<Order> {
    const { data: order, error } = await supabase
      .from('orders')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const { data: operations, error: opsError } = await supabase
      .from('operations')
      .select()
      .eq('order_id', id)
      .order('sequence_number', { ascending: true });
    
    if (opsError) throw opsError;
    
    return {
      id: order.id,
      drawingNumber: order.drawing_number,
      deadline: order.deadline,
      quantity: order.quantity,
      priority: order.priority,
      pdfUrl: order.pdf_url,
      operations: operations.map(op => ({
        id: op.id,
        orderId: op.order_id,
        sequenceNumber: op.sequence_number,
        machine: op.machine,
        operationType: op.operation_type,
        estimatedTime: op.estimated_time,
        completedUnits: op.completed_units,
        actualTime: op.actual_time,
        status: op.status,
        operators: op.operators
      }))
    };
  },
  
  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({
        drawing_number: orderData.drawingNumber,
        deadline: orderData.deadline,
        quantity: orderData.quantity,
        priority: orderData.priority,
        pdf_url: orderData.pdfUrl
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // If operations are provided, update them
    if (orderData.operations) {
      for (const operation of orderData.operations) {
        if (operation.id) {
          // Update existing operation
          await supabase
            .from('operations')
            .update({
              sequence_number: operation.sequenceNumber,
              machine: operation.machine,
              operation_type: operation.operationType,
              estimated_time: operation.estimatedTime,
              operators: operation.operators
            })
            .eq('id', operation.id);
        } else {
          // Create new operation
          await supabase
            .from('operations')
            .insert({
              id: uuidv4(),
              order_id: id,
              sequence_number: operation.sequenceNumber,
              machine: operation.machine,
              operation_type: operation.operationType,
              estimated_time: operation.estimatedTime,
              completed_units: 0,
              status: 'pending',
              operators: operation.operators || []
            });
        }
      }
    }
    
    return this.getOrderById(id);
  },
  
  async deleteOrder(id: string): Promise<void> {
    // Delete operations first (foreign key constraint)
    const { error: opsError } = await supabase
      .from('operations')
      .delete()
      .eq('order_id', id);
    
    if (opsError) throw opsError;
    
    // Now delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  async createOperation(operationData: Operation): Promise<Operation> {
    const { data, error } = await supabase
      .from('operations')
      .insert({
        id: operationData.id || uuidv4(),
        order_id: operationData.orderId,
        sequence_number: operationData.sequenceNumber,
        machine: operationData.machine,
        operation_type: operationData.operationType,
        estimated_time: operationData.estimatedTime,
        completed_units: operationData.completedUnits || 0,
        actual_time: operationData.actualTime,
        status: operationData.status,
        operators: operationData.operators
      })
      .select();
    
    if (error) throw error;
    
    return {
      id: data[0].id,
      orderId: data[0].order_id,
      sequenceNumber: data[0].sequence_number,
      machine: data[0].machine,
      operationType: data[0].operation_type,
      estimatedTime: data[0].estimated_time,
      completedUnits: data[0].completed_units,
      actualTime: data[0].actual_time,
      status: data[0].status,
      operators: data[0].operators
    };
  },
  
  async updateOperation(id: string, operationData: Partial<Operation>): Promise<Operation> {
    const { data, error } = await supabase
      .from('operations')
      .update({
        sequence_number: operationData.sequenceNumber,
        machine: operationData.machine,
        operation_type: operationData.operationType,
        estimated_time: operationData.estimatedTime,
        completed_units: operationData.completedUnits,
        actual_time: operationData.actualTime,
        status: operationData.status,
        operators: operationData.operators
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return {
      id: data[0].id,
      orderId: data[0].order_id,
      sequenceNumber: data[0].sequence_number,
      machine: data[0].machine,
      operationType: data[0].operation_type,
      estimatedTime: data[0].estimated_time,
      completedUnits: data[0].completed_units,
      actualTime: data[0].actual_time,
      status: data[0].status,
      operators: data[0].operators
    };
  }
};
