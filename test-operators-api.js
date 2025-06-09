/**
 * Тестовый файл для проверки API операторов
 */

// Тест 1: Простая проверка подключения
fetch('http://localhost:5100/api/health')
  .then(response => response.json())
  .then(data => console.log('✅ Backend доступен:', data))
  .catch(error => console.error('❌ Backend недоступен:', error));

// Тест 2: Проверка API операторов (GET)
fetch('http://localhost:5100/api/operators')
  .then(response => {
    console.log('📡 Статус ответа операторов:', response.status);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  })
  .then(data => console.log('✅ API операторов работает:', data))
  .catch(error => console.error('❌ Ошибка API операторов:', error));

// Тест 3: Проверка создания оператора (POST)
fetch('http://localhost:5100/api/operators', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'TestOperator',
    operatorType: 'BOTH'
  })
})
  .then(response => {
    console.log('📡 Статус создания оператора:', response.status);
    if (response.ok) {
      return response.json();
    } else {
      return response.text().then(text => {
        throw new Error(`HTTP ${response.status}: ${text}`);
      });
    }
  })
  .then(data => console.log('✅ Тест создания оператора успешен:', data))
  .catch(error => console.error('❌ Ошибка создания оператора:', error));
