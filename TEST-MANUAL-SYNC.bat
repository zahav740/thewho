@echo off
echo ========================================
echo 🔄 ТЕСТИРОВАНИЕ РУЧНОЙ СИНХРОНИЗАЦИИ
echo ========================================
echo.

echo 📊 Тест 1: Проверка работоспособности системы синхронизации
curl -X GET "http://localhost:5100/api/sync/health" -H "Content-Type: application/json"
echo.
echo.

echo 🔄 Тест 2: Принудительная синхронизация всех операций
curl -X POST "http://localhost:5100/api/sync/sync-all" -H "Content-Type: application/json"
echo.
echo.

echo 📊 Тест 3: Получение статуса синхронизации операции 40
curl -X GET "http://localhost:5100/api/sync/status/40" -H "Content-Type: application/json"
echo.
echo.

echo 📊 Тест 4: Обновление прогресса операции 40
curl -X POST "http://localhost:5100/api/sync/update-progress/40" -H "Content-Type: application/json"
echo.
echo.

echo 📊 Тест 5: Получение статуса синхронизации операции 37
curl -X GET "http://localhost:5100/api/sync/status/37" -H "Content-Type: application/json"
echo.
echo.

echo 🎯 Тест 6: Назначение новой операции с синхронизацией
curl -X POST "http://localhost:5100/api/sync/assign-operation" ^
  -H "Content-Type: application/json" ^
  -d "{\"operationId\": 113, \"machineId\": 5}"
echo.
echo.

echo ========================================
echo ✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ========================================
pause
