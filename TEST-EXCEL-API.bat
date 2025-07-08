@echo off
echo ========================================
echo 🔍 ДИАГНОСТИКА API EXCEL IMPORT
echo ========================================

echo 1. Тестируем основной API заказов...
curl -X GET "http://localhost:5100/api/orders?page=1&limit=5" -H "Content-Type: application/json"

echo.
echo.
echo 2. Проверяем endpoint импорта Excel...
curl -X POST "http://localhost:5100/api/orders/upload-excel" -H "Content-Type: multipart/form-data"

echo.
echo.
echo 3. Проверяем enhanced контроллер...
curl -X GET "http://localhost:5100/api/enhanced-orders?page=1&limit=5" -H "Content-Type: application/json"

echo.
echo ========================================
echo Тест завершен
echo ========================================
pause
