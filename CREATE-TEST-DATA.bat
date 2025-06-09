@echo off
echo ========================================
echo СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ ДЛЯ ПЛАНИРОВАНИЯ
echo ========================================

echo.
echo Этот скрипт создаст тестовые заказы и операции
echo для проверки работы системы планирования.
echo.

set /p confirm="Создать тестовые данные? (y/n): "
if /i "%confirm%" neq "y" goto :end

echo.
echo 1. Создаем тестовый заказ №1 (приоритет 1)...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"INSERT INTO orders (drawing_number, priority, quantity, deadline, workType) VALUES ('TEST-001', 1, 10, '2025-06-15', 'Фрезерная обработка') ON CONFLICT (drawing_number) DO NOTHING\"}"

echo.
echo 2. Создаем тестовый заказ №2 (приоритет 2)...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"INSERT INTO orders (drawing_number, priority, quantity, deadline, workType) VALUES ('TEST-002', 2, 5, '2025-06-20', 'Токарная обработка') ON CONFLICT (drawing_number) DO NOTHING\"}"

echo.
echo 3. Создаем тестовый заказ №3 (приоритет 3)...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"INSERT INTO orders (drawing_number, priority, quantity, deadline, workType) VALUES ('TEST-003', 3, 15, '2025-06-25', 'Комбинированная обработка') ON CONFLICT (drawing_number) DO NOTHING\"}"

echo.
echo 4. Получаем ID созданных заказов...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT id, drawing_number FROM orders WHERE drawing_number LIKE 'TEST-%%' ORDER BY id\"}"

echo.
echo 5. Создаем операцию для TEST-001 (фрезерная)...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"INSERT INTO operations (orderId, operationNumber, operationtype, estimatedTime, machineaxes) SELECT o.id, 1, 'MILLING', 120, 3 FROM orders o WHERE o.drawing_number = 'TEST-001' ON CONFLICT DO NOTHING\"}"

echo.
echo 6. Создаем операцию для TEST-002 (токарная)...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"INSERT INTO operations (orderId, operationNumber, operationtype, estimatedTime, machineaxes) SELECT o.id, 1, 'TURNING', 90, 3 FROM orders o WHERE o.drawing_number = 'TEST-002' ON CONFLICT DO NOTHING\"}"

echo.
echo 7. Создаем операцию для TEST-003 (фрезерная)...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"INSERT INTO operations (orderId, operationNumber, operationtype, estimatedTime, machineaxes) SELECT o.id, 1, 'MILLING', 150, 4 FROM orders o WHERE o.drawing_number = 'TEST-003' ON CONFLICT DO NOTHING\"}"

echo.
echo 8. Проверяем созданные данные...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT ord.drawing_number, ord.priority, op.operationtype, op.estimatedTime FROM orders ord JOIN operations op ON ord.id = op.orderId WHERE ord.drawing_number LIKE 'TEST-%%' ORDER BY ord.priority\"}"

echo.
echo 9. Тестируем поиск операций после создания данных...
curl -X GET "http://localhost:3000/api/planning/available-operations" -H "Content-Type: application/json"

echo.
echo 10. Тестируем демо планирование...
curl -X POST "http://localhost:3000/api/planning/demo" -H "Content-Type: application/json"

echo.
echo ========================================
echo ТЕСТОВЫЕ ДАННЫЕ СОЗДАНЫ
echo ========================================
echo.
echo Созданы тестовые заказы:
echo - TEST-001 (приоритет 1, фрезерная операция)
echo - TEST-002 (приоритет 2, токарная операция)
echo - TEST-003 (приоритет 3, фрезерная 4-осевая)
echo.
echo Теперь система должна найти операции для планирования!
echo.

:end
pause
