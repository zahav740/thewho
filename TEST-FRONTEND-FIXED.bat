@echo off
chcp 65001 > nul
echo.
echo 🎨 ЗАПУСК FRONTEND НА ПОРТУ 5101
echo ===============================
echo.

cd /d "%~dp0"

echo 📁 Переходим в frontend...
cd frontend

echo.
echo 🔍 Проверяем Node.js и npm...
node --version
npm --version

echo.
echo 📦 Устанавливаем зависимости (если нужно)...
call npm install

echo.
echo 🔧 КОНФИГУРАЦИЯ:
echo ✅ Порт frontend: 5101 (package.json)
echo ✅ Backend URL: http://localhost:5100/api
echo ✅ Excel импорт: колонка K приоритетна

echo.
echo 🚀 Запуск frontend на порту 5101...
echo 🌐 URL: http://localhost:5101
echo.

call npm run start

echo.
pause
