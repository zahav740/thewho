@echo off
chcp 65001 > nul
echo ===========================================
echo 🚀 ЗАПУСК FRONTEND ПОСЛЕ ИСПРАВЛЕНИЙ
echo ===========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📂 Текущая директория: %CD%
echo.

echo 🔧 Проверка TypeScript...
npx tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ Обнаружены ошибки TypeScript. Запуск остановлен.
    pause
    exit /b 1
)

echo ✅ TypeScript проверка прошла успешно!
echo.
echo 🌐 Запуск React Development Server...
echo 📍 Frontend будет доступен на: http://localhost:5101
echo.

npm start
