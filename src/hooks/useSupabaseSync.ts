import { useEffect, useRef, useCallback } from 'react';
import { 
  syncWithSupabase, 
  loadFromSupabase, 
  orderService, 
  operationService, 
  planningService,
  SupabaseOrder,
  SupabaseOperation,
  SupabasePlanning
} from '../utils/supabaseClient';
import { Order } from '../types';

interface SupabaseSyncOptions {
  autoSync: boolean;
  syncInterval: number; // в миллисекундах
  onSyncStart?: () => void;
  onSyncSuccess?: (result: any) => void;
  onSyncError?: (error: any) => void;
  accessToken?: string;
}

export const useSupabaseSync = (
  orders: Order[],
  planningResults: any[],
  updateOrders: (orders: Order[]) => void,
  options: SupabaseSyncOptions = {
    autoSync: true,
    syncInterval: 30000, // 30 секунд по умолчанию
  }
) => {
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  
  // Функция для конвертации данных приложения в формат Supabase
  const convertToSupabaseFormat = useCallback((orders: Order[]) => {
    const supabaseOrders: SupabaseOrder[] = [];
    const supabaseOperations: SupabaseOperation[] = [];
    
    orders.forEach(order => {
      // Конвертируем заказ
      supabaseOrders.push({
        id: order.id,
        name: order.name || order.drawingNumber,
        client_name: order.clientName || order.drawingNumber,
        drawing_number: order.drawingNumber,
        deadline: order.deadline,
        quantity: order.quantity,
        priority: order.priority,
        pdf_url: order.pdfUrl,
        updated_at: new Date().toISOString()
      });
      
      // Конвертируем операции
      order.operations?.forEach((operation, index) => {
        supabaseOperations.push({
          id: operation.id,
          order_id: order.id,
          sequence_number: operation.sequenceNumber || index + 1,
          machine: operation.machine,
          operation_type: operation.operationType,
          estimated_time: operation.estimatedTime,
          completed_units: operation.completedUnits,
          actual_time: operation.actualTime,
          status: operation.status || 'pending',
          operators: operation.operators || [],
          updated_at: new Date().toISOString()
        });
      });
    });
    
    return { supabaseOrders, supabaseOperations };
  }, []);
  
  // Функция для синхронизации одного заказа
  const syncSingleOrder = useCallback(async (order: Order) => {
    if (isSyncingRef.current) return;
    
    try {
      isSyncingRef.current = true;
      console.log(`🔄 Синхронизация заказа: ${order.drawingNumber}`);
      
      const { supabaseOrders, supabaseOperations } = convertToSupabaseFormat([order]);
      
      // Синхронизируем заказ
      if (supabaseOrders.length > 0) {
        await orderService.upsertOrder(supabaseOrders[0]);
      }
      
      // Синхронизируем операции
      if (supabaseOperations.length > 0) {
        await operationService.upsertOperations(supabaseOperations);
      }
      
      console.log(`✅ Заказ ${order.drawingNumber} синхронизирован`);
      options.onSyncSuccess?.({ ordersCount: 1, operationsCount: supabaseOperations.length });
      
    } catch (error) {
      console.error(`❌ Ошибка синхронизации заказа ${order.drawingNumber}:`, error);
      options.onSyncError?.(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [convertToSupabaseFormat, options]);
  
  // Функция для полной синхронизации
  const syncAllData = useCallback(async () => {
    if (isSyncingRef.current) return;
    
    try {
      isSyncingRef.current = true;
      options.onSyncStart?.();
      
      console.log('🔄 Полная синхронизация с Supabase...');
      
      const result = await syncWithSupabase(orders, planningResults, options.accessToken);
      
      if (result.success) {
        lastSyncRef.current = Date.now();
        options.onSyncSuccess?.(result);
        console.log('✅ Полная синхронизация завершена');
      } else {
        throw result.error;
      }
      
    } catch (error) {
      console.error('❌ Ошибка полной синхронизации:', error);
      options.onSyncError?.(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [orders, planningResults, options]);
  
  // Функция для загрузки данных из Supabase
  const loadData = useCallback(async () => {
    if (isSyncingRef.current) return;
    
    try {
      isSyncingRef.current = true;
      options.onSyncStart?.();
      
      console.log('⬇️ Загрузка данных из Supabase...');
      
      const result = await loadFromSupabase(options.accessToken);
      
      if (result.success && result.orders) {
        updateOrders(result.orders);
        options.onSyncSuccess?.(result);
        console.log('✅ Данные загружены из Supabase');
      } else {
        throw result.error;
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      options.onSyncError?.(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [updateOrders, options]);
  
  // Автоматическая синхронизация по интервалу
  useEffect(() => {
    if (!options.autoSync) return;
    
    const scheduleSync = () => {
      syncTimeoutRef.current = setTimeout(() => {
        if (!isSyncingRef.current && Date.now() - lastSyncRef.current > options.syncInterval) {
          syncAllData().finally(scheduleSync);
        } else {
          scheduleSync();
        }
      }, options.syncInterval);
    };
    
    scheduleSync();
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [options.autoSync, options.syncInterval, syncAllData]);
  
  // Синхронизация при изменении данных
  useEffect(() => {
    if (orders.length > 0 && !isSyncingRef.current) {
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      // Синхронизируем не чаще чем раз в 5 секунд
      if (timeSinceLastSync > 5000) {
        const timeoutId = setTimeout(() => {
          syncAllData();
        }, 2000); // Задержка 2 секунды после изменения
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [orders, syncAllData]);
  
  return {
    syncSingleOrder,
    syncAllData,
    loadData,
    isSyncing: isSyncingRef.current,
    lastSync: lastSyncRef.current
  };
};

// Хук для автоматической синхронизации при изменении конкретного заказа
export const useOrderSync = (
  order: Order | undefined,
  options: Pick<SupabaseSyncOptions, 'onSyncStart' | 'onSyncSuccess' | 'onSyncError' | 'accessToken'> = {}
) => {
  const isSyncingRef = useRef<boolean>(false);
  
  const syncOrder = useCallback(async () => {
    if (!order || isSyncingRef.current) return;
    
    try {
      isSyncingRef.current = true;
      options.onSyncStart?.();
      
      console.log(`🔄 Синхронизация заказа: ${order.drawingNumber}`);
      
      // Конвертируем заказ в формат Supabase
      const supabaseOrder: SupabaseOrder = {
        id: order.id,
        name: order.name || order.drawingNumber,
        client_name: order.clientName || order.drawingNumber,
        drawing_number: order.drawingNumber,
        deadline: order.deadline,
        quantity: order.quantity,
        priority: order.priority,
        pdf_url: order.pdfUrl,
        updated_at: new Date().toISOString()
      };
      
      // Конвертируем операции
      const supabaseOperations: SupabaseOperation[] = (order.operations || []).map((operation, index) => ({
        id: operation.id,
        order_id: order.id,
        sequence_number: operation.sequenceNumber || index + 1,
        machine: operation.machine,
        operation_type: operation.operationType,
        estimated_time: operation.estimatedTime,
        completed_units: operation.completedUnits,
        actual_time: operation.actualTime,
        status: operation.status || 'pending',
        operators: operation.operators || [],
        updated_at: new Date().toISOString()
      }));
      
      // Синхронизируем с Supabase
      await orderService.upsertOrder(supabaseOrder);
      if (supabaseOperations.length > 0) {
        await operationService.upsertOperations(supabaseOperations);
      }
      
      console.log(`✅ Заказ ${order.drawingNumber} синхронизирован`);
      options.onSyncSuccess?.({ ordersCount: 1, operationsCount: supabaseOperations.length });
      
    } catch (error) {
      console.error(`❌ Ошибка синхронизации заказа ${order?.drawingNumber}:`, error);
      options.onSyncError?.(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [order, options]);
  
  // Автоматическая синхронизация при изменении заказа
  useEffect(() => {
    if (order) {
      const timeoutId = setTimeout(() => {
        syncOrder();
      }, 1000); // Задержка 1 секунда после изменения
      
      return () => clearTimeout(timeoutId);
    }
  }, [order, syncOrder]);
  
  return {
    syncOrder,
    isSyncing: isSyncingRef.current
  };
};
