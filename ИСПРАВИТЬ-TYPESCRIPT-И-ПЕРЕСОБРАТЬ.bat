@echo off
chcp 65001 > nul
echo 🔧 ИСПРАВЛЕНИЕ ОШИБОК TYPESCRIPT И ПЕРЕСБОРКА BACKEND
echo ================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo ⏳ Очистка старых скомпилированных файлов...
if exist "dist" rmdir /s /q dist

echo ⏳ Проверка package.json...
if not exist "package.json" (
    echo ❌ package.json не найден!
    pause
    exit /b 1
)

echo ⏳ Установка зависимостей (если нужно)...
call npm install

echo ⏳ Пересборка TypeScript...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ОШИБКА СБОРКИ!
    echo 🔍 Проверьте ошибки TypeScript выше
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ BACKEND УСПЕШНО ПЕРЕСОБРАН!
echo 📁 Файлы скомпилированы в папку dist/
echo.

echo 🎯 Проверяем исправленный файл excel-import.service...
if exist "dist\src\modules\orders\excel-import.service.js" (
    echo ✅ excel-import.service.js успешно пересобран
) else (
    echo ⚠️ excel-import.service.js не найден
)

echo.
echo 🚀 Теперь можно запускать backend: npm start
echo.
pause
