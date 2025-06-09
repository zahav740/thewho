@echo off
setlocal enabledelayedexpansion

echo ====================================
echo CLEAR DATABASE AND IMPORT EXCEL
echo ====================================
echo VERSION: PRODUCTION
echo DATE: %date% %time%
echo.

echo 🔍 CURRENT DATABASE STATE:
echo.

REM Check current state
echo 1. Checking existing orders...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT id, drawing_number, quantity, deadline FROM orders ORDER BY id;"

echo.
echo ⚠️  WARNING: Current data in database:
echo - TH1K4108A (110 pcs)
echo - C6HP0021A (30 pcs)  
echo - G63828A (20 pcs)
echo.

set /p confirm="❓ Do you want to DELETE all existing orders? (y/N): "
if /i "!confirm!" neq "y" (
    echo ❌ Operation cancelled by user
    pause
    exit /b 0
)

echo.
echo 🗑️  CLEARING DATABASE...
echo.

REM Delete all orders and operations
echo 2. Deleting all operations...
psql -h localhost -p 5432 -U postgres -d thewho -c "DELETE FROM operations;"

echo 3. Deleting all orders...
psql -h localhost -p 5432 -U postgres -d thewho -c "DELETE FROM orders;"

echo 4. Resetting ID counters...
psql -h localhost -p 5432 -U postgres -d thewho -c "ALTER SEQUENCE orders_id_seq RESTART WITH 1;"
psql -h localhost -p 5432 -U postgres -d thewho -c "ALTER SEQUENCE operations_id_seq RESTART WITH 1;"

echo ✅ Database cleared!
echo.

echo 📋 IMPORT INSTRUCTIONS:
echo.
echo 1. Open browser: http://localhost:5101
echo 2. Go to "Database" section
echo 3. Click "Import Excel"
echo 4. Select your REAL Excel file with orders
echo 5. Wait for import completion
echo.

echo 📝 EXCEL FILE FORMAT:
echo Columns should be in this order:
echo A: Drawing Number (e.g.: DWG-12345)
echo B: Quantity (number)
echo C: Deadline (date DD.MM.YYYY)
echo D: Priority (1-high, 2-medium, 3-low)
echo E: Work Type (text)
echo F+: Operations (number, type, axes, time)
echo.

echo 🔗 USEFUL LINKS:
echo - Main page: http://localhost:5101
echo - Database: http://localhost:5101/database
echo - API docs: http://localhost:5100/api/docs
echo - API check: http://localhost:5100/api/health
echo.

echo 🎯 CHECK RESULT:
echo After import, refresh the page (F5) in browser
echo and make sure YOUR data from Excel file is displayed.
echo.

pause

echo 🔍 FINAL DATABASE CHECK:
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total_orders FROM orders;"
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total_operations FROM operations;"

echo.
echo ✅ DONE! Now you can import your REAL Excel file.
pause
