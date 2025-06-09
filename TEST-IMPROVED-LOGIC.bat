@echo off
echo ========================================
echo ТЕСТИРОВАНИЕ ИСПРАВЛЕННОЙ ЛОГИКИ ПОИСКА ОПЕРАЦИЙ
echo ========================================

echo.
echo 1. Проверяем все заказы в системе...
curl -X GET "http://localhost:3000/api/orders" -H "Content-Type: application/json"

echo.
echo.
echo 2. Проверяем все операции в системе...
curl -X GET "http://localhost:3000/api/operations" -H "Content-Type: application/json"

echo.
echo.
echo 3. Тестируем новую логику поиска доступных операций...
curl -X GET "http://localhost:3000/api/planning/available-operations" -H "Content-Type: application/json"

echo.
echo.
echo 4. Проверяем доступные станки...
curl -X GET "http://localhost:3000/api/machines" -H "Content-Type: application/json"

echo.
echo.
echo 5. Тестируем демо планирование...
curl -X POST "http://localhost:3000/api/planning/demo" -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ========================================
pause
