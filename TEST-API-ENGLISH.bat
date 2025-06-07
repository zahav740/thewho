@echo off
echo ====================================
echo API TESTING SCRIPT
echo ====================================
echo.

echo Testing Backend API on port 5100...
echo.

echo 1. Health Check:
curl -s http://localhost:5100/api/health
echo.
echo.

echo 2. Calendar Test Endpoint:
curl -s http://localhost:5100/api/calendar/test
echo.
echo.

echo 3. Calendar Debug Info:
curl -s http://localhost:5100/api/calendar/debug
echo.
echo.

echo 4. Orders Endpoint:
curl -s http://localhost:5100/api/orders
echo.
echo.

echo 5. Machines Endpoint:
curl -s http://localhost:5100/api/machines
echo.
echo.

echo ====================================
echo API TESTING COMPLETE
echo ====================================
echo.
echo If all endpoints return JSON data or 200 OK responses,
echo the backend API is working correctly!
echo.
echo Frontend should be accessible at: http://localhost:5101
echo Backend API Docs available at: http://localhost:5100/api/docs
echo.
pause
