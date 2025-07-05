@echo off
echo ====================================
echo ЗАПУСК BACKEND С EXCEL IMPORT
echo ====================================
echo.

cd /d "%~dp0backend"

echo 🔍 Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠️  node_modules не найден, устанавливаем зависимости...
    npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo 📊 Проверка подключения к базе данных...
node -e "require('dotenv').config(); console.log('DB Host:', process.env.DB_HOST); console.log('DB Port:', process.env.DB_PORT); console.log('DB Name:', process.env.DB_NAME);"

echo.
echo 🚀 Запуск backend в режиме разработки...
echo 📋 Порт: 5100
echo 📋 Swagger: http://localhost:5100/api/docs
echo 📋 Health: http://localhost:5100/api/health
echo 📋 Excel API: http://localhost:5100/api/excel-import-db
echo.

npm run start:dev

pause
