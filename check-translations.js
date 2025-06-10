#!/usr/bin/env node

/**
 * Скрипт для проверки отсутствующих переводов в файлах страницы Shifts
 */

const fs = require('fs');
const path = require('path');

// Читаем файл переводов
const translationsPath = 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\i18n\\translations.ts';
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

// Извлекаем ключи переводов из файла translations.ts
const extractKeys = (content, lang) => {
  const langRegex = new RegExp(`${lang}:\\s*{([\\s\\S]*?)},?\\s*en:`, 'g');
  const match = langRegex.exec(content);
  if (!match) return [];
  
  const keysContent = match[1];
  const keyRegex = /'([^']+)':\\s*'[^']*'/g;
  const keys = [];
  let keyMatch;
  
  while ((keyMatch = keyRegex.exec(keysContent)) !== null) {
    keys.push(keyMatch[1]);
  }
  
  return keys;
};

// Извлекаем все использованные ключи из файлов компонентов
const extractUsedKeys = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const usedKeys = [];
  
  // Ищем паттерны t('key') и t("key")
  const patterns = [
    /t\('([^']+)'\)/g,
    /t\("([^"]+)"\)/g,
    /t\(`([^`]+)`\)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      usedKeys.push(match[1]);
    }
  });
  
  return usedKeys;
};

// Путь к компонентам Shifts
const shiftsPath = 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\pages\\Shifts';
const componentsPath = path.join(shiftsPath, 'components');

// Файлы для проверки
const filesToCheck = [
  path.join(shiftsPath, 'ShiftsPage.tsx'),
  path.join(componentsPath, 'ShiftsList.tsx'),
  path.join(componentsPath, 'ShiftForm.tsx'),
  path.join(componentsPath, 'ActiveMachinesMonitor.tsx'),
  path.join(componentsPath, 'ShiftStatistics.tsx'),
];

console.log('🔍 Проверка переводов для страницы Shifts...\n');

// Извлекаем ключи из файла переводов
const ruKeys = extractKeys(translationsContent, 'ru');
const enKeys = extractKeys(translationsContent, 'en');

console.log(`📊 Найдено ключей в переводах:`);
console.log(`   Русский: ${ruKeys.length}`);
console.log(`   Английский: ${enKeys.length}\n`);

// Извлекаем использованные ключи из всех файлов
let allUsedKeys = [];
filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const usedKeys = extractUsedKeys(filePath);
    allUsedKeys = [...allUsedKeys, ...usedKeys];
    console.log(`📁 ${path.basename(filePath)}: ${usedKeys.length} ключей`);
  } else {
    console.log(`❌ Файл не найден: ${filePath}`);
  }
});

// Убираем дубликаты
const uniqueUsedKeys = [...new Set(allUsedKeys)];
console.log(`\n📈 Всего уникальных ключей используется: ${uniqueUsedKeys.length}\n`);

// Проверяем отсутствующие ключи
const missingInRu = uniqueUsedKeys.filter(key => !ruKeys.includes(key));
const missingInEn = uniqueUsedKeys.filter(key => !enKeys.includes(key));

if (missingInRu.length > 0) {
  console.log('❌ Отсутствующие ключи в русском переводе:');
  missingInRu.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (missingInEn.length > 0) {
  console.log('❌ Отсутствующие ключи в английском переводе:');
  missingInEn.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (missingInRu.length === 0 && missingInEn.length === 0) {
  console.log('✅ Все ключи переводов найдены!');
} else {
  console.log(`\n📋 Итого отсутствует:`);
  console.log(`   Русский: ${missingInRu.length} ключей`);
  console.log(`   Английский: ${missingInEn.length} ключей`);
}

// Проверяем ключи, которые есть в переводах, но не используются
const unusedKeys = ruKeys.filter(key => 
  key.startsWith('shifts.') && !uniqueUsedKeys.includes(key)
);

if (unusedKeys.length > 0) {
  console.log(`\n🗑️ Неиспользуемые ключи переводов (${unusedKeys.length}):`);
  unusedKeys.forEach(key => console.log(`   - ${key}`));
}

console.log('\n🔧 Проверка завершена!');
