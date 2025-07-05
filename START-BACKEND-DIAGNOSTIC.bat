@echo off
echo ====================================
echo ДИАГНОСТИКА И ЗАПУСК BACKEND
echo ====================================
echo.

echo 🔍 Проверяем, что занимает порт 5100...
netstat -ano | findstr ":5100"
if errorlevel 1 (
    echo ✅ Порт 5100 свободен
) else (
    echo ⚠️ Порт 5100 занят, завершаем процессы...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100"') do (
        echo Завершаем процесс PID: %%a
        taskkill /F /PID %%a 2>nul
    )
)

echo.
echo 📂 Переходим в папку backend...
cd /d "%~dp0backend"

echo 🔍 Проверяем наличие node_modules...
if not exist "node_modules" (
    echo ⚠️ node_modules не найден, устанавливаем зависимости...
    npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo 🔍 Проверяем .env файл...
if not exist ".env" (
    echo ⚠️ .env файл не найден!
    echo 💡 Создаем базовый .env файл...
    echo NODE_ENV=development > .env
    echo PORT=5100 >> .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_USERNAME=postgres >> .env
    echo DB_PASSWORD=magarel >> .env
    echo DB_NAME=thewho >> .env
    echo JWT_SECRET=your-secret-key-here >> .env
    echo ✅ Базовый .env файл создан
)

echo.
echo 🚀 Запуск backend на порту 5100...
echo 📋 Логи будут видны ниже...
echo 📋 Для остановки: Ctrl+C
echo 📋 Frontend: http://localhost:5101
echo 📋 Backend API: http://localhost:5100/api
echo 📋 Swagger: http://localhost:5100/api/docs
echo.

npm run start:dev

pause
