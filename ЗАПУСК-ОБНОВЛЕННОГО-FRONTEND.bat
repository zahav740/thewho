@echo off
echo ========================================
echo 🎯 ЗАПУСК ОБНОВЛЕННОГО FRONTEND
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📦 Проверка зависимостей...
call npm install

echo 🧹 Очистка кэша...
call npm run build

echo 🚀 Запуск приложения...
call npm start

echo.
echo ✅ Frontend запущен на http://localhost:3000
echo 📅 Зайдите в раздел "Календарь" для проверки
echo.

pause
