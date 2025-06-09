@echo off
echo ========================================
echo ДИАГНОСТИКА ТИПОВ ОПЕРАЦИЙ В БД
echo ========================================

echo.
echo 1. Проверяем все уникальные типы операций в БД...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT DISTINCT operationtype, COUNT(*) as count FROM operations GROUP BY operationtype ORDER BY count DESC\"}"

echo.
echo.
echo 2. Проверяем все типы станков...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT DISTINCT type, COUNT(*) as count FROM machines GROUP BY type ORDER BY count DESC\"}"

echo.
echo.
echo 3. Проверяем операции для видимых заказов...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT o.id, o.drawing_number, op.operationtype, op.status FROM orders o LEFT JOIN operations op ON o.id = op.orderId ORDER BY o.id\"}"

echo.
echo.
echo ========================================
echo ДИАГНОСТИКА ЗАВЕРШЕНА
echo ========================================
pause
