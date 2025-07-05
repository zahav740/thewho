const axios = require('axios');

async function reImportWithNewFilter() {
  console.log('🔄 ПОВТОРНЫЙ ИМПОРТ С НОВЫМ ФИЛЬТРОМ НА ИВРИТЕ');
  console.log('============================================');
  
  try {
    // Получаем список фильтров
    console.log('📋 Получаем список фильтров...');
    const filtersResponse = await axios.get('http://localhost:5100/api/excel-import-db/filters');
    const filters = filtersResponse.data;
    
    console.log(`✅ Найдено фильтров: ${filters.length}`);
    filters.forEach(filter => {
      console.log(`   - ${filter.name} (ID: ${filter.id}, Таблица: ${filter.target_table})`);
    });
    
    // Ищем фильтр для иврита
    const hebrewFilter = filters.find(f => f.name.includes('иврите') || f.name.includes('Hebrew'));
    if (!hebrewFilter) {
      console.log('❌ Фильтр для иврита не найден');
      return;
    }
    
    console.log(`📋 Используем фильтр: ${hebrewFilter.name} (ID: ${hebrewFilter.id})`);
    
    // Получаем список импортов
    console.log('📋 Получаем список импортов...');
    const importsResponse = await axios.get('http://localhost:5100/api/excel-import-db/imports');
    const imports = importsResponse.data.imports || [];
    
    if (imports.length === 0) {
      console.log('❌ Нет импортов для повторной обработки');
      return;
    }
    
    // Берем последний импорт
    const lastImport = imports[0];
    console.log(`📁 Повторно обрабатываем: ${lastImport.original_filename} (ID: ${lastImport.id})`);
    
    // Выполняем повторный импорт
    console.log('🚀 Запускаем повторный импорт...');
    const reImportResponse = await axios.post(`http://localhost:5100/api/excel-import-db/imports/${lastImport.id}/re-import`, {
      targetTable: 'orders',
      filterId: hebrewFilter.id
    });
    
    const result = reImportResponse.data;
    console.log('✅ ПОВТОРНЫЙ ИМПОРТ ЗАВЕРШЕН!');
    console.log(`📊 Результаты:`);
    console.log(`   - Создано: ${result.created}`);
    console.log(`   - Обновлено: ${result.updated}`);
    console.log(`   - Пропущено: ${result.skipped}`);
    console.log(`   - Ошибки: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('⚠️ Ошибки:');
      result.errors.forEach(error => {
        console.log(`   Строка ${error.row}: ${error.error}`);
      });
    }
    
    // Проверяем количество заказов в БД
    console.log('🔍 Проверяем количество заказов в БД...');
    // Здесь можно добавить проверку через API если есть endpoint
    
  } catch (error) {
    console.log('❌ Ошибка повторного импорта:', error.message);
    if (error.response) {
      console.log('📋 Детали ошибки:', error.response.data);
    }
  }
}

if (require.main === module) {
  reImportWithNewFilter().catch(console.error);
}
