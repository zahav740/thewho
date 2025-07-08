@echo off
echo ===============================================
echo 🧪 ТЕСТ ПРОСТОГО EXCEL КОНТРОЛЛЕРА
echo ===============================================

echo 1. Создание тестовых заказов...
curl -X POST "http://localhost:5100/api/excel-simple/create-test-orders" -H "Content-Type: application/json"

echo.
echo.
echo 2. Проверка созданных заказов...
curl -X GET "http://localhost:5100/api/orders?page=1&limit=5" -H "Content-Type: application/json"

echo.
echo.
echo 3. Тестирование endpoints Excel...
echo "   - Основной контроллер orders: /api/orders/upload-excel"
echo "   - Enhanced контроллер: /api/enhanced-orders/upload-excel-full"
echo "   - Простой тестовый: /api/excel-simple/test-upload"

echo.
echo ===============================================
echo Тест завершен
echo ===============================================
pause
