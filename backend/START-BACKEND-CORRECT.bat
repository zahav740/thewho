@echo off
echo =====================================================
echo  ЗАПУСК BACKEND СЕРВЕРА
echo =====================================================
echo.

cd /d "C:\Users\Alexey\Downloads\thewho-main\backend"

echo Проверка зависимостей...
if not exist node_modules (
    echo Установка зависимостей...
    call npm install
)

echo.
echo Компиляция TypeScript ошибок...
echo.

echo Запуск backend на порту 5100...
echo Backend API: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs  
echo Health: http://localhost:5100/api/health
echo.

npm run start:dev