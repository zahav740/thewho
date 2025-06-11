/**
 * Скрипт для массового исправления ESLint ошибок
 * Автоматически удаляет неиспользуемые импорты
 */

const fs = require('fs');
const path = require('path');

// Конфигурация файлов и ошибок для исправления
const fixes = [
  // ActiveMachinesMonitor.tsx
  {
    file: 'frontend/src/pages/Shifts/components/ActiveMachinesMonitor.tsx',
    removals: [
      { type: 'import', name: 'Modal' },
      { type: 'import', name: 'Statistic' }, 
      { type: 'import', name: 'PlayCircleOutlined' },
      { type: 'import', name: 'UserOutlined' },
      { type: 'import', name: 'SettingOutlined' },
      { type: 'import', name: 'PrinterOutlined' },
      { type: 'variable', name: 'MachineAvailability' },
      { type: 'variable', name: 'workingSessions' },
      { type: 'variable', name: 'formatTime' }
    ]
  },
  // OperationDetailModal.tsx
  {
    file: 'frontend/src/pages/Shifts/components/OperationDetailModal.tsx',
    removals: [
      { type: 'import', name: 'useEffect' },
      { type: 'import', name: 'Divider' },
      { type: 'import', name: 'WarningOutlined' },
      { type: 'variable', name: 'OperatorEfficiencyStats' },
      { type: 'variable', name: 'Title' },
      { type: 'variable', name: 'progressPercent' }
    ]
  },
  // ShiftForm.tsx
  {
    file: 'frontend/src/pages/Shifts/components/ShiftForm.tsx',
    removals: [
      { type: 'import', name: 'Input' },
      { type: 'variable', name: 'operations' }
    ]
  },
  // ShiftsList.tsx
  {
    file: 'frontend/src/pages/Shifts/components/ShiftsList.tsx',
    removals: [
      { type: 'import', name: 'ClockCircleOutlined' },
      { type: 'variable', name: 'getShiftTypeTag' }
    ]
  }
];

function removeUnusedImport(content, importName) {
  // Удаляем импорт из списка импортов antd
  content = content.replace(new RegExp(`\\s*,\\s*${importName}\\s*,?`, 'g'), ',');
  content = content.replace(new RegExp(`\\s*${importName}\\s*,`, 'g'), '');
  content = content.replace(new RegExp(`,\\s*${importName}\\s*`, 'g'), '');
  content = content.replace(new RegExp(`{\\s*${importName}\\s*}`, 'g'), '{}');
  
  // Удаляем импорт из icons
  content = content.replace(new RegExp(`\\s*,\\s*${importName}\\s*,?`, 'g'), ',');
  content = content.replace(new RegExp(`\\s*${importName}\\s*,`, 'g'), '');
  content = content.replace(new RegExp(`,\\s*${importName}\\s*`, 'g'), '');
  
  // Очищаем пустые импорты и лишние запятые
  content = content.replace(/{\s*,\s*}/g, '{}');
  content = content.replace(/{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');
  content = content.replace(/,\s*,/g, ',');
  
  return content;
}

function removeUnusedVariable(content, varName) {
  // Удаляем объявление переменной с const
  content = content.replace(new RegExp(`\\s*const\\s+${varName}\\s*=.*?;`, 'g'), '');
  // Удаляем объявление переменной в деструктуризации
  content = content.replace(new RegExp(`\\s*,\\s*${varName}\\s*,?`, 'g'), ',');
  content = content.replace(new RegExp(`\\s*${varName}\\s*,`, 'g'), '');
  content = content.replace(new RegExp(`,\\s*${varName}\\s*`, 'g'), '');
  
  // Очищаем пустые деструктуризации
  content = content.replace(/{\s*,\s*}/g, '{}');
  content = content.replace(/{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');
  content = content.replace(/,\s*,/g, ',');
  
  return content;
}

function fixFile(fixConfig) {
  const filePath = path.join(__dirname, fixConfig.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Файл не найден: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  fixConfig.removals.forEach(removal => {
    const originalContent = content;
    
    if (removal.type === 'import') {
      content = removeUnusedImport(content, removal.name);
    } else if (removal.type === 'variable') {
      content = removeUnusedVariable(content, removal.name);
    }
    
    if (originalContent !== content) {
      changes++;
      console.log(`✅ Удален ${removal.type}: ${removal.name}`);
    }
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🎉 Файл ${fixConfig.file} исправлен (${changes} изменений)`);
  } else {
    console.log(`✨ Файл ${fixConfig.file} не требует изменений`);
  }
}

// Применяем исправления
console.log('🔧 Начинаем массовое исправление ESLint ошибок...');

fixes.forEach(fix => {
  console.log(`\n📁 Обрабатываем: ${fix.file}`);
  fixFile(fix);
});

console.log('\n🎉 Массовое исправление завершено!');
