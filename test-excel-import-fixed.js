/**
 * @file: test-excel-import-fixed.js
 * @description: Тест исправленного API импорта Excel для заказов V2
 * @created: 2025-07-05
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5100/api';
const EXCEL_FILE_PATH = path.join(__dirname, '2025 june.xlsx');

async function testExcelImport() {
  console.log('🧪 ТЕСТ: Импорт Excel файла в заказы V2');
  console.log('=' .repeat(60));
  
  // Проверяем существование файла
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error('❌ Файл Excel не найден:', EXCEL_FILE_PATH);
    return;
  }
  
  const fileStats = fs.statSync(EXCEL_FILE_PATH);
  console.log('📁 Файл найден:', {
    path: EXCEL_FILE_PATH,
    size: `${(fileStats.size / 1024 / 1024).toFixed(2)} MB`,
    modified: fileStats.mtime
  });
  
  try {
    // Шаг 1: Тестируем парсинг Excel файла
    console.log('\n🔄 Шаг 1: Парсинг Excel файла...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(EXCEL_FILE_PATH));
    
    console.log('📤 Отправляем запрос на:', `${API_BASE}/v2/orders/parse-excel`);
    
    const parseResponse = await fetch(`${API_BASE}/v2/orders/parse-excel`, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('📥 Статус ответа парсинга:', parseResponse.status, parseResponse.statusText);
    
    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('❌ Ошибка парсинга:', errorText);
      return;
    }
    
    const parseResult = await parseResponse.json();
    console.log('✅ Результат парсинга:', {
      success: parseResult.success,
      totalRows: parseResult.totalRows,
      parsedRows: parseResult.parsedRows,
      errorsCount: parseResult.errors?.length || 0,
      columnMappings: parseResult.columnMappings,
      dataCount: parseResult.data?.length || 0
    });
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.log('⚠️ Ошибки парсинга:', parseResult.errors.slice(0, 3));
    }
    
    if (parseResult.data && parseResult.data.length > 0) {
      console.log('📋 Примеры спарсенных данных:');
      parseResult.data.slice(0, 2).forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.drawingNumber}: ${order.quantity} шт, дедлайн: ${order.deadline}`);
        console.log(`     Приоритет: ${order.priority}, Тип работы: ${order.workType}`);
      });
    }
    
    // Шаг 2: Тестируем массовое создание заказов
    if (parseResult.success && parseResult.data && parseResult.data.length > 0) {
      console.log('\n🔄 Шаг 2: Создание заказов в базе данных...');
      
      // Берем первые 3 заказа для теста
      const ordersToCreate = parseResult.data.slice(0, 3);
      
      const createResponse = await fetch(`${API_BASE}/v2/orders/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders: ordersToCreate
        }),
      });
      
      console.log('📥 Статус ответа создания:', createResponse.status, createResponse.statusText);
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Ошибка создания заказов:', errorText);
        return;
      }
      
      const createResult = await createResponse.json();
      console.log('✅ Результат создания заказов:', {
        created: createResult.created,
        errors: createResult.errors,
        total: ordersToCreate.length
      });
      
      if (createResult.created > 0) {
        console.log('🎉 Успешно! Заказы были созданы в базе данных.');
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Запускаем тест
if (require.main === module) {
  testExcelImport()
    .then(() => {
      console.log('\n✅ Тест завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Тест провален:', error);
      process.exit(1);
    });
}

module.exports = { testExcelImport };
