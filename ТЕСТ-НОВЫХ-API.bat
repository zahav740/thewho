@echo off
echo ===========================================
echo   ТЕСТИРОВАНИЕ НОВЫХ API ENDPOINTS
echo ===========================================
echo.

echo Тестируем завершение операций...
curl -X GET "http://localhost:5100/operations/completed-check" -H "Content-Type: application/json"
echo.
echo.

echo Тестируем метрики прогресса...
curl -X GET "http://localhost:5100/progress/metrics" -H "Content-Type: application/json"
echo.
echo.

echo Тестируем активные операции...
curl -X GET "http://localhost:5100/progress/active-operations" -H "Content-Type: application/json"
echo.
echo.

echo Тестируем дашборд...
curl -X GET "http://localhost:5100/progress/dashboard" -H "Content-Type: application/json"
echo.
echo.

echo Тестируем проверку конкретной операции (ID=1)...
curl -X GET "http://localhost:5100/operations/completion/check/1" -H "Content-Type: application/json"
echo.
echo.

echo Тестируем проверку всех активных операций...
curl -X GET "http://localhost:5100/operations/completion/check-all-active" -H "Content-Type: application/json"
echo.
echo.

echo ===========================================
echo            ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ===========================================
pause
