@echo off
echo ========================================
echo ORDERS FILESYSTEM API TEST
echo ========================================
echo.

set SERVER_URL=http://localhost:5100

echo Checking backend availability...
curl -s %SERVER_URL%/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend not available on %SERVER_URL%
    echo Try port 5101...
    set SERVER_URL=http://localhost:5101
    curl -s %SERVER_URL%/api/health >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Backend not available on 5101 either
        echo Please start backend with: START-BACKEND-ONLY.bat
        pause
        exit /b 1
    )
)

echo SUCCESS: Backend available on %SERVER_URL%
echo.

echo 1. Getting filesystem statistics...
curl -s %SERVER_URL%/api/filesystem/orders/statistics/overview
echo.
echo.

echo 2. Getting all orders in filesystem...
curl -s %SERVER_URL%/api/filesystem/orders
echo.
echo.

echo 3. Getting order TH1K4108A...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A
echo.
echo.

echo 4. Getting versions of TH1K4108A...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A/versions
echo.
echo.

echo 5. Running export from DB...
curl -X POST %SERVER_URL%/api/filesystem/orders/export-all
echo.
echo.

echo Test completed!
pause
