@echo off
echo 🔧 Быстрый запуск Backend - Все ошибки исправлены
echo ===============================================

cd /d "%~dp0backend"

echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠️ Устанавливаем зависимости...
    npm install
)

echo 🛠️ Компиляция TypeScript...
npx tsc --noEmit

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибки компиляции! Проверьте код.
    pause
    exit /b 1
)

echo ✅ Компиляция успешна! Запускаем backend...
npm run start:dev

pause
