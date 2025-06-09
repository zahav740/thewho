@echo off
echo ========================================
echo СБРОС ВСЕХ СТАНКОВ В ДОСТУПНОЕ СОСТОЯНИЕ
echo ========================================

echo.
echo Этот скрипт освободит все станки (установит isAvailable = true)
echo.

set /p confirm="Продолжить? (y/n): "
if /i "%confirm%" neq "y" goto :end

echo.
echo Освобождаем все станки...

echo 1. Освобождаем F1...
curl -X PUT "http://localhost:3000/api/machines/F1/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 2. Освобождаем F2...
curl -X PUT "http://localhost:3000/api/machines/F2/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 3. Освобождаем F3...
curl -X PUT "http://localhost:3000/api/machines/F3/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 4. Освобождаем F4...
curl -X PUT "http://localhost:3000/api/machines/F4/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 5. Освобождаем T1...
curl -X PUT "http://localhost:3000/api/machines/T1/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 6. Освобождаем T2...
curl -X PUT "http://localhost:3000/api/machines/T2/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 7. Освобождаем T3...
curl -X PUT "http://localhost:3000/api/machines/T3/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo 8. Освобождаем T4...
curl -X PUT "http://localhost:3000/api/machines/T4/availability" ^
-H "Content-Type: application/json" ^
-d "{\"isAvailable\": true}"

echo.
echo.
echo 9. Проверяем результат...
curl -X GET "http://localhost:3000/api/machines" -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo ВСЕ СТАНКИ ОСВОБОЖДЕНЫ!
echo ========================================
echo Теперь все станки должны показывать isAvailable: true
echo и кнопки "Отметить как занятый" должны работать корректно.
echo ========================================

:end
pause
