// Инструмент для очистки локальных данных и тестирования новой базы
// Выполните в консоли браузера

console.log('🧹 Инструмент очистки данных для TheWho');

// Функция очистки всех локальных данных
function clearAllLocalData() {
  console.log('🗑️ Очищаем все локальные данные...');
  
  // Очищаем localStorage
  const localStorageKeys = Object.keys(localStorage);
  console.log(`📦 LocalStorage ключей найдено: ${localStorageKeys.length}`);
  localStorageKeys.forEach(key => {
    console.log(`  - Удаляем: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Очищаем sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage);
  console.log(`📦 SessionStorage ключей найдено: ${sessionStorageKeys.length}`);
  sessionStorageKeys.forEach(key => {
    console.log(`  - Удаляем: ${key}`);
    sessionStorage.removeItem(key);
  });
  
  // Очищаем IndexedDB
  if ('indexedDB' in window) {
    console.log('🗄️ Очищаем IndexedDB...');
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) {
          console.log(`  - Удаляем базу: ${db.name}`);
          indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }
  
  console.log('✅ Локальные данные очищены!');
}

// Функция для тестирования нового подключения
async function testNewConnection() {
  console.log('🧪 Тестируем новое подключение к Supabase...');
  
  try {
    const response = await fetch('https://kukqacmzfmzepdfddppl.supabase.co/rest/v1/machines', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Подключение успешно!');
      console.log(`📊 Станков в базе: ${data.length}/7`);
      data.forEach(machine => {
        console.log(`  🏭 ${machine.name} (${machine.type})`);
      });
    } else {
      console.error('❌ Ошибка подключения:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Функция для создания тестового заказа
async function createTestOrder() {
  console.log('📝 Создаем тестовый заказ...');
  
  const testOrder = {
    id: crypto.randomUUID(),
    name: 'Тестовый заказ после миграции',
    client_name: 'Тестовый клиент',
    drawing_number: `TEST-MIGR-${Date.now()}`,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    quantity: 5,
    priority: 1
  };
  
  try {
    const response = await fetch('https://kukqacmzfmzepdfddppl.supabase.co/rest/v1/orders', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testOrder)
    });
    
    if (response.ok) {
      const created = await response.json();
      console.log('✅ Тестовый заказ создан!');
      console.log('📋 Данные:', created[0]);
      return created[0];
    } else {
      const errorText = await response.text();
      console.error('❌ Ошибка создания заказа:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return null;
  }
}

// Функция полной диагностики
async function runFullDiagnostics() {
  console.log('🔬 Запуск полной диагностики...');
  
  // 1. Тест подключения
  await testNewConnection();
  
  // 2. Проверка таблиц
  const tables = ['orders', 'operations', 'planning_results', 'shifts', 'setups', 'machines', 'alerts'];
  console.log('\\n📊 Проверка таблиц...');
  
  for (const table of tables) {
    try {
      const response = await fetch(`https://kukqacmzfmzepdfddppl.supabase.co/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w'
        }
      });
      
      console.log(`${response.ok ? '✅' : '❌'} Таблица ${table}: ${response.ok ? 'OK' : response.statusText}`);
    } catch (error) {
      console.error(`❌ Таблица ${table}: ${error.message}`);
    }
  }
  
  // 3. Создание тестового заказа
  console.log('\\n📝 Тест создания заказа...');
  const testOrder = await createTestOrder();
  
  console.log('\\n🎉 Диагностика завершена!');
  
  if (testOrder) {
    console.log('\\n🧹 Для очистки тестового заказа выполните:');
    console.log(`deleteTestOrder("${testOrder.id}")`);
  }
}

// Функция удаления тестового заказа
async function deleteTestOrder(orderId) {
  try {
    const response = await fetch(`https://kukqacmzfmzepdfddppl.supabase.co/rest/v1/orders?id=eq.${orderId}`, {
      method: 'DELETE',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w'
      }
    });
    
    if (response.ok) {
      console.log('✅ Тестовый заказ удален');
    } else {
      console.error('❌ Ошибка удаления:', response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Экспортируем функции в глобальную область
window.clearAllLocalData = clearAllLocalData;
window.testNewConnection = testNewConnection;
window.createTestOrder = createTestOrder;
window.runFullDiagnostics = runFullDiagnostics;
window.deleteTestOrder = deleteTestOrder;

console.log('🛠️ Доступные команды:');
console.log('  clearAllLocalData() - Очистить все локальные данные');
console.log('  testNewConnection() - Тест подключения к базе');
console.log('  createTestOrder() - Создать тестовый заказ');
console.log('  runFullDiagnostics() - Полная диагностика');
console.log('  deleteTestOrder(id) - Удалить тестовый заказ');
