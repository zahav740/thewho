@echo off
echo ===========================================
echo 🔍 ПРОВЕРКА BACKEND И API ПЛАНИРОВАНИЯ
echo ===========================================

echo.
echo 📡 Проверяем, запущен ли backend на порту 5100...
curl -s http://localhost:5100/api/health
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend запущен!
) else (
    echo ❌ Backend НЕ запущен!
    echo 🚀 Запускаем backend...
    cd backend
    start "Backend Server" cmd /k "npm run start:dev"
    echo ⏳ Ждем 10 секунд для запуска...
    timeout /t 10 /nobreak
    cd ..
)

echo.
echo 🔍 Проверяем API планирования...
echo.
echo --- Стандартное планирование ---
curl -s -w "Status: %%{http_code}\n" http://localhost:5100/api/planning/demo -X POST

echo.
echo --- Улучшенное планирование ---
curl -s -w "Status: %%{http_code}\n" http://localhost:5100/api/planning-improved/demo -X POST

echo.
echo --- Анализ системы ---
curl -s -w "Status: %%{http_code}\n" http://localhost:5100/api/planning-improved/analysis

echo.
echo ===========================================
echo 🏁 Проверка завершена
echo ===========================================
pause
