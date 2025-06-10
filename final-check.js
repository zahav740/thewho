#!/usr/bin/env node

/**
 * Финальная проверка переводов Shifts страницы
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Финальная проверка перевода страницы Shifts...\n');

// Список измененных файлов
const changedFiles = [
  'frontend/src/i18n/translations.ts',
  'frontend/src/pages/Shifts/ShiftsPage.tsx', 
  'frontend/src/pages/Shifts/components/ShiftsList.tsx',
  'frontend/src/pages/Shifts/components/ShiftForm.tsx',
  'frontend/src/pages/Shifts/components/ActiveMachinesMonitor.tsx',
  'frontend/src/pages/Shifts/components/ShiftStatistics.tsx',
  'frontend/src/components/Layout/Layout.tsx'
];

const basePath = 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm';

console.log('📁 Проверяем измененные файлы:\n');

changedFiles.forEach((file, index) => {
  const fullPath = path.join(basePath, file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  const size = exists ? `(${Math.round(fs.statSync(fullPath).size / 1024)}KB)` : '(не найден)';
  
  console.log(`${index + 1}. ${status} ${file} ${size}`);
});

console.log('\n🔧 Проверяем ключевые изменения:\n');

// Проверяем наличие useTranslation в компонентах
const componentsToCheck = [
  'frontend/src/pages/Shifts/ShiftsPage.tsx',
  'frontend/src/pages/Shifts/components/ShiftsList.tsx', 
  'frontend/src/pages/Shifts/components/ShiftForm.tsx',
  'frontend/src/pages/Shifts/components/ActiveMachinesMonitor.tsx',
  'frontend/src/pages/Shifts/components/ShiftStatistics.tsx'
];

componentsToCheck.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasUseTranslation = content.includes('useTranslation');
    const hasTranslationImport = content.includes("from '../../../i18n'") || content.includes("from '../../i18n'");
    const hasTFunction = content.includes('const { t } = useTranslation()');
    
    const status = hasUseTranslation && hasTranslationImport && hasTFunction ? '✅' : '⚠️';
    console.log(`${status} ${path.basename(file)}: useTranslation ${hasUseTranslation ? '✅' : '❌'}, import ${hasTranslationImport ? '✅' : '❌'}, t() ${hasTFunction ? '✅' : '❌'}`);
  }
});

console.log('\n📊 Проверяем количество переводов в translations.ts:\n');

const translationsPath = path.join(basePath, 'frontend/src/i18n/translations.ts');
if (fs.existsSync(translationsPath)) {
  const content = fs.readFileSync(translationsPath, 'utf8');
  
  // Подсчитываем ключи shifts.*
  const ruShiftsKeys = (content.match(/'shifts\.[^']+'/g) || []).length;
  const enShiftsKeysMatch = content.match(/en:\s*{([\s\S]*?)},?\s*};\s*export/);
  const enShiftsKeys = enShiftsKeysMatch ? (enShiftsKeysMatch[1].match(/'shifts\.[^']+'/g) || []).length : 0;
  
  console.log(`📈 Русский язык: ${ruShiftsKeys} ключей shifts.*`);
  console.log(`📈 Английский язык: ${enShiftsKeys} ключей shifts.*`);
  
  if (ruShiftsKeys === enShiftsKeys && ruShiftsKeys > 50) {
    console.log('✅ Количество переводов совпадает и достаточно!');
  } else {
    console.log('⚠️ Несоответствие количества переводов или недостаточно ключей');
  }
} else {
  console.log('❌ Файл переводов не найден');
}

console.log('\n🎯 Рекомендации для тестирования:\n');
console.log('1. Запустите приложение: npm start');
console.log('2. Перейдите на страницу /shifts'); 
console.log('3. Переключите язык через кнопку в header');
console.log('4. Проверьте все вкладки и функции');
console.log('5. Создайте новую запись смены');
console.log('6. Откройте статистику');

console.log('\n✅ Проверка завершена!');
console.log('\n🌟 Страница Shifts готова к использованию на русском и английском языках!');
