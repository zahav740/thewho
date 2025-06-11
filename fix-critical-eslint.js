/**
 * Исправление критических ESLint ошибок в CRM проекте
 * @description Исправляет самые важные ошибки для компиляции проекта
 */

const fs = require('fs');
const path = require('path');

// Функция для безопасного чтения файла
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`⚠️ Не удалось прочитать файл: ${filePath}`);
    return null;
  }
}

// Функция для безопасной записи файла
function safeWriteFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Не удалось записать файл: ${filePath}`, error.message);
    return false;
  }
}

// Исправления для конкретных файлов
const fixes = [
  {
    name: 'StableExcelImporter.tsx',
    path: 'frontend/src/components/StableExcelImporter.tsx',
    replacements: [
      {
        from: 'const { Title } = Typography;',
        to: '// const { Title } = Typography; // Удалено неиспользуемое'
      },
      {
        from: 'const fileInputRef = useRef<any>(null);',
        to: '// const fileInputRef = useRef<any>(null); // Удалено неиспользуемое'
      },
      {
        from: /const \{ errors \} = formState;/g,
        to: '// const { errors } = formState; // Удалено неиспользуемое'
      }
    ]
  },
  
  {
    name: 'ActiveOperationsPage.tsx',
    path: 'frontend/src/pages/ActiveOperations/ActiveOperationsPage.tsx',
    replacements: [
      {
        from: /\s+Badge,/g,
        to: '\n  // Badge, // Удалено неиспользуемое'
      },
      {
        from: /\s+ClockCircleOutlined,/g,
        to: '\n  // ClockCircleOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+InfoCircleOutlined,/g,
        to: '\n  // InfoCircleOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+EditOutlined,/g,
        to: '\n  // EditOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+ThunderboltOutlined,/g,
        to: '\n  // ThunderboltOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+CalendarOutlined,/g,
        to: '\n  // CalendarOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+TeamOutlined,/g,
        to: '\n  // TeamOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+SettingOutlined,/g,
        to: '\n  // SettingOutlined, // Удалено неиспользуемое'
      },
      {
        from: 'const { shiftsApi } = useApi();',
        to: '// const { shiftsApi } = useApi(); // Удалено неиспользуемое'
      }
    ]
  },
  
  {
    name: 'CalendarPage.tsx',
    path: 'frontend/src/pages/Calendar/CalendarPage.tsx',
    replacements: [
      {
        from: 'const { Title } = Typography;',
        to: '// const { Title } = Typography; // Удалено неиспользуемое'
      }
    ]
  },
  
  {
    name: 'EnhancedProductionCalendar.tsx',
    path: 'frontend/src/pages/Calendar/components/EnhancedProductionCalendar.tsx',
    replacements: [
      {
        from: /\s+UserOutlined,/g,
        to: '\n  // UserOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+EyeOutlined,/g,
        to: '\n  // EyeOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+EnhancedCalendarData,/g,
        to: '\n  // EnhancedCalendarData, // Удалено неиспользуемое'
      },
      {
        from: 'const { Title } = Typography;',
        to: '// const { Title } = Typography; // Удалено неиспользуемое'
      },
      {
        from: /const \[selectedDate, setSelectedDate\] = useState<string \| null>\(null\);/,
        to: '// const [selectedDate, setSelectedDate] = useState<string | null>(null); // Удалено неиспользуемое'
      },
      {
        from: /const isPast = dayjs\(dateStr\)\.isBefore\(dayjs\(\), 'day'\);/,
        to: '// const isPast = dayjs(dateStr).isBefore(dayjs(), \'day\'); // Удалено неиспользуемое'
      }
    ]
  },
  
  {
    name: 'OperationHistory.tsx',
    path: 'frontend/src/pages/OperationHistory/OperationHistory.tsx',
    replacements: [
      {
        from: /\s+Alert,/g,
        to: '\n  // Alert, // Удалено неиспользуемое'
      },
      {
        from: /\s+Spin,/g,
        to: '\n  // Spin, // Удалено неиспользуемое'
      },
      {
        from: /useEffect\(\(\) => \{\s*loadOperationHistory\(\);\s*\}, \[page, pageSize, selectedStatus, selectedMachine\]\);/,
        to: 'useEffect(() => {\n    loadOperationHistory();\n  }, [loadOperationHistory, page, pageSize, selectedStatus, selectedMachine]);'
      }
    ]
  },
  
  {
    name: 'MachineCard.tsx',
    path: 'frontend/src/pages/Production/components/MachineCard.tsx',
    replacements: [
      {
        from: /\s+Checkbox,/g,
        to: '\n  // Checkbox, // Удалено неиспользуемое'
      },
      {
        from: /\s+StopOutlined,/g,
        to: '\n  // StopOutlined, // Удалено неиспользуемое'
      },
      {
        from: 'const getPriorityColor',
        to: '// const getPriorityColor // Удалено неиспользуемое'
      },
      {
        from: 'const { operationsApi }',
        to: '// const { operationsApi } // Удалено неиспользуемое'
      }
    ]
  },
  
  {
    name: 'ActiveMachinesMonitor.tsx',
    path: 'frontend/src/pages/Shifts/components/ActiveMachinesMonitor.tsx',
    replacements: [
      {
        from: /\s+Modal,/g,
        to: '\n  // Modal, // Удалено неиспользуемое'
      },
      {
        from: /\s+Statistic,/g,
        to: '\n  // Statistic, // Удалено неиспользуемое'
      },
      {
        from: /\s+PlayCircleOutlined,/g,
        to: '\n  // PlayCircleOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+UserOutlined,/g,
        to: '\n  // UserOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+SettingOutlined,/g,
        to: '\n  // SettingOutlined, // Удалено неиспользуемое'
      },
      {
        from: /\s+PrinterOutlined,/g,
        to: '\n  // PrinterOutlined, // Удалено неиспользуемое'
      },
      {
        from: 'const { MachineAvailability }',
        to: '// const { MachineAvailability } // Удалено неиспользуемое'
      },
      {
        from: /const workingSessions = /,
        to: '// const workingSessions = // Удалено неиспользуемое'
      },
      {
        from: /const formatTime = /,
        to: '// const formatTime = // Удалено неиспользуемое'
      }
    ]
  }
];

// Основная функция исправления
function fixAllFiles() {
  console.log('🔧 Начинаем исправление критических ESLint ошибок...\n');
  
  let totalFixed = 0;
  let totalFiles = fixes.length;
  
  fixes.forEach((fix, index) => {
    console.log(`📄 ${index + 1}/${totalFiles}: Исправляем ${fix.name}`);
    
    const fullPath = path.join(__dirname, fix.path);
    const content = safeReadFile(fullPath);
    
    if (!content) {
      console.log(`   ⚠️ Файл пропущен: ${fix.name}`);
      return;
    }
    
    let modifiedContent = content;
    let changesCount = 0;
    
    fix.replacements.forEach((replacement, repIndex) => {
      const oldContent = modifiedContent;
      
      if (replacement.from instanceof RegExp) {
        modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
      } else {
        modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
      }
      
      if (modifiedContent !== oldContent) {
        changesCount++;
        console.log(`   ✅ Применено исправление ${repIndex + 1}`);
      }
    });
    
    if (changesCount > 0) {
      if (safeWriteFile(fullPath, modifiedContent)) {
        console.log(`   💾 Файл сохранен с ${changesCount} исправлениями`);
        totalFixed++;
      }
    } else {
      console.log(`   ℹ️ Никаких изменений не требуется`);
    }
    
    console.log('');
  });
  
  console.log(`✅ Завершено! Исправлено файлов: ${totalFixed}/${totalFiles}`);
  console.log('🎯 Рекомендуется запустить проверку TypeScript и ESLint');
}

// Запуск
fixAllFiles();
