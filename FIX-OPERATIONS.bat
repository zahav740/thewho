@echo off
echo ====================================
echo FIX DATABASE OPERATIONS
echo ====================================
echo.

echo Fixing database structure for operations...
echo.

echo 1. Testing PostgreSQL connection...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Connection successful!' as status;" 2>nul
if %errorlevel% neq 0 (
    echo Cannot connect to database
    echo Check that PostgreSQL is running and database 'thewho' exists
    pause
    exit /b 1
)

echo Connection successful!
echo.

echo 2. Running database structure fixes...
psql -h localhost -p 5432 -U postgres -d thewho -f "ИСПРАВИТЬ-СТРУКТУРУ-БД.sql"

echo.
echo 3. Updating entity file...
if exist "backend\src\database\entities\operation.entity.FIXED.ts" (
    copy /Y "backend\src\database\entities\operation.entity.FIXED.ts" "backend\src\database\entities\operation.entity.ts"
    echo Entity file updated
) else (
    echo Warning: Fixed entity file not found
)

echo.
echo 4. Checking operations for C6HP0021A...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Order: ' || o.drawing_number as info, 'Operations: ' || COUNT(op.id) as count FROM orders o LEFT JOIN operations op ON o.id = op.order_id WHERE o.drawing_number = 'C6HP0021A' GROUP BY o.drawing_number;"

echo.
echo ====================================
echo FIXES COMPLETE!
echo ====================================
echo.
echo Now restart the backend server to apply changes:
echo 1. Stop current backend (Ctrl+C)
echo 2. Run: npm run start:dev
echo.
echo Order C6HP0021A should now show 3 operations!
echo.
pause
