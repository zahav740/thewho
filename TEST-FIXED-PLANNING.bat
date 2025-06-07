@echo off
echo ==============================================
echo ИСПРАВЛЕНИЕ И ТЕСТИРОВАНИЕ ПЛАНИРОВАНИЯ
echo ==============================================

echo.
echo 1. Проверка доступных станков...
curl -X GET "http://localhost:3001/api/machines" -H "accept: application/json"

echo.
echo.
echo 2. Запуск демо планирования...
curl -X POST "http://localhost:3001/api/planning/demo" -H "accept: application/json" -H "Content-Type: application/json"

echo.
echo.
echo 3. Получение последних результатов планирования...
curl -X GET "http://localhost:3001/api/planning/results/latest" -H "accept: application/json"

echo.
echo.
echo 4. Получение прогресса операций...
curl -X GET "http://localhost:3001/api/planning/progress" -H "accept: application/json"

echo.
echo.
echo ==============================================
echo ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ==============================================
pause
