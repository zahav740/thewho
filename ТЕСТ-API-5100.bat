@echo off
echo ====================================
echo ТЕСТИРОВАНИЕ API ENDPOINTS (5100)
echo ====================================
echo.

echo 1. Проверяем health endpoint...
curl -s http://localhost:5100/api/health
echo.
echo.

echo 2. Тестируем calendar endpoints...
echo.
echo Тест /api/calendar/test:
curl -s http://localhost:5100/api/calendar/test
echo.
echo.

echo Тест /api/calendar/debug:
curl -s http://localhost:5100/api/calendar/debug
echo.
echo.

echo Тест /api/calendar:
curl -s "http://localhost:5100/api/calendar?startDate=2025-06-01&endDate=2025-06-07"
echo.
echo.

echo 3. Тестируем orders endpoints...
echo.
echo Тест /api/orders:
curl -s http://localhost:5100/api/orders
echo.
echo.

echo 4. Проверяем машины...
echo.
echo Тест /api/machines:
curl -s http://localhost:5100/api/machines
echo.
echo.

echo ====================================
echo ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ====================================
echo.
echo Если все endpoints возвращают данные или 200 OK,
echo то сервер работает правильно!
echo.
echo Frontend должен быть доступен на: http://localhost:5101
echo Backend API доступен на: http://localhost:5100/api
echo.
pause
