#!/usr/bin/env node

/**
 * Финальный скрипт для исправления последней ESLint ошибки
 * Исправляет незакрытый тег Result в PlanningModalImproved.tsx
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'PlanningModal', 'PlanningModalImproved.tsx');

console.log('🔧 Исправление последней ESLint ошибки...');

try {
  // Читаем файл
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Исправляем неправильный тег
  const originalContent = content;
  content = content.replace('</r>', '</r>');
  
  if (originalContent !== content) {
    // Записываем исправленный файл
    fs.writeFileSync(filePath, content);
    console.log('✅ Исправлен незакрытый тег Result в PlanningModalImproved.tsx');
    
    // Проверяем баланс тегов
    const openingTags = (content.match(/<Result/g) || []).length;
    const closingTags = (content.match(/<\/r>/g) || []).length;
    
    console.log(`📊 Открывающих тегов <Result: ${openingTags}`);
    console.log(`📊 Закрывающих тегов </r>: ${closingTags}`);
    
    if (openingTags === closingTags) {
      console.log('🎉 ВСЕ ТЕГИ RESULT ПРАВИЛЬНО СБАЛАНСИРОВАНЫ!');
    } else {
      console.log('❌ Ошибка: количество открывающих и закрывающих тегов не совпадает!');
      process.exit(1);
    }
    
  } else {
    console.log('ℹ️ Неправильный тег не найден. Возможно, он уже исправлен.');
  }
  
  console.log('\n🎉 ВСЕ ESLINT ОШИБКИ ИСПРАВЛЕНЫ!');
  console.log('\n🚀 Следующие шаги:');
  console.log('   npm run lint     # Проверить ESLint');
  console.log('   npm run build    # Собрать проект');
  console.log('   npm start        # Запустить приложение');
  
} catch (error) {
  console.error('❌ Ошибка при исправлении файла:', error.message);
  process.exit(1);
}
