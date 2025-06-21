/**
 * @file: test-pdf-endpoint.js
 * @description: Скрипт для тестирования PDF endpoint
 * @created: 2025-06-21
 */

const http = require('http');
const path = require('path');

const BACKEND_URL = 'localhost';
const BACKEND_PORT = 5100;
const PDF_FILENAME = '1750497060623-385439311.pdf';

// Функция для тестирования PDF endpoint
function testPdfEndpoint() {
  console.log('🧪 Тестирование PDF endpoint...');
  console.log(`📡 Отправка запроса: http://${BACKEND_URL}:${BACKEND_PORT}/api/orders/pdf/${PDF_FILENAME}`);
  
  const options = {
    hostname: BACKEND_URL,
    port: BACKEND_PORT,
    path: `/api/orders/pdf/${PDF_FILENAME}`,
    method: 'GET',
    headers: {
      'Accept': 'application/pdf',
      'User-Agent': 'Test-PDF-Client/1.0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📊 Headers:`, res.headers);

    if (res.statusCode === 200) {
      console.log('✅ PDF endpoint работает! Получен PDF файл.');
      
      let dataLength = 0;
      res.on('data', (chunk) => {
        dataLength += chunk.length;
      });
      
      res.on('end', () => {
        console.log(`📊 Размер полученного PDF: ${dataLength} байт`);
        console.log('✅ Тест завершен успешно!');
      });
    } else {
      console.log(`❌ Ошибка ${res.statusCode}:`);
      
      let errorData = '';
      res.on('data', (chunk) => {
        errorData += chunk.toString();
      });
      
      res.on('end', () => {
        console.log('❌ Ответ сервера:', errorData);
      });
    }
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка запроса:', error.message);
    console.error('💡 Убедитесь, что backend запущен на порту 5100');
  });

  req.end();
}

// Функция для проверки статуса backend
function checkBackendStatus() {
  console.log('🔍 Проверка доступности backend...');
  
  const options = {
    hostname: BACKEND_URL,
    port: BACKEND_PORT,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Backend доступен, запуск теста PDF...\n');
      testPdfEndpoint();
    } else {
      console.log(`❌ Backend недоступен (status: ${res.statusCode})`);
    }
  });

  req.on('error', (error) => {
    console.error('❌ Backend недоступен:', error.message);
    console.error('💡 Запустите backend командой: npm run start или npm run dev');
  });

  req.on('timeout', () => {
    console.error('❌ Таймаут подключения к backend');
    req.destroy();
  });

  req.end();
}

// Запуск теста
console.log('🚀 Запуск теста PDF endpoint...\n');
checkBackendStatus();
