/**
 * @file: test-pdf-backend.js
 * @description: Скрипт для тестирования PDF функциональности backend
 * @created: 2025-06-21
 */

const fs = require('fs');
const path = require('path');

async function testPdfBackend() {
  console.log('🔍 Тестирование PDF Backend функциональности...\n');

  const baseUrl = 'http://localhost:5100';

  try {
    // 1. Проверяем, что backend запущен
    console.log('1. Проверка доступности backend...');
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        console.log('✅ Backend доступен на порту 5100');
      } else {
        console.log('❌ Backend не отвечает, статус:', response.status);
        return;
      }
    } catch (error) {
      console.log('❌ Backend недоступен:', error.message);
      console.log('💡 Убедитесь, что backend запущен: npm run start:dev');
      return;
    }

    // 2. Проверяем наличие PDF файлов
    console.log('\n2. Проверка PDF файлов в папке uploads...');
    const pdfDir = path.join(process.cwd(), 'backend', 'uploads', 'pdf');
    const pdfDirAlt = path.join(process.cwd(), 'uploads', 'pdf');

    let foundPdfDir = null;
    let pdfFiles = [];

    if (fs.existsSync(pdfDir)) {
      foundPdfDir = pdfDir;
      pdfFiles = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
    } else if (fs.existsSync(pdfDirAlt)) {
      foundPdfDir = pdfDirAlt;
      pdfFiles = fs.readdirSync(pdfDirAlt).filter(f => f.endsWith('.pdf'));
    }

    if (!foundPdfDir) {
      console.log('❌ Папка PDF не найдена');
      console.log('🔍 Проверенные пути:');
      console.log('  -', pdfDir);
      console.log('  -', pdfDirAlt);
      return;
    }

    console.log('✅ Папка PDF найдена:', foundPdfDir);
    console.log('📁 PDF файлы:', pdfFiles.length > 0 ? pdfFiles : 'Нет файлов');

    if (pdfFiles.length === 0) {
      console.log('\n⚠️ PDF файлы не найдены. Создаем тестовый файл...');
      
      // Создаем простой тестовый PDF файл
      const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000279 00000 n 
0000000351 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
445
%%EOF`;

      const testFileName = 'test-pdf-document.pdf';
      const testFilePath = path.join(foundPdfDir, testFileName);
      
      fs.writeFileSync(testFilePath, testPdfContent);
      console.log('✅ Тестовый PDF создан:', testFileName);
      pdfFiles.push(testFileName);
    }

    // 3. Тестируем доступ к PDF файлам
    console.log('\n3. Тестирование доступа к PDF файлам...');
    
    for (const fileName of pdfFiles.slice(0, 3)) { // Тестируем первые 3 файла
      console.log(`\n🔍 Тестирование файла: ${fileName}`);
      
      try {
        const response = await fetch(`${baseUrl}/api/orders/pdf/${fileName}`);
        
        console.log(`   Статус: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);
        
        if (response.ok) {
          console.log('   ✅ Файл доступен');
        } else {
          console.log('   ❌ Файл недоступен');
        }
      } catch (error) {
        console.log(`   ❌ Ошибка запроса: ${error.message}`);
      }
    }

    // 4. Тестируем CORS заголовки
    console.log('\n4. Проверка CORS заголовков...');
    
    if (pdfFiles.length > 0) {
      try {
        const response = await fetch(`${baseUrl}/api/orders/pdf/${pdfFiles[0]}`, {
          method: 'HEAD'
        });
        
        const corsHeaders = {
          'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
          'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
          'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
        };
        
        console.log('   CORS заголовки:', corsHeaders);
        
        if (corsHeaders['Access-Control-Allow-Origin']) {
          console.log('   ✅ CORS настроен');
        } else {
          console.log('   ⚠️ CORS заголовки отсутствуют');
        }
      } catch (error) {
        console.log(`   ❌ Ошибка проверки CORS: ${error.message}`);
      }
    }

    // 5. Проверка диагностического эндпоинта
    console.log('\n5. Тестирование диагностического эндпоинта...');
    
    if (pdfFiles.length > 0) {
      try {
        const response = await fetch(`${baseUrl}/api/orders/debug/pdf/${pdfFiles[0]}`);
        
        if (response.ok) {
          const debugInfo = await response.json();
          console.log('   ✅ Диагностический эндпоинт работает');
          console.log('   📊 Найденные файлы:', debugInfo.foundFiles?.length || 0);
        } else {
          console.log('   ❌ Диагностический эндпоинт недоступен');
        }
      } catch (error) {
        console.log(`   ❌ Ошибка диагностики: ${error.message}`);
      }
    }

    console.log('\n🎯 Результаты тестирования:');
    console.log('=====================================');
    console.log('Backend:', '✅ Работает');
    console.log('PDF папка:', foundPdfDir ? '✅ Найдена' : '❌ Не найдена');
    console.log('PDF файлы:', pdfFiles.length > 0 ? `✅ ${pdfFiles.length} файлов` : '❌ Нет файлов');
    
    if (pdfFiles.length > 0) {
      console.log('\n📋 Рекомендации для фронтенда:');
      console.log(`   URL для тестирования: ${baseUrl}/api/orders/pdf/${pdfFiles[0]}`);
      console.log('   Используйте PdfDebugViewer для диагностики');
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Запуск тестирования
testPdfBackend().then(() => {
  console.log('\n🏁 Тестирование завершено');
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
});
