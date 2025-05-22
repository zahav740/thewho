// Скрипт для тестирования автоматической синхронизации с Supabase
// Выполните в консоли браузера для проверки функциональности

console.log('🧪 Начинаем тестирование синхронизации с Supabase...');

// Функция для создания тестового заказа
function createTestOrder() {
  const testOrder = {
    id: 'test-' + Date.now(),
    drawingNumber: 'TEST-' + Math.random().toString(36).substr(2, 9),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: Math.floor(Math.random() * 100) + 1,
    priority: Math.floor(Math.random() * 3) + 1,
    operations: [
      {
        id: 'op-test-' + Date.now(),
        sequenceNumber: 1,
        machine: 'MAZAK-T1',
        operationType: '3-axis',
        estimatedTime: Math.floor(Math.random() * 120) + 30,
        status: 'pending'
      }
    ]
  };
  
  return testOrder;
}

// Функция для проверки состояния синхронизации
function checkSyncStatus() {
  const syncEnabled = localStorage.getItem('supabaseAutoSync');
  const lastSync = localStorage.getItem('lastSupabaseSync');
  const syncError = localStorage.getItem('supabaseSyncError');
  
  console.log('📊 Статус синхронизации:');
  console.log('  Автосинхронизация:', syncEnabled);
  console.log('  Последняя синхронизация:', lastSync ? new Date(parseInt(lastSync)) : 'Никогда');
  console.log('  Ошибки:', syncError || 'Нет');
}

// Функция для тестирования добавления заказа
async function testAddOrder() {
  console.log('➕ Тестируем добавление заказа...');
  
  const testOrder = createTestOrder();
  console.log('Создан тестовый заказ:', testOrder);
  
  // Имитируем добавление через context (если доступен)
  if (window.appContext && window.appContext.addOrder) {
    const success = window.appContext.addOrder(testOrder);
    console.log('Результат добавления:', success ? '✅ Успешно' : '❌ Ошибка');
    
    // Ждем синхронизации
    setTimeout(() => {
      console.log('⏱️ Проверяем синхронизацию через 3 секунды...');
      checkSyncStatus();
    }, 3000);
  } else {
    console.warn('⚠️ AppContext недоступен. Добавьте заказ через интерфейс.');
  }
  
  return testOrder;
}

// Функция для проверки Supabase подключения
async function testSupabaseConnection() {
  console.log('🔌 Проверяем подключение к Supabase...');
  
  try {
    const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || 
                       window.ENV?.VITE_SUPABASE_URL ||
                       'https://kukqacmzfmzepdfddppl.supabase.co';
    
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'HEAD'
    });
    
    if (response.ok) {
      console.log('✅ Supabase доступен');
    } else {
      console.log('❌ Supabase недоступен:', response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка подключения к Supabase:', error);
  }
}

// Функция для проверки localStorage
function testLocalStorage() {
  console.log('💾 Проверяем localStorage...');
  
  const orders = localStorage.getItem('orders');
  const parsedOrders = orders ? JSON.parse(orders) : [];
  
  console.log('Заказов в localStorage:', parsedOrders.length);
  
  if (parsedOrders.length > 0) {
    console.log('Первый заказ:', parsedOrders[0]);
  }
  
  // Проверяем настройки синхронизации
  const settings = {
    autoSync: localStorage.getItem('supabaseAutoSync'),
    accessToken: localStorage.getItem('supabaseAccessToken'),
    lastSync: localStorage.getItem('lastSupabaseSync')
  };
  
  console.log('Настройки синхронизации:', settings);
}

// Функция для принудительной синхронизации
async function forceSyncTest() {
  console.log('🔄 Тестируем принудительную синхронизацию...');
  
  if (window.appContext && window.appContext.forceSyncAll) {
    try {
      await window.appContext.forceSyncAll();
      console.log('✅ Принудительная синхронизация завершена');
    } catch (error) {
      console.error('❌ Ошибка принудительной синхронизации:', error);
    }
  } else {
    console.warn('⚠️ Функция принудительной синхронизации недоступна');
  }
}

// Основная функция тестирования
async function runAllTests() {
  console.log('🚀 Запускаем полное тестирование...');
  
  // 1. Проверяем localStorage
  testLocalStorage();
  
  // 2. Проверяем подключение к Supabase
  await testSupabaseConnection();
  
  // 3. Проверяем статус синхронизации
  checkSyncStatus();
  
  // 4. Тестируем добавление заказа
  await testAddOrder();
  
  // 5. Тестируем принудительную синхронизацию
  await forceSyncTest();
  
  console.log('✅ Тестирование завершено');
}

// Функция для очистки тестовых данных
function cleanupTestData() {
  console.log('🧹 Очищаем тестовые данные...');
  
  const orders = localStorage.getItem('orders');
  if (orders) {
    const parsedOrders = JSON.parse(orders);
    const filteredOrders = parsedOrders.filter(order => 
      !order.drawingNumber.startsWith('TEST-') && 
      !order.id.startsWith('test-')
    );
    
    localStorage.setItem('orders', JSON.stringify(filteredOrders));
    console.log('✅ Тестовые заказы удалены');
  }
}

// Функция для настройки синхронизации
function setupSyncSettings(enabled = true, accessToken = '') {
  console.log('⚙️ Настраиваем синхронизацию...');
  
  localStorage.setItem('supabaseAutoSync', JSON.stringify(enabled));
  
  if (accessToken) {
    localStorage.setItem('supabaseAccessToken', accessToken);
  }
  
  console.log('✅ Настройки синхронизации обновлены');
  console.log('Автосинхронизация:', enabled);
  console.log('Токен установлен:', !!accessToken);
}

// Экспортируем функции в глобальную область
window.syncTester = {
  runAllTests,
  testAddOrder,
  testSupabaseConnection,
  testLocalStorage,
  forceSyncTest,
  checkSyncStatus,
  cleanupTestData,
  setupSyncSettings,
  createTestOrder
};

console.log('🎯 Функции тестирования доступны через window.syncTester');
console.log('Для запуска всех тестов выполните: syncTester.runAllTests()');
console.log('Для очистки тестовых данных: syncTester.cleanupTestData()');
console.log('Для настройки синхронизации: syncTester.setupSyncSettings(true, "your_token")');

// Автоматически запускаем базовые проверки
checkSyncStatus();
testLocalStorage();
