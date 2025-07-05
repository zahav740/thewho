const axios = require('axios');

async function emergencyCheck() {
  console.log('🚨 ЭКСТРЕННАЯ ПРОВЕРКА BACKEND');
  console.log('================================');
  
  console.log('🔍 Проверяем доступность backend...');
  
  try {
    // Проверка health
    const healthResponse = await axios.get('http://localhost:5100/api/health', { timeout: 5000 });
    console.log('✅ Health API работает:', healthResponse.status);
    
    // Проверка Excel API
    const filtersResponse = await axios.get('http://localhost:5100/api/excel-import-db/filters', { timeout: 5000 });
    console.log('✅ Excel Filters API работает:', filtersResponse.status);
    
    const importsResponse = await axios.get('http://localhost:5100/api/excel-import-db/imports', { timeout: 5000 });
    console.log('✅ Excel Imports API работает:', importsResponse.status);
    
    console.log('\n🎉 ВСЕ API РАБОТАЮТ!');
    console.log('🔄 Обновите страницу в браузере (F5)');
    console.log('📊 Теперь Excel импорт должен работать');
    
    if (filtersResponse.data && Array.isArray(filtersResponse.data)) {
      console.log(`📋 Доступно фильтров: ${filtersResponse.data.length}`);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend НЕ ЗАПУЩЕН на порту 5100');
      console.log('🚀 РЕШЕНИЕ:');
      console.log('   1. Запустите: EMERGENCY-START-BACKEND.bat');
      console.log('   2. Или вручную: cd backend && npm run start:dev');
      console.log('   3. Дождитесь сообщения о запуске');
      console.log('   4. Обновите страницу в браузере');
    } else {
      console.log('❌ Ошибка:', error.message);
    }
  }
}

if (require.main === module) {
  emergencyCheck().catch(console.error);
}
