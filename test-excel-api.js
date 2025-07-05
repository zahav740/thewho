/**
 * Тест API Excel импорта
 */

// Создаем простой тестовый файл
const testExcelCreation = () => {
  console.log('🧪 Создаем тестовый Excel файл...');
  
  // Создаем простой тестовый Excel с данными
  const testData = [
    ['Номер чертежа', 'Количество', 'Дедлайн', 'Приоритет'],
    ['DWG-001', '10', '2025-01-15', 'HIGH'],
    ['DWG-002', '5', '2025-01-20', 'MEDIUM'],
    ['DWG-003', '15', '2025-01-25', 'LOW']
  ];
  
  // Симулируем создание Excel файла
  const csvContent = testData.map(row => row.join(',')).join('\n');
  console.log('📋 Тестовые данные:', csvContent);
  return csvContent;
};

// Тест API доступности
const testAPI = async () => {
  try {
    console.log('🔍 Тестируем доступность API...');
    
    // Проверяем основной endpoint
    const response = await fetch('http://localhost:5100/api/v2/orders', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('📡 Ответ API:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API работает! Получено заказов:', data.total || 0);
    } else {
      console.error('❌ API недоступен');
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к API:', error.message);
  }
};

// Тест парсинга Excel
const testExcelParsing = async () => {
  try {
    console.log('📤 Тестируем парсинг Excel...');
    
    // Создаем FormData с тестовым файлом
    const formData = new FormData();
    
    // Создаем простой тестовый blob как Excel файл
    const testContent = testExcelCreation();
    const blob = new Blob([testContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    formData.append('file', blob, 'test-orders.xlsx');
    
    const response = await fetch('http://localhost:5100/api/v2/orders/parse-excel', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Ответ парсинга:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Парсинг успешен:', result);
    } else {
      const error = await response.text();
      console.error('❌ Ошибка парсинга:', error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования парсинга:', error.message);
  }
};

// Запускаем тесты
console.log('🧪 Запуск диагностики Excel API...');
console.log('=====================================');

setTimeout(async () => {
  await testAPI();
  console.log('');
  await testExcelParsing();
}, 1000);
