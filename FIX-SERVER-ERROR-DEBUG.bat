@echo off
echo ============================================
echo  FIXING SERVER ERROR IN ORDERS API
echo ============================================
echo.
echo Applied changes:
echo.
echo 1. Fixed Entity-DTO inconsistency:
echo    - Updated priority handling in database
echo    - Fixed Order entity type definitions
echo.
echo 2. Enabled debug logging for API calls:
echo    - Detailed server logs for troubleshooting
echo    - Better error reporting on client side
echo.
echo ============================================
echo.
echo Stopping application services...

echo Stopping service on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)

echo Stopping service on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3001"') do (
    taskkill /F /PID %%a 2>nul
)

echo Stopping service on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8080"') do (
    taskkill /F /PID %%a 2>nul
)

echo Killing all node.exe processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Running backend in debug mode...
start cmd /k "cd backend && set DEBUG=* && npm start"
timeout /t 10 /nobreak > nul
echo.
echo Starting frontend...
start cmd /k "cd frontend && npm start"
echo.
echo ============================================
echo Debug mode enabled!
echo.
echo Check the backend console for detailed error logs.
echo If you see 500 errors in the browser console,
echo look at the backend terminal for the root cause.
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
