@echo off
echo =====================================================
echo Тест API после исправления ошибки isDeleted
echo =====================================================

echo Тестируем endpoint GET /api/orders...
curl -X GET "http://localhost:5100/api/orders?page=1&limit=5" -H "Content-Type: application/json"

echo.
echo =====================================================
echo Тест завершен. Если видите JSON с данными - API работает!
echo =====================================================
pause
