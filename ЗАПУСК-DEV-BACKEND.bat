@echo off
echo ========================================
echo 🛠️ ЗАПУСК BACKEND В РЕЖИМЕ РАЗРАБОТКИ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 📦 Проверка зависимостей...
call npm install

echo 🔄 Запуск в dev режиме с автоперезагрузкой...
call npm run start:dev

pause
