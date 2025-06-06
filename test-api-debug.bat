@echo off
echo Тестирование API endpoints...
echo.

echo 1. Проверка health:
curl -s "http://localhost:3000/health"
echo.
echo.

echo 2. Проверка calendar test:
curl -s "http://localhost:3000/api/calendar/test"
echo.
echo.

echo 3. Проверка calendar debug:
curl -s "http://localhost:3000/api/calendar/debug"
echo.
echo.

echo 4. Проверка упрощенного календаря:
curl -s "http://localhost:3000/api/calendar?startDate=2025-05-26&endDate=2025-06-08"
echo.
echo.

echo 5. Проверка дедлайнов:
curl -s "http://localhost:3000/api/calendar/upcoming-deadlines?days=14"
echo.
echo.

echo 6. Проверка загруженности станков:
curl -s "http://localhost:3000/api/calendar/machine-utilization?startDate=2025-05-26&endDate=2025-06-08"
echo.
echo.

echo 7. Проверка заказов:
curl -s "http://localhost:3000/api/orders?page=1&limit=5"
echo.
echo.

pause
