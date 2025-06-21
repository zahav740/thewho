@echo off
echo 🚀 Запуск Production CRM Backend для тестирования PDF
echo ===================================================

cd /d "%~dp0"

if not exist "backend" (
    echo ❌ Папка backend не найдена
    pause
    exit
)

echo 📁 Переходим в папку backend...
cd backend

echo 📦 Проверяем зависимости...
if not exist "node_modules" (
    echo 📥 Устанавливаем зависимости...
    npm install
)

echo 🔧 Запускаем backend в режиме разработки...
echo.
echo 🌐 Backend будет доступен на: http://localhost:5100
echo 📚 Swagger API: http://localhost:5100/api/docs
echo 🏥 Health check: http://localhost:5100/api/health
echo 📄 PDF тест: http://localhost:5100/api/orders/pdf/1750498636129-413393729.pdf
echo.

npm run start:dev
