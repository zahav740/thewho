@echo off
echo ========================================
echo ДИАГНОСТИКА EXCEL API
echo ========================================
echo.

echo 🔍 Проверяем доступность API для Excel импорта...
echo.

echo 📡 Тестируем эндпоинт /v2/orders/parse-excel
curl -X GET http://localhost:5100/api/v2/orders/parse-excel

echo.
echo.

echo 📡 Тестируем альтернативный эндпоинт /orders/parse-excel  
curl -X GET http://localhost:5100/api/orders/parse-excel

echo.
echo.

echo 📡 Проверяем общий статус API
curl -X GET http://localhost:5100/api/health

echo.
echo.

echo 📡 Проверяем доступные маршруты
curl -X GET http://localhost:5100/api/

echo.
echo.
pause
