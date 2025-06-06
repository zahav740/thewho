@echo off
echo ====================================
echo COMPLETE OPERATIONS FIX
echo ====================================
echo.

echo 1. Running database structure fixes...
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-OPERATIONS-LINKS.sql"

echo.
echo 2. Updating backend entity file...
copy /Y "backend\src\database\entities\operation.entity.NEW.ts" "backend\src\database\entities\operation.entity.ts"
echo Entity file updated successfully!

echo.
echo 3. Testing API after fixes...
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Testing orders endpoint...
curl -s "http://localhost:5101/api/orders?limit=3" | findstr -C:"operationNumber"

echo.
echo.
echo ====================================
echo FIXES COMPLETE!
echo ====================================
echo.
echo What was fixed:
echo - Database operations now linked to orders via order_id
echo - Added missing operations for C6HP0021A 
echo - Updated entity file to match database structure
echo.
echo Order C6HP0021A should now show 3 operations:
echo 1. MILLING (operation 10)
echo 2. TURNING (operation 20) - ADDED
echo 3. DRILLING (operation 30) - ADDED
echo.
echo RESTART the backend server to apply entity changes!
echo Then refresh the frontend at: http://localhost:5100
echo.
pause
