// Тестовый скрипт для проверки новой базы данных Supabase
// Выполните этот код в консоли браузера после запуска приложения

console.log('🧪 Начинаем тестирование новой базы данных Supabase...');

// Импортируем необходимые функции
import { 
  supabase,
  orderService, 
  operationService, 
  planningService,
  machineService,
  alertService
} from './src/utils/supabaseClient.js';

// Тест 1: Проверка подключения
async function testConnection() {
  console.log('\n🔌 Тест 1: Проверка подключения к Supabase...');
  
  try {
    const { data, error } = await supabase.from('machines').select('count').single();
    if (error) throw error;
    
    console.log('✅ Подключение успешно!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    return false;
  }
}

// Тест 2: Проверка таблиц
async function testTables() {
  console.log('\n📊 Тест 2: Проверка созданных таблиц...');
  
  const tables = [
    'orders', 'operations', 'planning_results', 
    'shifts', 'setups', 'machines', 'force_majeure', 'alerts'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      console.log(`✅ Таблица ${table}: OK`);
    } catch (error) {
      console.error(`❌ Таблица ${table}: ${error.message}`);
    }
  }
}

// Тест 3: Проверка станков
async function testMachines() {
  console.log('\n🏭 Тест 3: Проверка справочника станков...');
  
  try {
    const machines = await machineService.getAllMachines();
    console.log(`✅ Загружено ${machines.length} станков:`, machines.map(m => m.name));
    
    if (machines.length === 7) {
      console.log('✅ Все станки загружены корректно!');
    } else {
      console.warn(`⚠️ Ожидалось 7 станков, получено ${machines.length}`);
    }
    
    return machines;
  } catch (error) {
    console.error('❌ Ошибка загрузки станков:', error.message);
    return [];
  }
}

// Тест 4: Создание тестового заказа
async function testCreateOrder() {
  console.log('\n📝 Тест 4: Создание тестового заказа...');
  
  try {
    const testOrder = {
      id: crypto.randomUUID(),
      name: 'Тестовый заказ',
      client_name: 'Тестовый клиент',
      drawing_number: `TEST-${Date.now()}`,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 дней
      quantity: 10,
      priority: 2
    };
    
    const createdOrder = await orderService.upsertOrder(testOrder);
    console.log('✅ Тестовый заказ создан:', createdOrder.drawing_number);
    
    return createdOrder;
  } catch (error) {
    console.error('❌ Ошибка создания заказа:', error.message);
    return null;
  }
}

// Тест 5: Создание тестовой операции
async function testCreateOperation(orderId) {
  console.log('\n⚙️ Тест 5: Создание тестовой операции...');
  
  if (!orderId) {
    console.warn('⚠️ Пропуск теста - нет ID заказа');
    return null;
  }
  
  try {
    const testOperation = {
      id: crypto.randomUUID(),
      order_id: orderId,
      sequence_number: 1,
      machine: 'Doosan Yashana',
      operation_type: '3-axis',
      estimated_time: 60,
      completed_units: 0,
      status: 'pending',
      operators: ['Тестовый оператор']
    };
    
    const createdOperation = await operationService.upsertOperation(testOperation);
    console.log('✅ Тестовая операция создана:', createdOperation.id);
    
    return createdOperation;
  } catch (error) {
    console.error('❌ Ошибка создания операции:', error.message);
    return null;
  }
}

// Тест 6: Проверка представлений
async function testViews() {
  console.log('\n🔍 Тест 6: Проверка представлений базы данных...');
  
  try {
    // Проверяем представление orders_with_operations
    const { data: ordersView, error: ordersError } = await supabase
      .from('orders_with_operations')
      .select('*')
      .limit(1);
    
    if (ordersError) throw ordersError;
    console.log('✅ Представление orders_with_operations: OK');
    
    // Проверяем представление planning_details
    const { data: planningView, error: planningError } = await supabase
      .from('planning_details')
      .select('*')
      .limit(1);
    
    if (planningError) throw planningError;
    console.log('✅ Представление planning_details: OK');
    
  } catch (error) {
    console.error('❌ Ошибка проверки представлений:', error.message);
  }
}

// Тест 7: Проверка функций
async function testFunctions() {
  console.log('\n🔧 Тест 7: Проверка функций базы данных...');
  
  try {
    // Проверяем функцию get_machine_load_by_day
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .rpc('get_machine_load_by_day', {
        machine_name: 'Doosan Yashana',
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) throw error;
    console.log('✅ Функция get_machine_load_by_day: OK');
    
    // Проверяем функцию check_planning_conflicts
    const { data: conflictData, error: conflictError } = await supabase
      .rpc('check_planning_conflicts', {
        machine_name: 'Doosan Yashana',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      });
    
    if (conflictError) throw conflictError;
    console.log('✅ Функция check_planning_conflicts: OK');
    
  } catch (error) {
    console.error('❌ Ошибка проверки функций:', error.message);
  }
}

// Тест 8: Очистка тестовых данных
async function cleanupTestData(orderId) {
  console.log('\n🧹 Тест 8: Очистка тестовых данных...');
  
  if (!orderId) {
    console.warn('⚠️ Нечего очищать');
    return;
  }
  
  try {
    await orderService.deleteOrder(orderId);
    console.log('✅ Тестовые данные удалены');
  } catch (error) {
    console.error('❌ Ошибка очистки:', error.message);
  }
}

// Основная функция тестирования
async function runAllTests() {
  console.log('🧪 Запуск полного тестирования новой базы данных...\n');
  
  // Проверяем подключение
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('🚨 Тестирование прервано - нет подключения к базе данных');
    return;
  }
  
  // Проверяем таблицы
  await testTables();
  
  // Проверяем станки
  const machines = await testMachines();
  
  // Создаем тестовые данные
  const testOrder = await testCreateOrder();
  const testOperation = await testCreateOperation(testOrder?.id);
  
  // Проверяем представления и функции
  await testViews();
  await testFunctions();
  
  // Очищаем тестовые данные
  await cleanupTestData(testOrder?.id);
  
  console.log('\n🎉 Тестирование завершено!');
  console.log('📊 Результаты:');
  console.log('- Подключение:', isConnected ? '✅' : '❌');
  console.log('- Таблицы:', '✅ (проверьте логи выше)');
  console.log('- Станки:', machines.length === 7 ? '✅' : '⚠️');
  console.log('- CRUD операции:', testOrder ? '✅' : '❌');
  console.log('- Представления:', '✅ (проверьте логи выше)');
  console.log('- Функции:', '✅ (проверьте логи выше)');
}

// Экспортируем функции для ручного вызова
window.testSupabase = {
  runAllTests,
  testConnection,
  testTables,
  testMachines,
  testCreateOrder,
  testViews,
  testFunctions
};

// Автоматический запуск тестов
runAllTests();
