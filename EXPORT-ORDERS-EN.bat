@echo off
echo ================================================
echo EXPORT ORDERS TO FILESYSTEM
echo ================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo Checking folders structure...
if not exist "uploads\orders" (
    echo Creating uploads\orders folder...
    mkdir "uploads\orders"
)

echo.
echo Current filesystem state:
if exist "uploads\orders" (
    for /d %%d in ("uploads\orders\*") do (
        echo   Order: %%~nxd
        for /d %%v in ("%%d\*") do (
            echo     Version: %%~nxv
        )
    )
) else (
    echo   Orders folder does not exist
)

echo.
echo Running export via Node.js script...
echo.

:: Check Node.js availability
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js
    pause
    exit /b 1
)

:: Run export
node export-orders-to-filesystem.js export

echo.
echo Checking result:
if exist "uploads\orders" (
    for /d %%d in ("uploads\orders\*") do (
        echo   Order: %%~nxd
        for /d %%v in ("%%d\*") do (
            echo     Version: %%~nxv
            if exist "%%v\order.json" echo       - order.json OK
            if exist "%%v\operations\operations.json" echo       - operations.json OK
            if exist "%%v\metadata.json" echo       - metadata.json OK
        )
    )
)

echo.
echo Export completed!
pause
