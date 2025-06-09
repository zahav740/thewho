@echo off
echo ========================================
echo КРИТИЧЕСКАЯ ДИАГНОСТИКА: НЕ НАХОДИТ ОПЕРАЦИИ
echo ========================================

echo.
echo Система показывает "Нет операций для планирования"
echo Проверяем по шагам что происходит...
echo.

echo 1. Проверяем есть ли заказы в БД...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, drawing_number, priority, deadline FROM orders ORDER BY priority ASC LIMIT 10\"}"

echo.
echo.
echo 2. Проверяем есть ли операции в БД...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT o.id, o.orderId, o.operationNumber, o.operationtype, o.status, ord.drawing_number FROM operations o JOIN orders ord ON o.orderId = ord.id ORDER BY o.orderId, o.operationNumber LIMIT 10\"}"

echo.
echo.
echo 3. Проверяем станок Doosan Hadasha...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, code, type, axes, isActive, isOccupied FROM machines WHERE code LIKE '%%Doosan%%' OR code LIKE '%%Hadasha%%'\"}"

echo.
echo.
echo 4. Проверяем все станки...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, code, type, axes, isActive, isOccupied FROM machines ORDER BY id\"}"

echo.
echo.
echo 5. Ищем операции для первых 3 заказов...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT ord.id, ord.drawing_number, ord.priority, COUNT(op.id) as operations_count FROM orders ord LEFT JOIN operations op ON ord.id = op.orderId WHERE ord.id <= 3 GROUP BY ord.id, ord.drawing_number, ord.priority ORDER BY ord.id\"}"

echo.
echo.
echo 6. Проверяем первые операции заказов...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT o.orderId, ord.drawing_number, o.operationNumber, o.operationtype, o.status FROM operations o JOIN orders ord ON o.orderId = ord.id WHERE o.operationNumber = 1 ORDER BY o.orderId LIMIT 10\"}"

echo.
echo.
echo 7. Тестируем API доступных операций...
curl -X GET "http://localhost:3000/api/planning/available-operations" -H "Content-Type: application/json"

echo.
echo.
echo 8. Проверяем логи backend...
echo Посмотрите в консоль backend на подробные логи!
echo.

echo ========================================
echo ДИАГНОСТИКА ЗАВЕРШЕНА
echo ========================================
echo.
echo СЛЕДУЮЩИЕ ШАГИ:
echo 1. Проверьте результаты выше
echo 2. Если заказов/операций нет - создайте тестовые данные
echo 3. Если есть - проверьте логи backend для понимания проблемы
echo 4. Запустите FULL-DIAGNOSIS.bat для расширенной диагностики
echo.
pause
