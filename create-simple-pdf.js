// Упрощенный скрипт для создания тестового PDF
console.log('📁 Создание тестового PDF файла...');

const fs = require('fs');
const path = require('path');

// Определяем путь к папке PDF в backend
const pdfDir = path.join(__dirname, 'backend', 'uploads', 'pdf');

// Создаем простой тестовый PDF содержимое
const testPdfContent = Buffer.from([
  0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4
  0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x0A, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x0A, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x0A, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A,
  // Остальное содержимое PDF...
]);

// Но используем более простой подход - создаем минимально валидный PDF
const simplePdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td (Test PDF Document) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000248 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 292 %%EOF`;

// Проверяем/создаем папку
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
  console.log(`✅ Создана папка: ${pdfDir}`);
}

// Сохраняем тестовый PDF
const filename = 'simple-test.pdf';
const filepath = path.join(pdfDir, filename);

fs.writeFileSync(filepath, simplePdfContent);
console.log(`✅ Создан тестовый PDF: ${filepath}`);

// Проверяем размер
const stats = fs.statSync(filepath);
console.log(`📊 Размер файла: ${stats.size} байт`);

// Выводим инструкции
console.log('\n📋 Тестирование:');
console.log('1. Запустите backend: cd backend && npm run start:dev');
console.log('2. Откройте: http://localhost:5100/api/orders/pdf/simple-test.pdf');
console.log('3. Должен отобразиться PDF с текстом "Test PDF Document"');
