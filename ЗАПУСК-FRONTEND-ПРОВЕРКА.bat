@echo off
echo 🎨 Быстрый запуск Frontend - Все ошибки исправлены  
echo ===============================================

cd /d "%~dp0frontend"

echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠️ Устанавливаем зависимости...
    npm install
)

echo 🛠️ Проверка TypeScript...
npx tsc --noEmit

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибки TypeScript! Проверьте код.
    pause
    exit /b 1
)

echo ✅ TypeScript проверка прошла! Запускаем frontend...
npm start

pause
