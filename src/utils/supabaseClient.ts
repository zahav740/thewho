import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Функция для проверки, является ли строка UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Функция для обеспечения формата UUID для идентификаторов
const ensureUUID = (id: string): string => {
  if (isUUID(id)) {
    return id; // Если уже UUID, возвращаем как есть
  }
  
  // Если не UUID, создаем новый UUID
  return uuidv4();
};

// Функция для миграции идентификаторов в заказах
const migrateOrderIds = (orders: any[]): { orders: any[], idMapping: Record<string, string> } => {
  const idMapping: Record<string, string> = {}; // Соответствия старых ID к новым UUID
  
  console.log(`🔄 Начинаем миграцию ${orders.length} заказов...`);
  
  // Преобразуем заказы и операции
  const migratedOrders = orders.map((order, orderIndex) => {
    const oldOrderId = order.id;
    const newOrderId = isUUID(oldOrderId) ? oldOrderId : uuidv4();
    
    console.log(`📦 Заказ ${orderIndex + 1}: ${oldOrderId} -> ${newOrderId}`);
    
    // Запоминаем соответствие для операций
    if (oldOrderId !== newOrderId) {
      idMapping[oldOrderId] = newOrderId;
    }
    
    // Преобразуем операции
    const migratedOperations = (order.operations || []).map((operation: any, opIndex: number) => {
      const oldOpId = operation.id;
      const newOpId = isUUID(oldOpId) ? oldOpId : uuidv4();
      
      console.log(`  ⚙️ Операция ${opIndex + 1}: ${oldOpId} -> ${newOpId}`);
      
      if (oldOpId !== newOpId) {
        idMapping[oldOpId] = newOpId;
      }
      
      return {
        ...operation,
        id: newOpId,
        orderId: newOrderId // Всегда устанавливаем новый ID заказа
      };
    });
    
    return {
      ...order,
      id: newOrderId,
      operations: migratedOperations
    };
  });
  
  console.log(`✅ Миграция завершена. Создано ${Object.keys(idMapping).length} новых UUID`);
  
  return { orders: migratedOrders, idMapping };
};

// Функция для миграции идентификаторов в результатах планирования
const migratePlanningResults = (planningResults: any[], idMapping: Record<string, string>): any[] => {
  console.log(`📋 Начинаем миграцию ${planningResults.length} результатов планирования...`);
  
  return planningResults.map((result, index) => {
    // Создаем новый ID для результата
    const oldResultId = result.id;
    const newResultId = isUUID(oldResultId) ? oldResultId : uuidv4();
    
    // Получаем новые ID для заказа и операции из мэппинга
    const oldOrderId = result.orderId;
    const oldOperationId = result.operationId;
    
    const newOrderId = idMapping[oldOrderId] || (isUUID(oldOrderId) ? oldOrderId : uuidv4());
    const newOperationId = idMapping[oldOperationId] || (isUUID(oldOperationId) ? oldOperationId : uuidv4());
    
    console.log(`  📅 Планирование ${index + 1}:`);
    console.log(`    Result: ${oldResultId} -> ${newResultId}`);
    console.log(`    Order: ${oldOrderId} -> ${newOrderId}`);
    console.log(`    Operation: ${oldOperationId} -> ${newOperationId}`);
    
    // Обновляем мэппинг для новых ID
    if (oldOrderId !== newOrderId && !idMapping[oldOrderId]) {
      idMapping[oldOrderId] = newOrderId;
    }
    if (oldOperationId !== newOperationId && !idMapping[oldOperationId]) {
      idMapping[oldOperationId] = newOperationId;
    }
    
    return {
      ...result,
      id: newResultId,
      orderId: newOrderId,
      operationId: newOperationId
    };
  });
};

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kukqacmzfmzepdfddppl.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w'; // Ключ должен быть задан в .env файле

export const supabase = createClient(supabaseUrl, supabaseKey);

