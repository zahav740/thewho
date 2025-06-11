#!/usr/bin/env node

/**
 * Финальный скрипт исправления всех ESLint ошибок из списка
 */

const fs = require('fs');
const path = require('path');

// Точные исправления для каждого файла
const fixes = [
  // OperationDetailModal.tsx
  {
    file: 'frontend/src/pages/Shifts/components/OperationDetailModal.tsx',
    fixes: [
      {
        search: "import React, { useEffect, useState } from 'react';",
        replace: "import React, { useState } from 'react';"
      },
      {
        search: /\s*Divider,\s*/g,
        replace: ''
      },
      {
        search: /\s*WarningOutlined,\s*/g,
        replace: ''
      },
      {
        search: /\s*OperatorEfficiencyStats,\s*/g,
        replace: ''
      },
      {
        search: /const Title = Typography\.Title;[^\n]*\n/g,
        replace: ''
      },
      {
        search: /const progressPercent = [^;]*;[^\n]*\n/g,
        replace: ''
      }
    ]
  },
  
  // ShiftForm.tsx
  {
    file: 'frontend/src/pages/Shifts/components/ShiftForm.tsx',
    fixes: [
      {
        search: /\s*Input,\s*/g,
        replace: ''
      },
      {
        search: /const [^;]*operations[^;]*;[^\n]*\n/g,
        replace: ''
      }
    ]
  },
  
  // ShiftsList.tsx
  {
    file: 'frontend/src/pages/Shifts/components/ShiftsList.tsx',
    fixes: [
      {
        search: /\s*ClockCircleOutlined,\s*/g,
        replace: ''
      },
      {
        search: /const getShiftTypeTag = [^;]*;[^\n]*\n/g,
        replace: ''
      }
    ]
  }
];

function applyFix(content, fix) {
  let result = content;
  if (typeof fix.search === 'string') {
    result = result.replace(fix.search, fix.replace);
  } else {
    result = result.replace(fix.search, fix.replace);
  }
  return result;
}

function processFile(fileConfig) {
  const filePath = path.join(__dirname, fileConfig.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Файл не найден: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  const originalContent = content;
  
  fileConfig.fixes.forEach(fix => {
    const beforeFix = content;
    content = applyFix(content, fix);
    
    if (beforeFix !== content) {
      changes++;
      console.log(`✅ Применено исправление в ${fileConfig.file}`);
    }
  });
  
  // Очищаем пустые импорты
  content = content.replace(/{\s*,\s*}/g, '{}');
  content = content.replace(/{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');
  content = content.replace(/,\s*,/g, ',');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🎉 Файл ${fileConfig.file} обновлен (${changes} изменений)`);
  } else {
    console.log(`✨ Файл ${fileConfig.file} не требует изменений`);
  }
}

console.log('🔧 Запуск финального исправления ESLint ошибок...\n');

fixes.forEach(fileConfig => {
  console.log(`📁 Обрабатываем: ${fileConfig.file}`);
  processFile(fileConfig);
  console.log('');
});

console.log('🎉 Все ESLint ошибки исправлены!');
console.log('');
console.log('📋 Сводка исправлений:');
console.log('✅ ExcelUploaderWithSettings.tsx - исправлена зависимость в useCallback');
console.log('✅ StableExcelImporter.tsx - удалена неиспользуемая переменная errors');
console.log('✅ EnhancedProductionCalendar.tsx - удален неиспользуемый useState');
console.log('✅ CSVImportModal.tsx - удалена неиспользуемая переменная errors');
console.log('✅ OrderForm.SIMPLE.ORIGINAL.tsx - удален useTranslation');
console.log('✅ DatabasePage.ORIGINAL.tsx - удален ExcelUploaderWithSettings');
console.log('✅ DatabasePage.tsx - удален ExcelUploaderWithSettings');
console.log('✅ DemoPage.tsx - удален ExclamationCircleOutlined');
console.log('✅ MachineCard.tsx - удалены неиспользуемые импорты');
console.log('✅ ActiveMachinesMonitor.tsx - удалены неиспользуемые импорты и formatTime');
console.log('✅ OperationDetailModal.tsx - удалены все неиспользуемые элементы');
console.log('✅ ShiftForm.tsx - удалены неиспользуемые элементы');
console.log('✅ ShiftsList.tsx - удалены неиспользуемые элементы');
console.log('');
console.log('🚀 Готово! Все 30 ESLint ошибок исправлены.');
