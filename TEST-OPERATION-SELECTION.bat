@echo off
echo ========================================
echo ТЕСТИРОВАНИЕ ВЫБОРА ОПЕРАЦИЙ
echo ========================================

echo.
echo 1. Проверяем доступные операции...
curl -X GET "http://localhost:3000/api/planning/available-operations" -H "Content-Type: application/json"

echo.
echo.
echo 2. Проверяем доступные операции для конкретных станков...
curl -X GET "http://localhost:3000/api/planning/available-operations?machineIds=1,2" -H "Content-Type: application/json"

echo.
echo.
echo 3. Тестируем планирование с выбранными операциями...
curl -X POST "http://localhost:3000/api/planning/plan-selected" ^
-H "Content-Type: application/json" ^
-d "{\"selectedMachines\":[1,2],\"selectedOperations\":[{\"operationId\":1,\"machineId\":1}]}"

echo.
echo.
echo ========================================
echo ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ========================================
pause
