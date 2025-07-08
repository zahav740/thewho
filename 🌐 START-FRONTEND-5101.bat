@echo off
echo ==============================================
echo 🌐 ЗАПУСК FRONTEND НА ПОРТУ 5101
echo ==============================================

echo Переход в папку frontend...
cd /d "%~dp0frontend"

echo Остановка процессов на порту 5101...
netstat -ano | findstr :5101 | findstr LISTENING > nul
if %errorlevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
)

echo Установка зависимостей...
call npm install

echo.
echo 🚀 Запуск frontend на порту 5101...
echo Frontend будет доступен по адресу: http://localhost:5101
echo Подключается к backend: http://localhost:5100

set PORT=5101
call npm start

pause
