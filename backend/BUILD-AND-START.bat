@echo off
echo =====================================================
echo  ПОЛНАЯ СБОРКА И ЗАПУСК BACKEND
echo =====================================================

cd /d "C:\Users\Alexey\Downloads\thewho-main\backend"

echo 1. Установка зависимостей...
call npm install

echo.
echo 2. Сборка TypeScript...
call npm run build

echo.
echo 3. Запуск производственной версии...
echo Backend API: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs
echo Health: http://localhost:5100/api/health
echo.

npm run start:prod