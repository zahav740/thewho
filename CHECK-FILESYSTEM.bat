@echo off
echo ========================================
echo CHECKING ORDERS FILESYSTEM STRUCTURE
echo ========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo Current working directory: %cd%
echo.

echo Checking uploads directory...
if exist "uploads" (
    echo SUCCESS: uploads directory exists
    echo Contents of uploads:
    dir /b uploads
    echo.
    
    if exist "uploads\orders" (
        echo SUCCESS: uploads\orders directory exists
        echo Contents of uploads\orders:
        dir /b uploads\orders
        echo.
        
        echo Detailed structure:
        for /d %%d in ("uploads\orders\*") do (
            echo   Order folder: %%~nxd
            for /d %%v in ("%%d\*") do (
                echo     Version: %%~nxv
                if exist "%%v\order.json" echo       - order.json found
                if exist "%%v\metadata.json" echo       - metadata.json found
                if exist "%%v\operations\operations.json" echo       - operations\operations.json found
            )
        )
    ) else (
        echo ERROR: uploads\orders directory not found
    )
) else (
    echo ERROR: uploads directory not found
)

echo.
echo ========================================
echo TESTING API CALL
echo ========================================
echo.

echo Calling filesystem API...
curl -s http://localhost:5100/api/filesystem/orders

echo.
echo.
echo Check completed!
pause
