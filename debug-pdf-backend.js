/**
 * @file: debug-pdf-backend.js
 * @description: Диагностический скрипт для PDF backend
 * @created: 2025-06-21
 */

const http = require('http');

const BACKEND_URL = 'localhost';
const BACKEND_PORT = 5100;
const PDF_FILENAME = '1750497060623-385439311.pdf';

console.log('🔧 ДИАГНОСТИКА PDF BACKEND');
console.log('================================\n');

// 1. Проверка health endpoint
function checkHealth() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Проверка доступности backend...');
    
    const options = {
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('   ✅ Backend доступен\n');
        resolve(true);
      } else {
        console.log('   ❌ Backend возвращает ошибку\n');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`   ❌ Backend недоступен: ${error.message}\n`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ❌ Таймаут подключения\n');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 2. Проверка debug endpoint
function checkDebugEndpoint() {
  return new Promise((resolve) => {
    console.log('2️⃣ Проверка debug endpoint...');
    
    const options = {
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: `/api/orders/debug/pdf/${PDF_FILENAME}`,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const debugData = JSON.parse(data);
          console.log('   📊 Результаты поиска файла:');
          
          debugData.searchResults?.forEach((result, index) => {
            console.log(`      ${index + 1}. ${result.exists ? '✅' : '❌'} ${result.path}`);
            if (result.stats) {
              console.log(`         📁 Размер: ${result.stats.size} байт`);
            }
          });
          
          const foundFiles = debugData.foundFiles || [];
          if (foundFiles.length > 0) {
            console.log(`   ✅ Найдено файлов: ${foundFiles.length}`);
            console.log(`   📂 Рабочая директория: ${debugData.cwd}`);
          } else {
            console.log('   ❌ Файл не найден ни в одном из путей');
          }
          
          resolve(foundFiles.length > 0);
        } catch (e) {
          console.log(`   ❌ Ошибка парсинга ответа: ${e.message}`);
          console.log(`   📄 Ответ: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Ошибка запроса: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ❌ Таймаут запроса');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 3. Проверка PDF endpoint
function checkPdfEndpoint() {
  return new Promise((resolve) => {
    console.log('\n3️⃣ Проверка PDF endpoint...');
    
    const options = {
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: `/api/orders/pdf/${PDF_FILENAME}`,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      
      if (res.statusCode === 200) {
        let dataLength = 0;
        
        res.on('data', (chunk) => {
          dataLength += chunk.length;
        });
        
        res.on('end', () => {
          console.log(`   ✅ PDF успешно загружен, размер: ${dataLength} байт`);
          resolve(true);
        });
      } else {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk.toString();
        });
        
        res.on('end', () => {
          console.log(`   ❌ Ошибка ${res.statusCode}:`);
          console.log(`   📄 ${errorData}`);
          resolve(false);
        });
      }
    });

    req.on('error', (error) => {
      console.log(`   ❌ Ошибка запроса: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ❌ Таймаут запроса');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Запуск диагностики
async function runDiagnostics() {
  console.log(`🎯 Тестируем PDF: ${PDF_FILENAME}`);
  console.log(`🌐 Backend: http://${BACKEND_URL}:${BACKEND_PORT}\n`);
  
  const healthOk = await checkHealth();
  
  if (!healthOk) {
    console.log('❌ ПРОБЛЕМА: Backend недоступен');
    console.log('💡 РЕШЕНИЕ: Запустите backend командой: npm run start');
    return;
  }
  
  const debugOk = await checkDebugEndpoint();
  
  if (!debugOk) {
    console.log('\n❌ ПРОБЛЕМА: Файл не найден на сервере');
    console.log('💡 РЕШЕНИЕ: Проверьте расположение PDF файла');
    return;
  }
  
  const pdfOk = await checkPdfEndpoint();
  
  if (pdfOk) {
    console.log('\n🎉 ВСЕ РАБОТАЕТ! PDF endpoint исправен');
    console.log('💡 Теперь проверьте frontend на http://localhost:3000');
  } else {
    console.log('\n❌ ПРОБЛЕМА: PDF endpoint не работает');
    console.log('💡 РЕШЕНИЕ: Проверьте логи backend сервера');
  }
  
  console.log('\n================================');
  console.log('🔗 Полезные ссылки для тестирования:');
  console.log(`   Debug: http://${BACKEND_URL}:${BACKEND_PORT}/api/orders/debug/pdf/${PDF_FILENAME}`);
  console.log(`   PDF:   http://${BACKEND_URL}:${BACKEND_PORT}/api/orders/pdf/${PDF_FILENAME}`);
  console.log('================================');
}

runDiagnostics().catch(console.error);
