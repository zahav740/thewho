@echo off
echo =====================================================
echo  ЗАПУСК BACKEND СЕРВЕРА С АУТЕНТИФИКАЦИЕЙ
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Установка зависимостей (если нужно)...
call npm install --silent

echo.
echo Запуск backend на порту 5100...
echo Backend API: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs
echo Health: http://localhost:5100/api/health
echo.

npm run start:dev
