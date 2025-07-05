@echo off
echo 🔥 Запуск backend с исправленной системой импорта Excel
echo 📁 Перехожу в папку backend...
cd /d "%~dp0backend"

echo 🛑 Останавливаем существующие процессы...
taskkill /F /IM node.exe /T >nul 2>&1

echo 🔄 Устанавливаем зависимости (если нужно)...
call npm install >nul 2>&1

echo 🚀 Запускаем backend с исправлениями...
call npm run start:dev

pause
