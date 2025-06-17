@echo off
echo ========================================
echo 🚀 ПЕРЕЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ 
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 📦 Установка зависимостей...
call npm install

echo 🔧 Компиляция TypeScript...
call npm run build

echo 🌟 Запуск backend в production режиме...
call npm run start:prod

pause
