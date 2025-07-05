@echo off
chcp 65001 > nul
echo.
echo 🔧 ПРОВЕРКА ИСПРАВЛЕННОГО BACKEND НА ПОРТАХ 5100-5101
echo ================================================
echo.

cd /d "%~dp0"

echo 📁 Переходим в backend...
cd backend

echo.
echo 🔍 Проверяем Node.js и npm...
node --version
npm --version

echo.
echo 📦 Устанавливаем зависимости (если нужно)...
call npm install

echo.
echo 🔧 ИСПРАВЛЕНИЯ:
echo ✅ orders.controller.ts: импорт типов Express исправлен
echo ✅ Порт backend: 5100 (main.ts)
echo ✅ Порт frontend: 5101 (package.json)
echo ✅ Колонка K приоритетна над J (excel-parser.service.ts)

echo.
echo 🚀 Запуск backend на порту 5100...
echo.

npx ts-node --transpile-only src/main.ts

echo.
echo ⚠️ Если есть ошибки, проверьте лог выше.
pause
