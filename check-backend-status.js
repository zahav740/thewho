/**
 * @file: check-backend-status.js
 * @description: Быстрая проверка статуса backend
 * @created: 2025-06-21
 */

const http = require('http');

function checkBackend() {
  const options = {
    hostname: 'localhost',
    port: 5100,
    path: '/api/health',
    method: 'GET',
    timeout: 3000
  };

  console.log('🔍 Проверка backend на localhost:5100...\n');

  const req = http.request(options, (res) => {
    console.log(`✅ Backend доступен! Status: ${res.statusCode}`);
    console.log('🎯 Теперь можете тестировать PDF:\n');
    console.log('   - Прямая ссылка: http://localhost:5100/api/orders/pdf/1750497060623-385439311.pdf');
    console.log('   - Debug endpoint: http://localhost:5100/api/orders/debug/pdf/1750497060623-385439311.pdf');
    console.log('   - Frontend: http://localhost:3000\n');
  });

  req.on('error', (error) => {
    console.log('❌ Backend НЕ ДОСТУПЕН!');
    console.log(`   Ошибка: ${error.message}\n`);
    console.log('💡 РЕШЕНИЕ: Запустите backend:');
    console.log('   cd backend');
    console.log('   npm run start\n');
    console.log('   Или:');
    console.log('   npm run dev\n');
  });

  req.on('timeout', () => {
    console.log('❌ Таймаут подключения к backend');
    req.destroy();
  });

  req.end();
}

checkBackend();
