@echo off
echo ========================================
echo ОЧИСТКА НЕНУЖНЫХ ТИПОВ ОПЕРАЦИЙ
echo ========================================

echo.
echo Этот скрипт удалит операции типа DRILLING и GRINDING из БД
echo и оставит только MILLING (фрезерные) и TURNING (токарные).
echo.

set /p confirm="Продолжить? (y/n): "
if /i "%confirm%" neq "y" goto :end

echo.
echo 1. Проверяем текущие типы операций...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT operationtype, COUNT(*) as count FROM operations GROUP BY operationtype ORDER BY count DESC\"}"

echo.
echo.
echo 2. Удаляем операции типа DRILLING...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"DELETE FROM operations WHERE operationtype = 'DRILLING'\"}"

echo.
echo.
echo 3. Удаляем операции типа GRINDING...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"DELETE FROM operations WHERE operationtype = 'GRINDING'\"}"

echo.
echo.
echo 4. Удаляем операции типа 'Сверление'...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"DELETE FROM operations WHERE LOWER(operationtype) LIKE '%%сверл%%'\"}"

echo.
echo.
echo 5. Удаляем операции типа 'Шлифовка'...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"DELETE FROM operations WHERE LOWER(operationtype) LIKE '%%шлиф%%'\"}"

echo.
echo.
echo 6. Проверяем результат после очистки...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT operationtype, COUNT(*) as count FROM operations GROUP BY operationtype ORDER BY count DESC\"}"

echo.
echo.
echo 7. Проверяем заказы без операций (после удаления)...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT o.id, o.drawing_number, COUNT(op.id) as operations_count FROM orders o LEFT JOIN operations op ON o.id = op.orderId GROUP BY o.id, o.drawing_number HAVING COUNT(op.id) = 0\"}"

echo.
echo.
echo ========================================
echo ОЧИСТКА ЗАВЕРШЕНА
echo ========================================
echo Теперь в системе остались только:
echo - MILLING (фрезерные операции)
echo - TURNING (токарные операции)
echo.
echo ВНИМАНИЕ: Если некоторые заказы остались без операций,
echo их нужно отредактировать и добавить операции заново.
echo ========================================

:end
pause
