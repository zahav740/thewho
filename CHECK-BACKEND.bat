@echo off
echo ======================================
echo ПРОВЕРКА И ЗАПУСК BACKEND
echo ======================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Установка зависимостей...
call npm install

echo Компиляция TypeScript...
call npm run build

echo Запуск в режиме разработки...
call npm run start:dev

pause
