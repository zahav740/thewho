@echo off
echo ========================================
echo ПРОСТОЙ ТЕСТ ПЛАНИРОВАНИЯ
echo ========================================

echo.
echo Тестируем каждый шаг планирования отдельно...
echo.

echo 1. ТЕСТИРУЕМ API доступных операций (БЕЗ фильтра станков)...
echo.
curl -X GET "http://localhost:3000/api/planning/available-operations" ^
-H "Content-Type: application/json"

echo.
echo.
echo 2. ТЕСТИРУЕМ API доступных операций (С фильтром станков 1,2)...
echo.
curl -X GET "http://localhost:3000/api/planning/available-operations?machineIds=1,2" ^
-H "Content-Type: application/json"

echo.
echo.
echo 3. ТЕСТИРУЕМ демо планирование...
echo.
curl -X POST "http://localhost:3000/api/planning/demo" ^
-H "Content-Type: application/json"

echo.
echo.
echo 4. ПРЯМОЙ ЗАПРОС к базе: все заказы...
echo.
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, drawing_number, priority FROM orders ORDER BY priority LIMIT 5\"}"

echo.
echo.
echo 5. ПРЯМОЙ ЗАПРОС к базе: все операции...
echo.
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, orderId, operationNumber, operationtype, status FROM operations ORDER BY orderId, operationNumber LIMIT 10\"}"

echo.
echo.
echo 6. ПРЯМОЙ ЗАПРОС к базе: операции со статусом PENDING...
echo.
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, orderId, operationNumber, operationtype, status FROM operations WHERE status IS NULL OR status = 'PENDING' LIMIT 10\"}"

echo.
echo.
echo ========================================
echo АНАЛИЗИРУЙТЕ РЕЗУЛЬТАТЫ:
echo ========================================
echo.
echo - Если API available-operations возвращает пустой массив:
echo   Проблема в логике поиска операций
echo.
echo - Если есть заказы, но нет операций:
echo   Нужно создать операции для заказов
echo.
echo - Если есть операции, но они не находятся:
echo   Проблема в фильтрации или статусах операций
echo.
echo - Если операции есть, но нет станков:
echo   Проблема в сопоставлении типов операций со станками
echo.
pause
