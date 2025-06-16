@echo off
chcp 65001 >nul
echo ========================================
echo 🔍 ДИАГНОСТИКА ТЕСТОВЫХ ДАННЫХ В БД
echo ========================================
echo.

echo 1️⃣ Проверяем операции в базе данных...
psql -h localhost -U postgres -d thewho -c "SELECT id, \"operationNumber\", \"operationType\", \"estimatedTime\", \"machineId\", \"assignedMachine\", status FROM operations LIMIT 10;"
echo.

echo 2️⃣ Проверяем заказы в базе данных...
psql -h localhost -U postgres -d thewho -c "SELECT id, drawing_number, quantity, priority, deadline, \"workType\" FROM orders LIMIT 5;"
echo.

echo 3️⃣ Проверяем соединение операций с заказами...
psql -h localhost -U postgres -d thewho -c "SELECT op.\"operationNumber\", ord.drawing_number as drawing, ord.quantity, ord.priority FROM operations op LEFT JOIN orders ord ON op.\"orderId\" = ord.id LIMIT 5;"
echo.

echo 4️⃣ Тестируем API назначенных операций...
echo "Станок 1:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/1" | jq .
echo.
echo "Станок 2:"  
curl -s "http://localhost:5100/api/operations/assigned-to-machine/2" | jq .
echo.
echo "Станок 3:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/3" | jq .
echo.

echo 5️⃣ Проверяем есть ли станки в БД...
psql -h localhost -U postgres -d thewho -c "SELECT id, \"machineName\", \"machineType\" FROM machines LIMIT 5;"
echo.

echo ========================================
echo 💡 ВОЗМОЖНЫЕ ПРИЧИНЫ ТЕСТОВЫХ ДАННЫХ:
echo    1. В таблице operations есть тестовые записи
echo    2. В таблице orders есть тестовые записи  
echo    3. Некорректная связь операций со станками
echo    4. Frontend кэширует старые данные
echo ========================================
pause