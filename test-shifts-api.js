/**
 * Тестовый скрипт для проверки API shifts
 */

const testApiPort5100 = async () => {
  try {
    console.log('=== Тестирование API на порту 5100 ===');
    
    const response = await fetch('http://localhost:5100/api/shifts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('GET /api/shifts:', response.status);
    const data = await response.json();
    console.log('Данные:', data);
    
    return true;
  } catch (error) {
    console.error('Ошибка при обращении к порту 5100:', error.message);
    return false;
  }
};

const testApiPort5101 = async () => {
  try {
    console.log('\n=== Тестирование API на порту 5101 ===');
    
    const response = await fetch('http://localhost:5101/api/shifts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('GET /api/shifts:', response.status);
    const data = await response.json();
    console.log('Данные:', data);
    
    return true;
  } catch (error) {
    console.error('Ошибка при обращении к порту 5101:', error.message);
    return false;
  }
};

const testPostShift = async (port) => {
  try {
    console.log(`\n=== Тестирование POST на порту ${port} ===`);
    
    const testData = {
      date: '2025-06-07',
      shiftType: 'DAY',
      machineId: 5,
      operationId: 23,
      drawingNumber: 'C6HP0021A',
      dayShiftQuantity: 10,
      dayShiftOperator: 'Test Operator'
    };
    
    const response = await fetch(`http://localhost:${port}/api/shifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`POST /api/shifts:`, response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Созданная запись:', data);
    } else {
      const errorData = await response.text();
      console.log('Ошибка:', errorData);
    }
    
    return response.ok;
  } catch (error) {
    console.error(`Ошибка при POST запросе к порту ${port}:`, error.message);
    return false;
  }
};

const runTests = async () => {
  console.log('🚀 Начинаем тестирование API shifts...\n');
  
  const port5100Works = await testApiPort5100();
  const port5101Works = await testApiPort5101();
  
  if (port5100Works) {
    await testPostShift(5100);
  }
  
  if (port5101Works) {
    await testPostShift(5101);
  }
  
  console.log('\n=== Результат тестирования ===');
  console.log(`Порт 5100: ${port5100Works ? '✅ Работает' : '❌ Не работает'}`);
  console.log(`Порт 5101: ${port5101Works ? '✅ Работает' : '❌ Не работает'}`);
};

// Для Node.js
if (typeof require !== 'undefined') {
  // Если запускается в Node.js, нужно установить node-fetch
  // npm install node-fetch@2
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
    runTests();
  } catch (e) {
    console.log('Для запуска в Node.js установите: npm install node-fetch@2');
  }
} else {
  // Запуск в браузере
  runTests();
}
