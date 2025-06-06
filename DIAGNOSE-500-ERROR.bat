@echo off
echo ====================================
echo BACKEND ERROR DIAGNOSIS
echo ====================================
echo.

echo Checking backend server status...
curl -s http://localhost:5101/api/health
echo.

echo.
echo Testing simple endpoints...
echo.

echo Health check:
curl -s -w "Status: %%{http_code}" http://localhost:5101/api/health
echo.
echo.

echo Calendar test:
curl -s -w "Status: %%{http_code}" http://localhost:5101/api/calendar/test
echo.
echo.

echo Orders endpoint (causing 500):
curl -s -w "Status: %%{http_code}" http://localhost:5101/api/orders?limit=1
echo.
echo.

echo ====================================
echo BACKEND LOGS CHECK
echo ====================================
echo.
echo Check the backend server window for error details.
echo Look for TypeORM errors, entity issues, or database connection problems.
echo.
echo Common issues after entity changes:
echo 1. TypeORM cannot find entity fields
echo 2. Database connection errors
echo 3. Entity field mismatch with database
echo.
echo If backend shows errors, we need to fix the entity or database structure.
echo.
pause
