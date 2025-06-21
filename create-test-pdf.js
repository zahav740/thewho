// Скрипт для создания тестового PDF файла
const fs = require('fs');
const path = require('path');

// Создаем простой тестовый PDF (минимальный валидный PDF)
const pdfContent = `%PDF-1.4
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
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Document) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000441 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
511
%%EOF`;

// Определяем пути для сохранения
const backendPath = path.join(__dirname, 'backend', 'uploads', 'pdf');
const rootPath = path.join(__dirname, 'uploads', 'pdf');

// Создаем папки если их нет
[backendPath, rootPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Создана папка: ${dir}`);
  }
});

// Сохраняем тестовый PDF
const filename = 'test-pdf-document.pdf';

[backendPath, rootPath].forEach(dir => {
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, pdfContent);
  console.log(`✅ Создан тестовый PDF: ${filepath}`);
});

console.log('🎉 Тестовые PDF файлы созданы!');
console.log('📋 Можно тестировать по URL: http://localhost:5100/api/orders/pdf/test-pdf-document.pdf');
