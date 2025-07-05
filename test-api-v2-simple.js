// Тестовый скрипт для проверки API V2
// Выполните в консоли браузера на http://localhost:5101

console.log('🧪 ТЕСТИРОВАНИЕ API V2 - ПРОСТОЕ СОЗДАНИЕ ЗАКАЗА');

const testOrder = {
  drawingNumber: 'TEST-001',
  quantity: 10,
  deadline: '2025-08-15',
  priority: 'MEDIUM',
  workType: 'Фрезерная обработка',
  operations: [{
    operationNumber: 1,
    operationType: 'MACHINING',
    machineAxes: 3,
    estimatedTime: 60
  }]
};

console.log('📝 Тестовые данные:', testOrder);

// Отправляем запрос
fetch('/api/v2/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testOrder)
})
.then(response => {
  console.log('📊 Статус ответа:', response.status);
  return response.json();
})
.then(data => {
  if (data.statusCode === 400) {
    console.error('❌ Ошибка 400:', data);
    console.error('🐛 Детали валидации:', data.message);
  } else {
    console.log('✅ Заказ создан:', data);
  }
})
.catch(error => {
  console.error('❌ Ошибка запроса:', error);
});
