@echo off
echo ====================================
echo TESTING EXCEL IMPORT SYSTEM
echo ====================================

echo.
echo [1/5] Checking backend status...
curl -s http://localhost:5100/api/health | findstr "status" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not running. Please start backend first.
    echo Run: START-BACKEND.bat
    pause
    exit /b 1
)

echo.
echo [2/5] Testing database connection...
curl -s http://localhost:5100/api/excel-import-db/database-schema/orders | findstr "table" >nul
if %errorlevel% equ 0 (
    echo ✅ Database connection OK
) else (
    echo ❌ Database connection failed
    pause
    exit /b 1
)

echo.
echo [3/5] Testing Excel import endpoint...
curl -s http://localhost:5100/api/excel-import-db/imports | findstr "imports" >nul
if %errorlevel% equ 0 (
    echo ✅ Excel import API is working
) else (
    echo ❌ Excel import API is not working
    pause
    exit /b 1
)

echo.
echo [4/5] Checking filters...
curl -s http://localhost:5100/api/excel-import-db/filters | findstr -i "заказы\|orders" >nul
if %errorlevel% equ 0 (
    echo ✅ Import filters are configured
) else (
    echo ⚠️ Import filters may not be configured properly
)

echo.
echo [5/5] Testing file upload directory...
if exist "backend\uploads\excel" (
    echo ✅ Upload directory exists
) else (
    echo ❌ Upload directory missing
    mkdir backend\uploads\excel
    echo ✅ Created upload directory
)

echo.
echo ====================================
echo EXCEL IMPORT SYSTEM STATUS: READY ✅
echo ====================================
echo.
echo Available features:
echo 🎯 Interactive Column Mapper - /database page
echo 📋 Import History - /database page  
echo 🗼 Full Import Manager - /database page
echo ⚙️ Filter Manager - /database page
echo.
echo Test files location: ./test_*.xlsx
echo Frontend URL: http://localhost:3000/database
echo API docs: http://localhost:5100/api/excel-import-db
echo.
pause
