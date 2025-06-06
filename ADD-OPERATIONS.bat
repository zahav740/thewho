@echo off
echo ====================================
echo ADD OPERATIONS FOR C6HP0021A
echo ====================================
echo.

echo Adding missing operations for order C6HP0021A...
echo.

echo Running SQL script to add operations...
psql -h localhost -p 5432 -U postgres -d thewho -f "ADD-OPERATIONS-C6HP0021A.sql"

echo.
echo ====================================
echo OPERATIONS ADDED!
echo ====================================
echo.

echo Testing API to confirm operations...
echo.
curl -s "http://localhost:5101/api/orders?drawingNumber=C6HP0021A" | findstr "operationNumber"

echo.
echo.
echo Refresh your browser to see the changes!
echo Frontend: http://localhost:5100
echo.
echo Order C6HP0021A should now show 3 operations:
echo 1. MILLING (90 min, 3 axes)
echo 2. TURNING (75 min, 4 axes) 
echo 3. DRILLING (60 min, 3 axes)
echo.
pause
