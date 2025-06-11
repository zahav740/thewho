const fs = require('fs');
const path = require('path');

console.log('🔧 Автоматическое исправление ESLint ошибок...');

// Массив всех файлов с ошибками и их исправлениями
const fixes = [
  // 1. PlanningModalImproved.tsx - исправить незакрытый тег Result и удалить неиспользуемую функцию
  {
    file: 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\components\\PlanningModal\\PlanningModalImproved.tsx',
    replacements: [
      {
        search: '</r>',
        replace: '</r>'
      },
      {
        search: `  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'MILLING':
        return '#1890ff';
      case 'TURNING':
        return '#52c41a';
      default:
        return '#666';
    }
  };`,
        replace: '  // Удалена неиспользуемая функция getMachineTypeColor'
      }
    ]
  },

  // 2. StableExcelImporter.tsx - удалить неиспользуемые импорты
  {
    file: 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\components\\StableExcelImporter.tsx',
    replacements: [
      {
        search: 'import React, { useState, useRef, useCallback } from \'react\';',
        replace: 'import React, { useState, useCallback } from \'react\';'
      },
      {
        search: 'const { data, errors } = Papa.parse(',
        replace: 'const { data } = Papa.parse('
      }
    ]
  },

  // 3. ActiveOperationsPage.tsx - удалить неиспользуемые импорты
  {
    file: 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\pages\\ActiveOperations\\ActiveOperationsPage.tsx',
    replacements: [
      {
        search: 'import {\n  Card,\n  Typography,\n  Row,\n  Col,\n  Tag,\n  Button,\n  Space,\n  Statistic,\n  Alert,\n  Spin,\n  Empty,\n  Tooltip,\n  Progress,\n  Badge,\n  List,\n  Avatar,\n  Select,\n  Input,\n  DatePicker,\n  Divider,\n  Table,\n  message,\n} from \'antd\';',
        replace: 'import {\n  Card,\n  Typography,\n  Row,\n  Col,\n  Tag,\n  Button,\n  Space,\n  Statistic,\n  Alert,\n  Spin,\n  Empty,\n  Tooltip,\n  Progress,\n  List,\n  Avatar,\n  Select,\n  Input,\n  DatePicker,\n  Divider,\n  Table,\n  message,\n} from \'antd\';'
      },
      {
        search: 'import {\n  SearchOutlined,\n  ReloadOutlined,\n  FilterOutlined,\n  InfoCircleOutlined,\n  ClockCircleOutlined,\n  ToolOutlined,\n  UserOutlined,\n  CalendarOutlined,\n  CheckCircleOutlined,\n  ExclamationCircleOutlined,\n  CloseCircleOutlined,\n} from \'@ant-design/icons\';',
        replace: 'import {\n  SearchOutlined,\n  ReloadOutlined,\n  FilterOutlined,\n  ClockCircleOutlined,\n  ToolOutlined,\n  UserOutlined,\n  CalendarOutlined,\n  CheckCircleOutlined,\n  ExclamationCircleOutlined,\n  CloseCircleOutlined,\n} from \'@ant-design/icons\';'
      }
    ]
  },

  // 4. EnhancedProductionCalendar.tsx - удалить неиспользуемый useState
  {
    file: 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\pages\\Calendar\\components\\EnhancedProductionCalendar.tsx',
    replacements: [
      {
        search: 'import React, { useEffect, useState } from \'react\';',
        replace: 'import React, { useEffect } from \'react\';'
      }
    ]
  },

  // 5. EnhancedCalendarPage.tsx - удалить неиспользуемый импорт
  {
    file: 'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\pages\\Calendar\\EnhancedCalendarPage.tsx',
    replacements: [
      {
        search: 'import {\n  CalendarOutlined,\n  ToolOutlined,\n  ClockCircleOutlined,\n  ReloadOutlined,\n  FilterOutlined,\n  SettingOutlined,\n  ExportOutlined,\n  PlusOutlined,\n  SearchOutlined,\n  UserOutlined,\n  TagOutlined,\n  CheckCircleOutlined,\n  ExclamationCircleOutlined,\n  CloseCircleOutlined,\n} from \'@ant-design/icons\';',
        replace: 'import {\n  CalendarOutlined,\n  ToolOutlined,\n  ClockCircleOutlined,\n  ReloadOutlined,\n  FilterOutlined,\n  ExportOutlined,\n  PlusOutlined,\n  SearchOutlined,\n  UserOutlined,\n  TagOutlined,\n  CheckCircleOutlined,\n  ExclamationCircleOutlined,\n  CloseCircleOutlined,\n} from \'@ant-design/icons\';'
      }
    ]
  }
];

// Функция для применения исправлений
function applyFixes() {
  let totalFixes = 0;

  fixes.forEach((fix, index) => {
    console.log(`\n📁 Исправляем файл ${index + 1}/${fixes.length}: ${path.basename(fix.file)}`);
    
    if (!fs.existsSync(fix.file)) {
      console.log(`❌ Файл не найден: ${fix.file}`);
      return;
    }

    let content = fs.readFileSync(fix.file, 'utf8');
    let fileFixesApplied = 0;

    fix.replacements.forEach((replacement, repIndex) => {
      const beforeLength = content.length;
      content = content.replace(replacement.search, replacement.replace);
      
      if (content.length !== beforeLength || !content.includes(replacement.search)) {
        fileFixesApplied++;
        totalFixes++;
        console.log(`  ✅ Замена ${repIndex + 1}: применена`);
      } else {
        console.log(`  ⚠️ Замена ${repIndex + 1}: не найдено соответствие`);
      }
    });

    if (fileFixesApplied > 0) {
      fs.writeFileSync(fix.file, content, 'utf8');
      console.log(`  💾 Файл сохранен (${fileFixesApplied} исправлений)`);
    } else {
      console.log(`  ℹ️ Нет изменений для сохранения`);
    }
  });

  console.log(`\n🎉 Завершено! Применено ${totalFixes} исправлений в ${fixes.length} файлах.`);
}

// Запускаем исправления
applyFixes();
