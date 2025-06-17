@echo off
echo 🔧 Начинаем исправление TypeScript ошибок...

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
echo 📁 Рабочая директория: %CD%

REM Создаем Node.js скрипт для исправления
echo const fs = require('fs'); > fix-imports.js
echo const path = require('path'); >> fix-imports.js
echo const glob = require('glob'); >> fix-imports.js
echo. >> fix-imports.js
echo // Рекурсивно ищем все .tsx файлы >> fix-imports.js
echo const files = glob.sync('src/**/*.tsx'); >> fix-imports.js
echo console.log(`Найдено ${files.length} файлов для обработки`); >> fix-imports.js
echo. >> fix-imports.js
echo let fixedCount = 0; >> fix-imports.js
echo. >> fix-imports.js
echo files.forEach(file =^> { >> fix-imports.js
echo   try { >> fix-imports.js
echo     let content = fs.readFileSync(file, 'utf8'); >> fix-imports.js
echo     const original = content; >> fix-imports.js
echo. >> fix-imports.js
echo     // Исправляем неиспользуемые импорты >> fix-imports.js
echo     content = content.replace(/^\s*useMemo,?\s*$/gm, ''); >> fix-imports.js
echo     content = content.replace(/^\s*Divider,?\s*$/gm, ''); >> fix-imports.js
echo     content = content.replace(/^\s*SearchOutlined,?\s*$/gm, ''); >> fix-imports.js
echo     content = content.replace(/^\s*UploadFile,?\s*$/gm, ''); >> fix-imports.js
echo     content = content.replace(/const { Option } = Select;/g, ''); >> fix-imports.js
echo     content = content.replace(/const \[isProcessing, setIsProcessing\] = useState\(false\);/g, ''); >> fix-imports.js
echo. >> fix-imports.js
echo     // Убираем пустые строки >> fix-imports.js
echo     content = content.replace(/^\s*\n\s*\n/gm, '\n'); >> fix-imports.js
echo     content = content.replace(/,\s*\n\s*}/gm, '\n}'); >> fix-imports.js
echo. >> fix-imports.js
echo     if (content !== original) { >> fix-imports.js
echo       fs.writeFileSync(file, content, 'utf8'); >> fix-imports.js
echo       console.log(`✅ Исправлен: ${file}`); >> fix-imports.js
echo       fixedCount++; >> fix-imports.js
echo     } >> fix-imports.js
echo   } catch (err) { >> fix-imports.js
echo     console.error(`❌ Ошибка в ${file}:`, err.message); >> fix-imports.js
echo   } >> fix-imports.js
echo }); >> fix-imports.js
echo. >> fix-imports.js
echo console.log(`🎉 Исправлено ${fixedCount} файлов из ${files.length}`); >> fix-imports.js

echo 🔧 Устанавливаем зависимости для скрипта...
if not exist node_modules\glob npm install glob --no-save >nul 2>&1

echo 🚀 Запускаем исправление...
node fix-imports.js

echo 🧹 Удаляем временный скрипт...
del fix-imports.js >nul 2>&1

echo.
echo ✅ Исправление завершено!
echo 🔍 Теперь можно запустить 'npm run build' для проверки
echo.
pause
