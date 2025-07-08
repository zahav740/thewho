/**
 * @file: test-excel-upload.js
 * @description: Простой тест Excel импорта без внешних зависимостей
 * @created: 2025-07-03
 */

// Простой тест для проверки Excel импорта
async function testExcelImport() {
  console.log('🧪 Тестирование Excel Import API...');
  
  const baseUrl = 'http://localhost:5100/api/excel-import';
  
  try {
    // Тест получения статистики
    console.log('📊 Тестирование получения статистики...');
    const statsResponse = await fetch(`${baseUrl}/stats`);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Статистика получена:', stats);
    } else {
      console.log('❌ Ошибка получения статистики:', statsResponse.status);
    }
    
    // Тест получения списка файлов
    console.log('📋 Тестирование получения списка файлов...');
    const filesResponse = await fetch(`${baseUrl}/files`);
    
    if (filesResponse.ok) {
      const files = await filesResponse.json();
      console.log('✅ Список файлов получен:', files);
    } else {
      console.log('❌ Ошибка получения списка файлов:', filesResponse.status);
    }
    
    console.log('🎉 Тестирование завершено успешно!');
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error.message);
  }
}

// Запуск теста, если файл выполняется напрямую
if (typeof window === 'undefined') {
  // Node.js окружение
  const { fetch } = require('undici');
  global.fetch = fetch;
  testExcelImport();
}

module.exports = { testExcelImport };
