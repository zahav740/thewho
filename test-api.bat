@echo off
echo Testing API endpoints...
echo.

echo Testing health endpoint:
curl -s http://localhost:3000/health
echo.
echo.

echo Testing orders endpoint:
curl -s http://localhost:3000/api/orders
echo.
echo.

echo Testing calendar endpoint:
curl -s http://localhost:3000/api/calendar?startDate=2025-05-26^&endDate=2025-06-08
echo.
echo.

pause
