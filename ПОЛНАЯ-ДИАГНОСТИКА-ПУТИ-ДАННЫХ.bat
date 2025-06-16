@echo off
chcp 65001 >nul
echo ========================================
echo 🔍 ПОЛНАЯ ДИАГНОСТИКА ПУТИ ДАННЫХ
echo ========================================
echo.

echo 📋 ПУТЬ ДАННЫХ В МОДАЛЬНОМ ОКНЕ:
echo    1. ShiftForm.tsx → operationsApi.getAssignedToMachine(machineId)
echo    2. operationsApi.ts → GET /api/operations/assigned-to-machine/{machineId}
echo    3. operations-simple.controller.ts → getAssignedOperationByMachine()
echo    4. PostgreSQL → JOIN operations + orders
echo    5. Результат → assignedOperation в React state
echo    6. Отображение → блок "Информация об операции"
echo.

echo 🔍 ДИАГНОСТИКА КАЖДОГО ШАГА:
echo.

echo 1️⃣ Проверяем БД (шаг 4):
echo "Операции в БД:"
psql -h localhost -U postgres -d thewho -c "SELECT id, \"operationNumber\", \"operationType\", \"estimatedTime\", \"assignedMachine\", \"machineId\", status FROM operations;"
echo.
echo "Заказы в БД:"
psql -h localhost -U postgres -d thewho -c "SELECT id, COALESCE(drawing_number, \"drawingNumber\") as drawing, quantity, priority, deadline FROM orders;"
echo.

echo 2️⃣ Проверяем Backend API (шаг 3):
echo "API для станка 1:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/1" | jq .
echo.
echo "API для станка 2:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/2" | jq .
echo.
echo "API для станка 3:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/3" | jq .
echo.

echo 3️⃣ Проверяем SQL запрос контроллера:
echo "Тот же запрос что выполняет контроллер:"
psql -h localhost -U postgres -d thewho -c "
SELECT 
  op.id,
  op.\"operationNumber\",
  op.\"machineId\",
  op.operationtype as \"operationType\", 
  op.\"estimatedTime\",
  COALESCE(op.status, 'PENDING') as status,
  op.\"orderId\",
  op.machineaxes as \"machineAxes\",
  op.\"createdAt\",
  op.\"updatedAt\",
  ord.drawing_number as \"orderDrawingNumber\",
  ord.quantity as \"orderQuantity\",
  ord.priority as \"orderPriority\",
  ord.deadline as \"orderDeadline\",
  ord.\"workType\" as \"orderWorkType\"
FROM operations op
LEFT JOIN orders ord ON op.\"orderId\" = ord.id
WHERE op.\"assignedMachine\" = 1 
   OR op.\"machineId\" = 1
ORDER BY op.\"createdAt\" DESC 
LIMIT 1;
"
echo.

echo ========================================
echo 💡 АНАЛИЗ РЕЗУЛЬТАТОВ:
echo    ✅ Если БД пуста → API вернет "success": false
echo    ❌ Если в БД есть записи → API вернет тестовые данные
echo    🎯 Цель: Очистить БД от всех тестовых записей
echo ========================================

pause