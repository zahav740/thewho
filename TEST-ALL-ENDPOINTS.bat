@echo off
echo ====================================
echo TESTING ALL API ENDPOINTS (5100)
echo ====================================
echo.

echo 1. Health check...
curl -s http://localhost:5100/api/health
echo.
echo.

echo 2. Calendar endpoints...
echo Testing /api/calendar/test:
curl -s http://localhost:5100/api/calendar/test
echo.
echo.

echo 3. Orders endpoints...
echo Testing /api/orders (limit 1):
curl -s "http://localhost:5100/api/orders?limit=1"
echo.
echo.

echo 4. Machines endpoints...
echo Testing /api/machines:
curl -s http://localhost:5100/api/machines
echo.
echo.

echo 5. Operations endpoints...
echo Testing /api/operations/test:
curl -s http://localhost:5100/api/operations/test
echo.
echo.

echo Testing /api/operations (with status filter):
curl -s "http://localhost:5100/api/operations?status=IN_PROGRESS"
echo.
echo.

echo Testing /api/operations (all):
curl -s http://localhost:5100/api/operations
echo.
echo.

echo 6. Planning endpoints...
echo Testing /api/planning/demo:
curl -s -X POST http://localhost:5100/api/planning/demo
echo.
echo.

echo Testing /api/planning/results/latest:
curl -s http://localhost:5100/api/planning/results/latest
echo.
echo.

echo 7. Shifts endpoints...
echo Testing /api/shifts:
curl -s http://localhost:5100/api/shifts
echo.
echo.

echo ====================================
echo ALL ENDPOINTS TESTED
echo ====================================
echo.
echo ✅ If you see JSON responses, the APIs are working!
echo ❌ If you see 404 errors, check backend logs
echo.
echo Frontend: http://localhost:5101
echo Backend API: http://localhost:5100/api
echo Swagger Docs: http://localhost:5100/api/docs
echo.
pause
