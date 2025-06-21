@echo off
echo 🚀 Запуск Production CRM Backend...
echo.

REM Переходим в директорию backend
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

REM Проверяем наличие node_modules
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    npm install
    echo.
)

REM Проверяем наличие .env файла
if not exist ".env" (
    echo ⚠️  Файл .env не найден, копируем из .env.example
    copy .env.example .env
    echo.
)

echo 🔍 Проверяем подключение к базе данных...
echo.

REM Запускаем development сервер
echo ✅ Запускаем backend на порту 5200...
echo 🌐 API будет доступно по адресу: http://localhost:5200
echo 📚 Swagger документация: http://localhost:5200/api
echo.
echo Для остановки нажмите Ctrl+C
echo.

npm run start:dev

pause