const fetch = require('node-fetch');

async function testBackendHealth() {
  try {
    console.log('🔍 Проверяем здоровье backend...');
    
    const response = await fetch('http://localhost:5100/api/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend доступен!');
      console.log('📊 Статус:', data);
      return true;
    } else {
      console.log('❌ Backend отвечает с ошибкой:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend недоступен:', error.message);
    console.log('💡 Запустите backend: cd backend && npm run start:dev');
    return false;
  }
}

async function testExcelAPI() {
  try {
    console.log('\n🔍 Проверяем Excel Import API...');
    
    // Тест 1: Получение фильтров
    const filtersResponse = await fetch('http://localhost:5100/api/excel-import-db/filters', {
      method: 'GET',
      timeout: 5000
    });
    
    if (filtersResponse.ok) {
      const filters = await filtersResponse.json();
      console.log('✅ API фильтров работает!');
      console.log('📊 Найдено фильтров:', Array.isArray(filters) ? filters.length : 'unknown');
      
      if (Array.isArray(filters) && filters.length > 0) {
        console.log('📋 Доступные фильтры:');
        filters.forEach(filter => {
          console.log(`   - ${filter.name} (${filter.target_table})`);
        });
      }
    } else {
      console.log('❌ API фильтров недоступен:', filtersResponse.status);
      return false;
    }
    
    // Тест 2: Получение списка импортов
    const importsResponse = await fetch('http://localhost:5100/api/excel-import-db/imports?page=1&limit=5', {
      method: 'GET',
      timeout: 5000
    });
    
    if (importsResponse.ok) {
      const imports = await importsResponse.json();
      console.log('✅ API импортов работает!');
      console.log('📊 Найдено импортов:', imports.total || 0);
      
      if (imports.imports && imports.imports.length > 0) {
        console.log('📋 Последние импорты:');
        imports.imports.forEach(imp => {
          console.log(`   - ${imp.original_filename} (${imp.status})`);
        });
      }
    } else {
      console.log('❌ API импортов недоступен:', importsResponse.status);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Ошибка тестирования Excel API:', error.message);
    return false;
  }
}

async function checkDatabase() {
  console.log('\n🔍 Проверяем состояние базы данных...');
  
  // Мы не можем напрямую подключиться к БД из Node.js без дополнительных библиотек
  // Но можем проверить через API endpoints
  
  try {
    const healthResponse = await fetch('http://localhost:5100/api/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ База данных доступна через backend');
      
      // Проверяем, что в БД есть наши таблицы через API
      const filtersResponse = await fetch('http://localhost:5100/api/excel-import-db/filters');
      if (filtersResponse.ok) {
        console.log('✅ Таблица import_filters доступна');
      }
      
      const importsResponse = await fetch('http://localhost:5100/api/excel-import-db/imports');
      if (importsResponse.ok) {
        console.log('✅ Таблица excel_imports доступна');
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Ошибка подключения к БД через backend:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 ПРОВЕРКА EXCEL IMPORT СИСТЕМЫ\n');
  console.log('=====================================');
  
  const backendOk = await testBackendHealth();
  if (!backendOk) {
    console.log('\n❌ Backend недоступен. Проверьте:');
    console.log('1. Запущен ли backend: cd backend && npm run start:dev');
    console.log('2. Порт 5100 свободен');
    console.log('3. База данных подключена');
    return;
  }
  
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log('\n❌ Проблемы с базой данных');
    return;
  }
  
  const excelApiOk = await testExcelAPI();
  
  console.log('\n=====================================');
  if (excelApiOk) {
    console.log('🎉 ВСЕ СИСТЕМЫ РАБОТАЮТ!');
    console.log('\n📋 ГОТОВО К ИСПОЛЬЗОВАНИЮ:');
    console.log('1. Откройте http://localhost:5101');
    console.log('2. Перейдите в раздел "База данных"');
    console.log('3. Нажмите "🗄️ Excel БД Менеджер"');
    console.log('4. Загрузите Excel файл');
    console.log('5. Файл сохранится в БД и данные импортируются');
  } else {
    console.log('❌ Excel Import API не работает');
    console.log('\n🔧 РЕШЕНИЕ:');
    console.log('1. Убедитесь, что ExcelImportDbController включен в orders.module.ts');
    console.log('2. Перезапустите backend: cd backend && npm run start:dev');
    console.log('3. Проверьте логи backend на ошибки');
  }
}

// Запуск если вызвано напрямую
if (require.main === module) {
  main().catch(console.error);
}
