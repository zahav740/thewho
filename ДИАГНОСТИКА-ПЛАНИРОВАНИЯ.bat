@echo off
echo ================================================
echo ДИАГНОСТИКА ПРОБЛЕМЫ ПЛАНИРОВАНИЯ
echo ================================================

echo.
echo 1. Тестирование API планирования...
curl -X POST "http://localhost:3001/api/planning/demo" -H "Content-Type: application/json"

echo.
echo.
echo 2. Проверка доступных станков...
curl -X GET "http://localhost:3001/api/machines" -H "accept: application/json"

echo.
echo.
echo 3. Проверка последних результатов планирования...
curl -X GET "http://localhost:3001/api/planning/results/latest" -H "accept: application/json"

echo.
echo.
echo ================================================
echo АНАЛИЗ ЛОГОВ BACKEND
echo ================================================
echo Проверьте логи backend на наличие:
echo - "Найдено X заказов с приоритетами"  
echo - "Найдено X первых операций"
echo - "Найдено X доступных станков"
echo - "Сопоставлено X операций со станками"
echo.
echo Если "Сопоставлено 0 операций" - проблема в логике сопоставления!
echo ================================================
pause
