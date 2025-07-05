const fetch = require('node-fetch');

async function quickTest() {
  console.log('🔍 Быстрое тестирование Excel API...');
  
  // Ждем 3 секунды для запуска backend
  console.log('⏳ Ожидание запуска backend...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    console.log('\n1. Проверка health...');
    const healthResponse = await fetch('http://localhost:5100/api/health', { timeout: 5000 });
    console.log('Health status:', healthResponse.status);
    
    console.log('\n2. Проверка filters...');
    const filtersResponse = await fetch('http://localhost:5100/api/excel-import-db/filters', { timeout: 5000 });
    console.log('Filters status:', filtersResponse.status);
    
    if (filtersResponse.ok) {
      const filters = await filtersResponse.json();
      console.log('✅ Найдено фильтров:', Array.isArray(filters) ? filters.length : 'unknown');
    }
    
    console.log('\n3. Проверка imports...');
    const importsResponse = await fetch('http://localhost:5100/api/excel-import-db/imports', { timeout: 5000 });
    console.log('Imports status:', importsResponse.status);
    
    if (importsResponse.ok) {
      const imports = await importsResponse.json();
      console.log('✅ Найдено импортов:', imports.total || 0);
    }
    
    if (filtersResponse.ok && importsResponse.ok) {
      console.log('\n🎉 ВСЕ API РАБОТАЮТ!');
      console.log('Можете загружать Excel файлы в интерфейсе.');
    } else {
      console.log('\n❌ Некоторые API не работают');
    }
    
  } catch (error) {
    console.log('❌ Ошибка подключения:', error.message);
    console.log('💡 Убедитесь, что backend запущен на порту 5100');
  }
}

// Запуск если вызвано напрямую
if (require.main === module) {
  quickTest().catch(console.error);
}
