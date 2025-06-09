@echo off
echo =====================================
echo ЗАПУСК BACKEND PRODUCTION CRM
echo =====================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo ✅ Переходим в директорию backend...
echo Текущая директория: %CD%

echo.
echo 🔧 Установка зависимостей...
call npm install

echo.
echo 🏗️ Сборка проекта...
call npm run build

echo.
echo 🚀 Запуск production сервера...
echo Сервер будет доступен на порту 5100
echo Backend API: http://localhost:5100
echo.

call npm run start:prod

pause
