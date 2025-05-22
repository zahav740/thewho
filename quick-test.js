// Быстрый тест подключения к новой базе данных
// Выполните в консоли браузера

console.log('🧪 Быстрый тест подключения к Supabase...');

// Тестируем подключение
async function quickTest() {
  try {
    // Тест 1: Подключение к API
    const response = await fetch('https://kukqacmzfmzepdfddppl.supabase.co/rest/v1/machines', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w'
      }
    });
    
    if (response.ok) {
      const machines = await response.json();
      console.log('✅ Подключение успешно!');
      console.log(`✅ Станков в базе: ${machines.length}/7`);
      console.log('📋 Станки:', machines.map(m => m.name));
      
      if (machines.length === 7) {
        console.log('🎉 База данных настроена корректно!');
      } else {
        console.log('⚠️ Не все станки загружены. Проверьте выполнение SQL скрипта.');
      }
    } else {
      console.error('❌ Ошибка подключения:', response.status, response.statusText);
    }
    
    // Тест 2: Проверка других таблиц
    const tables = ['orders', 'operations', 'planning_results'];
    for (const table of tables) {
      try {
        const resp = await fetch(`https://kukqacmzfmzepdfddppl.supabase.co/rest/v1/${table}?limit=1`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w'
          }
        });
        
        console.log(`${resp.ok ? '✅' : '❌'} Таблица ${table}: ${resp.ok ? 'OK' : resp.statusText}`);
      } catch (error) {
        console.error(`❌ Ошибка проверки таблицы ${table}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

quickTest();
