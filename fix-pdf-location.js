/**
 * @file: fix-pdf-location.js
 * @description: Скрипт для копирования PDF файла в правильное место
 * @created: 2025-06-21
 */

const fs = require('fs');
const path = require('path');

const PDF_FILENAME = '1750497060623-385439311.pdf';

// Поиск файла во всех возможных местах
const searchPaths = [
  path.join(process.cwd(), 'uploads', 'pdf', PDF_FILENAME),
  path.join(process.cwd(), 'backend', 'uploads', 'pdf', PDF_FILENAME),
  path.join(__dirname, 'backend', 'uploads', 'pdf', PDF_FILENAME),
  path.join(__dirname, 'uploads', 'pdf', PDF_FILENAME),
];

// Целевое место
const targetPath = path.join(process.cwd(), 'uploads', 'pdf', PDF_FILENAME);
const targetDir = path.dirname(targetPath);

console.log('🔧 ИСПРАВЛЕНИЕ РАСПОЛОЖЕНИЯ PDF ФАЙЛА');
console.log('=====================================\n');

console.log(`📁 Целевой путь: ${targetPath}`);
console.log(`📁 Целевая папка: ${targetDir}\n`);

console.log('🔍 Поиск файла в возможных местах:');

let foundPath = null;
searchPaths.forEach((searchPath, index) => {
  const exists = fs.existsSync(searchPath);
  console.log(`   ${index + 1}. ${exists ? '✅' : '❌'} ${searchPath}`);
  
  if (exists && !foundPath) {
    foundPath = searchPath;
  }
});

if (!foundPath) {
  console.log('\n❌ PDF файл не найден ни в одном из путей');
  console.log('💡 Убедитесь, что файл существует или загрузите его заново');
  process.exit(1);
}

console.log(`\n✅ Файл найден: ${foundPath}`);

// Создаем целевую папку, если её нет
if (!fs.existsSync(targetDir)) {
  console.log(`📁 Создаю папку: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// Если файл уже в правильном месте
if (foundPath === targetPath) {
  console.log('✅ Файл уже находится в правильном месте!');
  console.log('\n🎯 Проверьте backend:');
  console.log('   node debug-pdf-backend.js');
  process.exit(0);
}

// Копируем файл
try {
  console.log(`📋 Копирую файл...`);
  console.log(`   Из: ${foundPath}`);
  console.log(`   В:  ${targetPath}`);
  
  fs.copyFileSync(foundPath, targetPath);
  
  const stats = fs.statSync(targetPath);
  console.log(`✅ Файл успешно скопирован! Размер: ${stats.size} байт`);
  
  console.log('\n🎯 Теперь запустите диагностику:');
  console.log('   node debug-pdf-backend.js');
  
} catch (error) {
  console.log(`❌ Ошибка копирования: ${error.message}`);
  process.exit(1);
}
