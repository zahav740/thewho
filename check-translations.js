// Скрипт для проверки переводов
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка файла переводов...');

// Читаем файл переводов
const translationsPath = path.join(__dirname, 'frontend', 'src', 'i18n', 'translations.ts');
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

console.log('✅ Файл переводов найден');

// Извлекаем ключи переводов для машин
const machineKeys = translationsContent.match(/'machine\.[^']+'/g) || [];
const planningKeys = translationsContent.match(/'planning\.[^']+'/g) || [];
const productionKeys = translationsContent.match(/'production\.[^']+'/g) || [];
const ordersKeys = translationsContent.match(/'orders\.[^']+'/g) || [];

console.log('\n📋 Найденные ключи переводов:');
console.log('🔧 Машины:', machineKeys.length, 'ключей');
machineKeys.forEach(key => console.log('  -', key));

console.log('\n📊 Планирование:', planningKeys.length, 'ключей');  
planningKeys.forEach(key => console.log('  -', key));

console.log('\n🏭 Производство:', productionKeys.length, 'ключей');
productionKeys.forEach(key => console.log('  -', key));

console.log('\n📦 Заказы:', ordersKeys.length, 'ключей');
ordersKeys.forEach(key => console.log('  -', key));

console.log('\n✅ Проверка завершена. Всего ключей:', 
  machineKeys.length + planningKeys.length + productionKeys.length + ordersKeys.length);
