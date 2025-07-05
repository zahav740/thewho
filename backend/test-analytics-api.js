/**
 * @file: test-analytics-api.js
 * @description: Простой скрипт для проверки Analytics API
 * @created: 2025-06-30
 */
const axios = require('axios');

const API_BASE = 'http://localhost:5100/api';

async function testAnalyticsAPI() {
  console.log('🧪 Тестирование Analytics API...');
  
  const endpoints = [
    '/analytics/kpi-oee',
    '/analytics/operators', 
    '/analytics/machines',
    '/analytics/summary'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Тестируем: ${API_BASE}${endpoint}`);
      
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        params: {
          startDate: '2025-06-23',
          endDate: '2025-06-30'
        },
        timeout: 5000
      });
      
      console.log(`✅ ${endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint}: Соединение отклонено - backend не запущен?`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
}

// Проверяем общее состояние API
async function checkAPIHealth() {
  try {
    console.log('\n🏥 Проверяем health endpoint...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log(`✅ Health: ${response.status} - ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.log(`❌ Health: ${error.message}`);
  }
}

async function main() {
  await checkAPIHealth();
  await testAnalyticsAPI();
  
  console.log('\n📋 Заключение:');
  console.log('Если все endpoints возвращают 404 - модуль Analytics не загружен');
  console.log('Если все endpoints возвращают 400 - модуль работает, но данных нет');
  console.log('Если connection refused - backend не запущен');
}

main().catch(console.error);
