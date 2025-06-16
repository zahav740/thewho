@echo off
chcp 65001 >nul
echo ========================================
echo 🔍 ТОЧНАЯ ДИАГНОСТИКА ИСТОЧНИКА ТЕСТОВЫХ ДАННЫХ
echo ========================================
echo.

echo 1️⃣ Тестируем API операций по станкам:
echo.
echo "Станок 1:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/1" | jq .
echo.
echo "Станок 2:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/2" | jq .
echo.
echo "Станок 3:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/3" | jq .
echo.

echo 2️⃣ Проверяем таблицу operations:
psql -h localhost -U postgres -d thewho -c "SELECT id, \"operationNumber\", \"operationType\", \"estimatedTime\", \"assignedMachine\", \"machineId\", \"orderId\", status FROM operations LIMIT 10;"
echo.

echo 3️⃣ Проверяем таблицу orders:
psql -h localhost -U postgres -d thewho -c "SELECT id, drawing_number, \"drawingNumber\", quantity, priority, deadline, \"workType\" FROM orders LIMIT 10;"
echo.

echo 4️⃣ Проверяем соединение операций с заказами:
psql -h localhost -U postgres -d thewho -c "SELECT op.\"operationNumber\", op.\"operationType\", op.\"estimatedTime\", op.status, ord.drawing_number, ord.\"drawingNumber\", ord.quantity, ord.priority FROM operations op LEFT JOIN orders ord ON op.\"orderId\" = ord.id LIMIT 10;"
echo.

echo 5️⃣ Ищем все записи с TEST:
echo "Операции с TEST:"
psql -h localhost -U postgres -d thewho -c "SELECT * FROM operations WHERE \"operationType\" = 'MILLING' AND \"estimatedTime\" = 60;"
echo.
echo "Заказы с TEST:"
psql -h localhost -U postgres -d thewho -c "SELECT * FROM orders WHERE drawing_number LIKE '%TEST%' OR \"drawingNumber\" LIKE '%TEST%';"
echo.

echo ========================================
echo 💡 Если видите данные с C6HP0021A-TEST, то проблема в БД!
echo    Нужно удалить эти записи из таблиц operations и orders
echo ========================================

pause