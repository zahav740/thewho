@echo off
echo ========================================
echo ТЕСТИРОВАНИЕ API ОБНОВЛЕНИЯ СТАТУСА СТАНКОВ
echo ========================================

echo.
echo 1. Получаем все станки для проверки их текущего статуса...
curl -X GET "http://localhost:3000/api/machines" -H "Content-Type: application/json"

echo.
echo.
echo 2. Отмечаем станок F1 как занятый...
curl -X PUT "http://localhost:3000/api/machines/F1/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": false}"

echo.
echo.
echo 3. Проверяем изменение статуса F1...
curl -X GET "http://localhost:3000/api/machines/F1" -H "Content-Type: application/json"

echo.
echo.
echo 4. Освобождаем станок F1...
curl -X PUT "http://localhost:3000/api/machines/F1/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo.
echo 5. Проверяем что F1 снова доступен...
curl -X GET "http://localhost:3000/api/machines/F1" -H "Content-Type: application/json"

echo.
echo.
echo 6. Тестируем другие станки (F2, T1)...
echo Отмечаем F2 как занятый:
curl -X PUT "http://localhost:3000/api/machines/F2/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": false}"

echo.
echo.
echo Отмечаем T1 как занятый:
curl -X PUT "http://localhost:3000/api/machines/T1/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": false}"

echo.
echo.
echo 7. Получаем финальное состояние всех станков...
curl -X GET "http://localhost:3000/api/machines" -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ========================================
echo F1 должен быть доступен (isAvailable: true)
echo F2 должен быть занят (isAvailable: false)
echo T1 должен быть занят (isAvailable: false)
echo ========================================
pause
