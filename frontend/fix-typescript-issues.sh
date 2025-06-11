#!/bin/bash

echo "🔧 Начинаем исправление TypeScript ошибок..."

# Переходим в директорию frontend
cd /c/Users/kasuf/Downloads/TheWho/production-crm/frontend/

echo "📁 Рабочая директория: $(pwd)"

# Проверяем существование папки src
if [ ! -d "src" ]; then
    echo "❌ Папка src не найдена!"
    exit 1
fi

echo "✅ Папка src найдена"

# Создаем скрипт для исправления неиспользуемых импортов
cat > fix-unused-imports.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов .tsx
function findTsxFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            results = results.concat(findTsxFiles(filePath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(filePath);
        }
    }
    
    return results;
}

// Исправления для разных файлов
const fixes = {
    // Общие исправления для удаления неиспользуемых импортов
    global: [
        // Удаляем неиспользуемые импорты из @ant-design/icons
        { pattern: /^\s*DashboardOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Statistic,?\s*$/gm, replacement: '' },
        { pattern: /^\s*CloseOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*FileTextOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Badge,?\s*$/gm, replacement: '' },
        { pattern: /^\s*ClockCircleOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*InfoCircleOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*EditOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*ThunderboltOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*CalendarOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*TeamOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*SettingOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*UserOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*EyeOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*PlayCircleOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*PrinterOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*WarningOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*StopOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Checkbox,?\s*$/gm, replacement: '' },
        { pattern: /^\s*useEffect,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Divider,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Modal,?\s*$/gm, replacement: '' },
        { pattern: /^\s*SearchOutlined,?\s*$/gm, replacement: '' },
        { pattern: /^\s*useMemo,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Input,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Alert,?\s*$/gm, replacement: '' },
        { pattern: /^\s*Spin,?\s*$/gm, replacement: '' },
        
        // Удаляем неиспользуемые импорты типов
        { pattern: /^\s*UploadFile,?\s*$/gm, replacement: '' },
        { pattern: /^\s*OrderFormOperationDto,?\s*$/gm, replacement: '' },
        { pattern: /^\s*MachineAvailability,?\s*$/gm, replacement: '' },
        { pattern: /^\s*OperatorEfficiencyStats,?\s*$/gm, replacement: '' },
        { pattern: /^\s*EnhancedCalendarData,?\s*$/gm, replacement: '' },
        
        // Удаляем неиспользуемые переменные
        { pattern: /const\s+Option\s*=\s*Select\.Option;\s*\n/g, replacement: '' },
        { pattern: /const\s+Title\s*=\s*Typography\.Title;\s*\n/g, replacement: '' },
        { pattern: /const\s+Paragraph\s*=\s*Typography\.Paragraph;\s*\n/g, replacement: '' },
        
        // Убираем пустые строки в импортах
        { pattern: /,\s*\n\s*\}/gm, replacement: '\n}' },
        { pattern: /\{\s*,/gm, replacement: '{' },
        { pattern: /,\s*,/gm, replacement: ',' },
    ]
};

// Применяем исправления ко всем файлам
const tsxFiles = findTsxFiles('src');
let fixedFiles = 0;

console.log(`📝 Найдено ${tsxFiles.length} TypeScript файлов`);

for (const filePath of tsxFiles) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // Применяем глобальные исправления
        for (const fix of fixes.global) {
            content = content.replace(fix.pattern, fix.replacement);
        }
        
        // Убираем пустые строки в импортах
        content = content.replace(/import\s*\{\s*\n\s*\}/gm, '');
        content = content.replace(/,\s*\n\s*\}\s*from/gm, '\n} from');
        
        // Если контент изменился, сохраняем файл
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Исправлен: ${filePath}`);
            fixedFiles++;
        }
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

console.log(`🎉 Обработано файлов: ${fixedFiles} из ${tsxFiles.length}`);
EOF

# Запускаем скрипт исправления
echo "🔧 Запускаем исправление неиспользуемых импортов..."
node fix-unused-imports.js

echo "📝 Проверяем TypeScript ошибки..."
npm run build 2>&1 | head -20

echo ""
echo "✅ Исправление завершено!"
echo "🔍 Рекомендуется запустить 'npm run build' для полной проверки"
