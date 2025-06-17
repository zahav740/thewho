const fs = require('fs');
const path = require('path');

// Список файлов с ошибками и их исправления
const fixes = [
  // SimpleExcelUploader.tsx
  {
    file: 'src/components/ExcelUploader/SimpleExcelUploader.tsx',
    changes: [
      {
        find: "import { UploadFile, UploadProps } from 'antd/es/upload/interface';",
        replace: "import { UploadProps } from 'antd/es/upload/interface';"
      }
    ]
  },
  
  // Layout.tsx
  {
    file: 'src/components/Layout/Layout.tsx',
    changes: [
      {
        find: "import React, { useEffect, useState } from 'react';",
        replace: "import React, { useState } from 'react';"
      },
      {
        find: "  Space,",
        replace: ""
      }
    ]
  },
  
  // EnhancedOperationAnalyticsModal.tsx
  {
    file: 'src/components/OperationAnalyticsModal/EnhancedOperationAnalyticsModal.tsx',
    changes: [
      {
        find: "  DashboardOutlined,",
        replace: ""
      }
    ]
  },
  
  // OperationDetailsModal.tsx
  {
    file: 'src/components/OperationDetailsModal/OperationDetailsModal.tsx',
    changes: [
      {
        find: "  Statistic,",
        replace: ""
      },
      {
        find: "  CloseOutlined,",
        replace: ""
      },
      {
        find: "  FileTextOutlined,",
        replace: ""
      }
    ]
  },
  
  // PlanningModal.tsx
  {
    file: 'src/components/PlanningModal/PlanningModal.tsx',
    changes: [
      {
        find: "  ExclamationCircleOutlined,",
        replace: ""
      }
    ]
  },

  // StableExcelImporter.tsx
  {
    file: 'src/components/StableExcelImporter.tsx',
    changes: [
      {
        find: "const { Title } = Typography;",
        replace: "const { Title, Text } = Typography;"
      }
    ]
  }
];

// Функция для применения исправлений
function applyFix(filePath, changes) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Файл не найден: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  changes.forEach(change => {
    if (content.includes(change.find)) {
      content = content.replace(change.find, change.replace);
      changed = true;
      console.log(`✅ Исправлено в ${filePath}: ${change.find} -> ${change.replace}`);
    }
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`💾 Файл сохранен: ${filePath}`);
    return true;
  }
  
  return false;
}

// Применяем все исправления
console.log('🔧 Начинаем исправление TypeScript ошибок...\n');

let totalFixed = 0;

fixes.forEach(fix => {
  console.log(`📁 Обрабатываем файл: ${fix.file}`);
  if (applyFix(fix.file, fix.changes)) {
    totalFixed++;
  }
  console.log('');
});

console.log(`🎉 Завершено! Исправлено файлов: ${totalFixed} из ${fixes.length}`);
console.log('');
console.log('📋 Рекомендации:');
console.log('1. Запустите "npm run build" для проверки компиляции');
console.log('2. Проверьте работу приложения');
console.log('3. Если есть еще ошибки, повторите процесс');
