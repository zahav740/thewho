@echo off
cd /d "%~dp0"
echo ===================================
echo ЗАПУСК BACKEND НА ПОРТУ 5100
echo ===================================

echo.
echo 1. Переходим в папку backend...
cd backend

echo.
echo 2. Останавливаем процессы на портах 5100...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100"') do (
    taskkill /f /pid %%a 2>nul
)

echo.
echo 3. Устанавливаем переменные окружения...
set NODE_ENV=development
set PORT=5100

echo.
echo 4. Запускаем backend...
echo PORT: %PORT%
echo.

npm run start:dev

pause