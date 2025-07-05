@echo off
echo ========================================
echo   ИСПРАВЛЕННЫЕ ПОРТЫ - ЗАПУСК FRONTEND
echo ========================================
echo Frontend: http://localhost:5101
echo Backend API: http://localhost:5100/api
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo 🔧 Проверяем и устанавливаем зависимости...
call npm install

echo.
echo 🚀 Запускаем Frontend на порту 5101...
call npm run start

pause
