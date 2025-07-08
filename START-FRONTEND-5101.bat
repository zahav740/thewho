@echo off
echo ============================================
echo   ЗАПУСК FRONTEND НА ПОРТУ 5101
echo ============================================
echo.

cd /d "%~dp0frontend"

echo 📦 Проверяем зависимости...
if not exist node_modules (
    echo Установка зависимостей...
    npm install
)

echo.
echo 🎨 Запускаем frontend на порту 5101...
echo ✅ Frontend будет доступен на: http://localhost:5101
echo ✅ Excel Import: http://localhost:5101/excel-import
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

set PORT=5101
npm start
