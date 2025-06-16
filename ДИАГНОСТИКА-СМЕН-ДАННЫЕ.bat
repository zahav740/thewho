@echo off
echo ===========================================
echo ДИАГНОСТИКА ДАННЫХ СМЕН
echo ===========================================
echo.

echo Проверяем backend...
cd backend
call npm run start:dev &

timeout /t 5

echo.
echo Тестируем API эндпоинты для смен...
curl -X GET "http://localhost:5100/shifts" -H "Content-Type: application/json" | python -m json.tool

echo.
echo Тестируем сегодняшние смены...
curl -X GET "http://localhost:5100/shifts?startDate=2025-06-11&endDate=2025-06-11" -H "Content-Type: application/json" | python -m json.tool

echo.
echo Тестируем API станков...
curl -X GET "http://localhost:5100/machines" -H "Content-Type: application/json" | python -m json.tool

echo.
echo ===========================================
echo ДИАГНОСТИКА ЗАВЕРШЕНА
echo ===========================================
pause
