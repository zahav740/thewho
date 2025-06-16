@echo off
chcp 65001 >nul
echo ========================================
echo 🔍 ДИАГНОСТИКА API ОПЕРАЦИЙ (ПРОДАКШЕН)
echo ========================================
echo.

echo 1️⃣ Проверяем API здоровья операций...
curl -s "http://localhost:5100/api/operations" | jq . | head -20
echo.

echo 2️⃣ Проверяем активные операции...
curl -s "http://localhost:5100/api/operations?status=IN_PROGRESS" | jq .
echo.

echo 3️⃣ Проверяем назначенные операции по станкам...
echo "Станок 1:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/1" | jq .
echo.
echo "Станок 2:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/2" | jq .
echo.
echo "Станок 3:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/3" | jq .
echo.

echo 4️⃣ Проверяем данные в базе операций...
psql -h localhost -U postgres -d thewho -c "SELECT id, \"operationNumber\", \"operationType\", \"orderDrawingNumber\", \"machineId\", status FROM operations LIMIT 10;"
echo.

echo 5️⃣ Проверяем связь операций со станками...
psql -h localhost -U postgres -d thewho -c "SELECT o.id, o.\"operationNumber\", o.\"orderDrawingNumber\", m.\"machineName\", o.status FROM operations o LEFT JOIN machines m ON o.\"machineId\" = m.id WHERE o.status = 'IN_PROGRESS';"
echo.

echo ✅ Диагностика завершена!
echo 💡 Если видите тестовые данные, проблема в backend API операций
pause