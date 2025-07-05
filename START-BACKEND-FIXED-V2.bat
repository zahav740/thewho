@echo off
echo ====================================
echo ЗАПУСК ИСПРАВЛЕННОГО BACKEND V2
echo ====================================

cd /d "%~dp0\backend"

echo Проверяем зависимости...
if not exist "node_modules" (
    echo Устанавливаем зависимости...
    call npm install
)

echo.
echo Запускаем backend на порте 5100...
echo API будет доступен на: http://localhost:5100/api
echo Swagger документация: http://localhost:5100/api/docs
echo Эндпоинт Excel импорта: http://localhost:5100/api/v2/orders/parse-excel
echo.

set NODE_ENV=development
set PORT=5100

call npm run start:dev

pause
