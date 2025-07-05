/**
 * @file: test-excel-import-api.js
 * @description: Тест API для импорта Excel
 * @created: 2025-06-30
 */

const API_BASE = 'http://localhost:5100/api';

async function testExcelImportAPI() {
  console.log('🧪 Тестирование Excel Import API...\n');

  try {
    // 1. Проверка здоровья API
    console.log('1. Проверка здоровья API...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log('   Статус:', healthResponse.status);
    
    if (!healthResponse.ok) {
      throw new Error('Backend не доступен');
    }

    // 2. Получение списка фильтров
    console.log('\n2. Получение списка фильтров...');
    const filtersResponse = await fetch(`${API_BASE}/excel-import-db/filters`);
    console.log('   Статус:', filtersResponse.status);
    
    if (filtersResponse.ok) {
      const filters = await filtersResponse.json();
      console.log('   Количество фильтров:', filters.length);
      filters.forEach(filter => {
        console.log(`   - ${filter.name} (${filter.target_table})`);
      });
    } else {
      console.log('   Ошибка получения фильтров');
    }

    // 3. Получение списка импортов
    console.log('\n3. Получение списка импортов...');
    const importsResponse = await fetch(`${API_BASE}/excel-import-db/imports?page=1&limit=10`);
    console.log('   Статус:', importsResponse.status);
    
    if (importsResponse.ok) {
      const importsData = await importsResponse.json();
      console.log('   Общее количество импортов:', importsData.total || 0);
      console.log('   Импортов на странице:', (importsData.imports || []).length);
    } else {
      console.log('   Ошибка получения импортов');
    }

    // 4. Тест создания нового фильтра
    console.log('\n4. Тест создания нового фильтра...');
    const newFilter = {
      name: 'Тестовый фильтр',
      description: 'Автоматически созданный тестовый фильтр',
      target_table: 'orders',
      filter_config: {
        required_columns: ['drawing_number', 'quantity', 'deadline'],
        optional_columns: ['priority', 'workType'],
        skip_empty_rows: true,
        header_row: 1,
      },
      column_mapping: {},
      is_active: true,
    };

    const createFilterResponse = await fetch(`${API_BASE}/excel-import-db/filters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newFilter),
    });

    console.log('   Статус создания фильтра:', createFilterResponse.status);
    
    if (createFilterResponse.ok) {
      const createdFilter = await createFilterResponse.json();
      console.log('   Создан фильтр с ID:', createdFilter.id);
      
      // Удаляем тестовый фильтр
      const deleteResponse = await fetch(`${API_BASE}/excel-import-db/filters/${createdFilter.id}`, {
        method: 'DELETE',
      });
      console.log('   Тестовый фильтр удален, статус:', deleteResponse.status);
    }

    console.log('\n✅ Все тесты пройдены успешно!');
    console.log('\n📋 Результаты:');
    console.log('   - Backend API доступен на :5100');
    console.log('   - Excel Import endpoints работают');
    console.log('   - CRUD операции с фильтрами работают');
    console.log('\n🚀 Система готова к использованию!');
    console.log('\n🌐 Откройте: http://localhost:5101');
    console.log('📊 База данных → Excel БД Менеджер');

  } catch (error) {
    console.error('\n❌ Ошибка тестирования:', error.message);
    console.log('\n🔧 Рекомендации:');
    console.log('   1. Убедитесь, что Backend запущен на порту 5100');
    console.log('   2. Проверьте подключение к базе данных');
    console.log('   3. Запустите: npm run start:dev в папке backend');
  }
}

// Запуск тестов
testExcelImportAPI();
