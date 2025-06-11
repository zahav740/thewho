@echo off
echo ================================================
echo 🚀 ЗАПУСК BACKEND НА ПОРТУ 5100
echo ================================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🛑 Останавливаем предыдущие процессы...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo 🔧 Устанавливаем переменные окружения...
set NODE_ENV=production
set PORT=5100
set DB_HOST=localhost
set DB_PORT=5432
set DB_USERNAME=postgres
set DB_PASSWORD=magarel
set DB_NAME=thewho

echo.
echo ⚙️ Переменные установлены:
echo - PORT: %PORT%
echo - NODE_ENV: %NODE_ENV%
echo - Database: %DB_NAME%

echo.
echo 🚀 Запускаем backend сервер...
echo.

npm run start

echo.
echo 📋 Если сервер запустился, проверьте:
echo - Health: http://localhost:5100/api/health
echo - Swagger: http://localhost:5100/api/docs
echo - Operations: http://localhost:5100/api/operation-analytics/machine/1
echo.
pause
