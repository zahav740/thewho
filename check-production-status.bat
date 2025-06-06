@echo off
echo ========================================
echo      PRODUCTION STATUS CHECKER
echo ========================================
echo.

echo Checking services status...
echo.

echo Backend Status:
netstat -an | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ✓ Backend API is running on port 3001
) else (
    echo ✗ Backend API is not running
)

echo.
echo Frontend Status:
netstat -an | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ✓ Frontend server is running on port 3000
) else (
    echo ✗ Frontend server is not running
)

echo.
echo Database Status:
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 1;" 2>nul >nul
if %errorlevel% equ 0 (
    echo ✓ Database connection successful
) else (
    echo ✗ Database connection failed
)

echo.
echo Process Status:
tasklist | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ✓ Node.js processes are running:
    tasklist | findstr node.exe
) else (
    echo ✗ No Node.js processes found
)

echo.
echo ========================================
echo Access URLs:
echo - Application: http://localhost:3000
echo - API Health: http://localhost:3001/api/health
echo ========================================
echo.
pause
