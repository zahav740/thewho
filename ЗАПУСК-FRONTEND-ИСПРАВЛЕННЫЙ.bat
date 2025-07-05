@echo off
echo 🚀 Запуск Frontend - Исправленная версия
echo =====================================

cd /d "%~dp0frontend"

echo 📦 Проверка node_modules...
if not exist "node_modules" (
    echo ⚠️ node_modules не найден, устанавливаем зависимости...
    npm install
)

echo 🔨 Сборка и запуск приложения...
npm start

echo ✅ Frontend запущен
pause
