/**
 * @file: test-excel-endpoints.js
 * @description: Скрипт для проверки работоспособности Excel Import API endpoints
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5100/api';

async function testExcelEndpoints() {
  console.log('🔍 Тестирование Excel Import API endpoints...');
  console.log(`Base URL: ${BASE_URL}`);

  const tests = [
    {
      name: 'Получение списка импортов',
      method: 'GET',
      url: `${BASE_URL}/excel-import-db/imports?page=1&limit=20`,
    },
    {
      name: 'Получение фильтров для orders',
      method: 'GET',
      url: `${BASE_URL}/excel-import-db/filters?targetTable=orders`,
    },
    {
      name: 'Получение всех фильтров',
      method: 'GET',
      url: `${BASE_URL}/excel-import-db/filters`,
    },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n📋 Тестируем: ${test.name}`);
      console.log(`   ${test.method} ${test.url}`);

      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000,
        validateStatus: (status) => status < 500, // Считаем успехом все кроме 5xx
      });

      if (response.status === 200) {
        console.log(`   ✅ Успешно (${response.status})`);
        if (response.data) {
          if (Array.isArray(response.data)) {
            console.log(`   📊 Данные: массив из ${response.data.length} элементов`);
          } else if (typeof response.data === 'object') {
            console.log(`   📊 Данные: объект с ключами: ${Object.keys(response.data).join(', ')}`);
          }
        }
        passedTests++;
      } else if (response.status === 404) {
        console.log(`   ❌ Endpoint не найден (404) - контроллер не подключен`);
      } else {
        console.log(`   ⚠️  Статус: ${response.status} - ${response.statusText}`);
        passedTests++;
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Соединение отклонено - backend не запущен`);
      } else if (error.response) {
        console.log(`   ❌ Ошибка HTTP: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ❌ Ошибка: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Результаты тестирования:`);
  console.log(`   Пройдено: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log(`   🎉 Все тесты пройдены успешно!`);
  } else if (passedTests === 0) {
    console.log(`   🚨 Ни один тест не прошел - проверьте запуск backend`);
  } else {
    console.log(`   ⚠️  Некоторые тесты не прошли - проверьте конфигурацию`);
  }

  return passedTests === totalTests;
}

// Дополнительный тест - проверка здоровья API
async function testHealthCheck() {
  try {
    console.log('\n🏥 Проверка здоровья API...');
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
    
    if (response.status === 200) {
      console.log('   ✅ API здоров');
      console.log(`   📊 Версия: ${response.data.version || 'неизвестна'}`);
      console.log(`   📊 Время работы: ${response.data.uptime || 'неизвестно'}`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ API недоступен');
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Запуск тестирования Excel Import API...\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n⚠️  Backend может быть не запущен. Проверьте:');
    console.log('   1. Запущен ли backend: npm run start:dev');
    console.log('   2. Порт 5100 свободен');
    console.log('   3. База данных доступна');
    return;
  }

  const allTestsPassed = await testExcelEndpoints();
  
  if (!allTestsPassed) {
    console.log('\n🔧 Рекомендации по устранению проблем:');
    console.log('   1. Убедитесь, что ExcelImportDbController подключен в orders.module.ts');
    console.log('   2. Проверьте, что сервис ExcelImportDbService работает');
    console.log('   3. Проверьте подключение к базе данных');
    console.log('   4. Перезапустите backend после изменений');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testExcelEndpoints, testHealthCheck };
