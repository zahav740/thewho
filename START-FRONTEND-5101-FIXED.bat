@echo off
echo ====================================
echo 🚀 ЗАПУСК FRONTEND НА ПОРТУ 5101
echo ====================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📊 Проверяем порт 5101...
netstat -an | findstr :5101
if %errorlevel% == 0 (
    echo ⚠️ Порт 5101 занят, останавливаем процессы...
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
)

echo 📦 Устанавливаем зависимости...
call npm install

echo 🚀 Запускаем frontend на порту 5101...
echo 🌐 Frontend будет доступен на http://localhost:5101
echo 📱 Подключение к backend: http://localhost:5100
echo.

set PORT=5101
call npm start
