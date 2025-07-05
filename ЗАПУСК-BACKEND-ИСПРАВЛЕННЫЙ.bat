@echo off
echo 🔧 Запуск Backend - Исправленная версия  
echo =====================================

cd /d "%~dp0backend"

echo 📦 Проверка node_modules...
if not exist "node_modules" (
    echo ⚠️ node_modules не найден, устанавливаем зависимости...
    npm install
)

echo 🔨 Сборка и запуск backend...
npm run start:dev

echo ✅ Backend запущен в режиме разработки
pause
