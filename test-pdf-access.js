// Тестовый скрипт для проверки доступа к PDF файлам
const fs = require('fs');
const path = require('path');

console.log('📁 Тест доступа к PDF файлам');
console.log('===========================');

const testPaths = [
  path.join(__dirname, 'backend', 'uploads', 'pdf'),
  path.join(__dirname, 'uploads', 'pdf'),
  path.join(process.cwd(), 'backend', 'uploads', 'pdf'),
  path.join(process.cwd(), 'uploads', 'pdf')
];

console.log('🔍 Текущая рабочая директория:', process.cwd());
console.log('🔍 __dirname:', __dirname);

testPaths.forEach((testPath, index) => {
  console.log(`\n${index + 1}. Проверяем путь: ${testPath}`);
  
  if (fs.existsSync(testPath)) {
    console.log('   ✅ Папка существует');
    
    try {
      const files = fs.readdirSync(testPath);
      console.log(`   📁 Файлов в папке: ${files.length}`);
      
      files.forEach((file, fileIndex) => {
        const filePath = path.join(testPath, file);
        const stats = fs.statSync(filePath);
        console.log(`   ${fileIndex + 1}. ${file} (${Math.round(stats.size / 1024)} KB)`);
      });
    } catch (error) {
      console.log('   ❌ Ошибка чтения папки:', error.message);
    }
  } else {
    console.log('   ❌ Папка не существует');
  }
});

// Проверяем конкретный файл
const specificFile = '1750498636129-413393729.pdf';
console.log(`\n🔍 Проверяем конкретный файл: ${specificFile}`);

testPaths.forEach((testPath, index) => {
  const fullPath = path.join(testPath, specificFile);
  console.log(`${index + 1}. ${fullPath}`);
  
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`   ✅ НАЙДЕН! Размер: ${Math.round(stats.size / 1024)} KB`);
  } else {
    console.log(`   ❌ Не найден`);
  }
});

console.log('\n📋 Рекомендации:');
console.log('1. Убедитесь, что backend запущен на порту 5100');
console.log('2. Проверьте endpoint: http://localhost:5100/api/orders/pdf/1750498636129-413393729.pdf');
console.log('3. Если файл не отдается, нужно настроить раздачу статических файлов в NestJS');
