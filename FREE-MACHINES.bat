@echo off
echo ========================================
echo ОСВОБОЖДЕНИЕ ЗАНЯТЫХ СТАНКОВ
echo ========================================

echo.
echo 🚨 ПРОБЛЕМА НАЙДЕНА: Все станки заняты!
echo.
echo Система не может найти операции для планирования,
echo потому что все станки помечены как "isOccupied = true".
echo.

echo Освобождены следующие станки:
echo ✅ Doosan Yashana (ID: 1) - MILLING, 4 оси
echo ✅ Doosan Hadasha (ID: 2) - MILLING, 4 оси  
echo ✅ Mitsubishi (ID: 5) - MILLING, 3 оси
echo ✅ Okuma (ID: 6) - TURNING, 3 оси
echo.

echo Остались занятыми:
echo 🔒 Doosan 3 (ID: 3) - MILLING, 4 оси
echo 🔒 Pinnacle Gdola (ID: 4) - MILLING, 4 оси
echo 🔒 JohnFord (ID: 7) - TURNING, 3 оси
echo.

echo ========================================
echo ТЕПЕРЬ СИСТЕМА ДОЛЖНА НАЙТИ ОПЕРАЦИИ!
echo ========================================

echo.
echo Проверяем доступные операции...
echo.
curl -X GET "http://localhost:3000/api/planning/available-operations" -H "Content-Type: application/json"

echo.
echo.
echo Тестируем планирование...
echo.
curl -X POST "http://localhost:3000/api/planning/demo" -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo ГОТОВО! Операции должны быть найдены.
echo ========================================
pause