// Типы таблиц для Supabase (обновленные согласно новой схеме)
export type SupabaseOrder = {
  id: string;
  name?: string; // Имя заказа
  client_name?: string; // Имя клиента
  drawing_number: string;
  deadline: string;
  quantity: number;
  priority: number;
  pdf_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseOperation = {
  id: string;
  order_id: string;
  sequence_number: number;
  machine?: string;
  operation_type: "3-axis" | "4-axis" | "turning" | "milling";
  estimated_time: number;
  completed_units?: number;
  actual_time?: number;
  status: "pending" | "in-progress" | "completed";
  operators?: string[];
  created_at?: string;
  updated_at?: string;
};

export type SupabasePlanning = {
  id: string;
  order_id: string;
  operation_id: string;
  machine: string;
  planned_start_date: string;
  planned_end_date: string;
  quantity_assigned: number;
  remaining_quantity: number;
  expected_time_minutes: number;
  setup_time_minutes: number;
  buffer_time_minutes: number;
  status: 'planned' | 'in-progress' | 'completed' | 'rescheduled';
  last_rescheduled_at?: string;
  rescheduled_reason?: string;
  created_at?: string;
  updated_at?: string;
};

// Функции для работы с заказами
export const orderService = {
  // Получить все заказы
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('priority', { ascending: true })
      .order('deadline', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  // Создать или обновить заказ
  async upsertOrder(order: SupabaseOrder) {
    const { data, error } = await supabase
      .from('orders')
      .upsert(order, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Создать или обновить заказы пакетом
  async upsertOrders(orders: SupabaseOrder[]) {
    const { data, error } = await supabase
      .from('orders')
      .upsert(orders, { onConflict: 'id' })
      .select();
    
    if (error) throw error;
    return data;
  },
  
  // Удалить заказ
  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Функции для работы с операциями
export const operationService = {
  // Получить все операции
  async getAllOperations() {
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .order('sequence_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  // Получить операции по ID заказа
  async getOperationsByOrderId(orderId: string) {
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('order_id', orderId)
      .order('sequence_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  // Создать или обновить операцию
  async upsertOperation(operation: SupabaseOperation) {
    const { data, error } = await supabase
      .from('operations')
      .upsert(operation, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Создать или обновить операции пакетом
  async upsertOperations(operations: SupabaseOperation[]) {
    const { data, error } = await supabase
      .from('operations')
      .upsert(operations, { onConflict: 'id' })
      .select();
    
    if (error) throw error;
    return data;
  },
  
  // Удалить операцию
  async deleteOperation(id: string) {
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Функции для работы с планированием
export const planningService = {
  // Получить все записи планирования
  async getAllPlanningResults() {
    const { data, error } = await supabase
      .from('planning_results')
      .select('*')
      .order('planned_start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  // Получить записи планирования по ID заказа
  async getPlanningByOrderId(orderId: string) {
    const { data, error } = await supabase
      .from('planning_results')
      .select('*')
      .eq('order_id', orderId)
      .order('planned_start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  // Создать или обновить запись планирования
  async upsertPlanning(planning: SupabasePlanning) {
    const { data, error } = await supabase
      .from('planning_results')
      .upsert(planning, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Создать или обновить записи планирования пакетом
  async upsertPlanningResults(planningResults: SupabasePlanning[]) {
    const { data, error } = await supabase
      .from('planning_results')
      .upsert(planningResults, { onConflict: 'id' })
      .select();
    
    if (error) throw error;
    return data;
  },
  
  // Удалить запись планирования
  async deletePlanning(id: string) {
    const { error } = await supabase
      .from('planning_results')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Функция для синхронизации данных с Supabase
export const syncWithSupabase = async (
  orders: any[], 
  planningResults: any[],
  accessToken?: string
) => {
  try {
    // Если есть токен доступа, используем его
    if (accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: ''
      } as any);
    }

    console.log('🔄 Начинаем синхронизацию с новой схемой Supabase...');
    console.log(`📦 Заказов: ${orders.length}, Планирование: ${planningResults.length}`);
    
    // Проверяем, есть ли данные для синхронизации
    if (!orders || orders.length === 0) {
      console.log('ℹ️ Нет заказов для синхронизации');
    }
    
    if (!planningResults || planningResults.length === 0) {
      console.log('ℹ️ Нет результатов планирования для синхронизации');
    }
    const { orders: migratedOrders, idMapping } = migrateOrderIds(orders);
    
    // Мигрируем ID в результатах планирования
    const migratedPlanningResults = migratePlanningResults(planningResults, idMapping);
    
    // Подготавливаем заказы для Supabase
    const supabaseOrders: SupabaseOrder[] = migratedOrders.map(order => ({
      id: order.id,
      name: order.name || order.drawingNumber, // Используем name или drawingNumber
      client_name: order.clientName || order.drawingNumber, // Используем clientName или drawingNumber
      drawing_number: order.drawingNumber,
      deadline: order.deadline,
      quantity: order.quantity,
      priority: order.priority,
      pdf_url: order.pdfUrl
    }));
    
    // Подготавливаем операции для Supabase
    const supabaseOperations: SupabaseOperation[] = [];
    for (const order of migratedOrders) {
      for (const operation of order.operations) {
        supabaseOperations.push({
          id: operation.id,
          order_id: order.id,
          sequence_number: operation.sequenceNumber,
          machine: operation.machine,
          operation_type: operation.operationType,
          estimated_time: operation.estimatedTime,
          completed_units: operation.completedUnits,
          actual_time: operation.actualTime,
          status: operation.status,
          operators: operation.operators || []
        });
      }
    }
    
    // Подготавливаем результаты планирования для Supabase
    const supabasePlanningResults: SupabasePlanning[] = migratedPlanningResults.map(result => {
      // Проверяем все UUID перед отправкой
      const resultId = isUUID(result.id) ? result.id : uuidv4();
      const orderId = isUUID(result.orderId) ? result.orderId : uuidv4();
      const operationId = isUUID(result.operationId) ? result.operationId : uuidv4();
      
      console.log(`🔍 Проверка UUID для планирования:`);
      console.log(`  Result ID: ${result.id} -> ${resultId} (valid: ${isUUID(resultId)})`);
      console.log(`  Order ID: ${result.orderId} -> ${orderId} (valid: ${isUUID(orderId)})`);
      console.log(`  Operation ID: ${result.operationId} -> ${operationId} (valid: ${isUUID(operationId)})`);
      
      return {
        id: resultId,
        order_id: orderId,
        operation_id: operationId,
        machine: result.machine,
        planned_start_date: result.plannedStartDate,
        planned_end_date: result.plannedEndDate,
        quantity_assigned: result.quantityAssigned,
        remaining_quantity: result.remainingQuantity,
        expected_time_minutes: result.expectedTimeMinutes,
        setup_time_minutes: result.setupTimeMinutes,
        buffer_time_minutes: result.bufferTimeMinutes,
        status: result.status,
        last_rescheduled_at: result.lastRescheduledAt,
        rescheduled_reason: result.rescheduledReason
      };
    });
    
    // Сохраняем данные в Supabase
    await orderService.upsertOrders(supabaseOrders);
    console.log(`✅ Синхронизировано ${supabaseOrders.length} заказов`);
    
    await operationService.upsertOperations(supabaseOperations);
    console.log(`✅ Синхронизировано ${supabaseOperations.length} операций`);
    
    await planningService.upsertPlanningResults(supabasePlanningResults);
    console.log(`✅ Синхронизировано ${supabasePlanningResults.length} записей планирования`);
    
    // Возвращаем мигрированные данные, чтобы обновить локальные данные
    console.log('🎉 Синхронизация с новой схемой Supabase завершена успешно!');
    
    return {
      success: true,
      ordersCount: supabaseOrders.length,
      operationsCount: supabaseOperations.length,
      planningCount: supabasePlanningResults.length,
      migratedOrders,
      migratedPlanningResults
    };
  } catch (error) {
    console.error('❌ Ошибка синхронизации с Supabase:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Функция для загрузки данных из Supabase
export const loadFromSupabase = async (accessToken?: string) => {
  try {
    // Если есть токен доступа, используем его
    if (accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: ''
      } as any);
    }

    console.log('🔄 Загрузка данных из новой схемы Supabase...');
    
    // Получаем все данные параллельно
    const [ordersData, operationsData, planningData] = await Promise.all([
      orderService.getAllOrders(),
      operationService.getAllOperations(),
      planningService.getAllPlanningResults()
    ]);
    
    // Конвертируем заказы из Supabase в формат приложения
    const orders = ordersData.map(order => ({
      id: order.id,
      drawingNumber: order.drawing_number,
      name: order.name || order.drawing_number,
      clientName: order.client_name || order.drawing_number,
      deadline: order.deadline,
      quantity: order.quantity,
      priority: order.priority,
      pdfUrl: order.pdf_url,
      operations: [] // Заполним позже
    }));
    
    // Добавляем операции к заказам
    for (const operation of operationsData) {
      const orderIndex = orders.findIndex(o => o.id === operation.order_id);
      if (orderIndex !== -1) {
        if (!orders[orderIndex].operations) {
          orders[orderIndex].operations = [];
        }
        
        orders[orderIndex].operations.push({
          id: operation.id,
          orderId: operation.order_id,
          sequenceNumber: operation.sequence_number,
          machine: operation.machine,
          operationType: operation.operation_type,
          estimatedTime: operation.estimated_time,
          completedUnits: operation.completed_units,
          actualTime: operation.actual_time,
          status: operation.status,
          operators: operation.operators || []
        });
      }
    }
    
    // Сортируем операции по номеру последовательности
    for (const order of orders) {
      if (order.operations) {
        order.operations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      }
    }
    
    // Конвертируем планирование из Supabase в формат приложения
    const planningResults = planningData.map(planning => ({
      id: planning.id,
      orderId: planning.order_id,
      operationId: planning.operation_id,
      machine: planning.machine,
      plannedStartDate: planning.planned_start_date,
      plannedEndDate: planning.planned_end_date,
      quantityAssigned: planning.quantity_assigned,
      remainingQuantity: planning.remaining_quantity,
      expectedTimeMinutes: planning.expected_time_minutes,
      setupTimeMinutes: planning.setup_time_minutes,
      bufferTimeMinutes: planning.buffer_time_minutes,
      status: planning.status,
      lastRescheduledAt: planning.last_rescheduled_at,
      rescheduledReason: planning.rescheduled_reason
    }));
    
    console.log(`✅ Загружено ${orders.length} заказов, ${operationsData.length} операций, ${planningResults.length} записей планирования`);
    
    return {
      success: true,
      orders,
      planningResults
    };
  } catch (error) {
    console.error('❌ Ошибка загрузки данных из Supabase:', error);
    return {
      success: false,
      error: error
    };
  }
};
