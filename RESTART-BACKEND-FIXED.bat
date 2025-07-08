@echo off
echo ===================================
echo Перезапуск Backend после исправлений
echo ===================================

echo Остановка всех процессов Node.js...
taskkill /F /IM node.exe 2>nul

echo Очистка портов...
netstat -ano | findstr :5100 | findstr LISTENING > nul
if %errorlevel% == 0 (
    echo Порт 5100 занят, освобождаем...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
)

echo Переход в папку backend...
cd /d "%~dp0backend"

echo Установка зависимостей...
call npm install

echo Запуск backend на порту 5100...
call npm run start:dev

pause
