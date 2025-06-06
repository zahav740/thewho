@echo off
echo ============================================
echo  STARTING PRODUCTION CRM APPLICATION
echo ============================================
echo.
echo This script will:
echo 1. Stop any running instances
echo 2. Start the backend server
echo 3. Wait for backend to initialize
echo 4. Start the frontend application
echo.
echo ============================================
echo.
echo Stopping all running services...

echo Stopping services on ports 3000, 3001, 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3001"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8080"') do (
    taskkill /F /PID %%a 2>nul
)

echo Killing all node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Starting backend server...
echo.
echo Please be patient while the backend initializes...

start cmd /k "cd backend && npm start"

echo Waiting for backend to initialize (15 seconds)...
timeout /t 15 /nobreak > nul

echo.
echo Starting frontend application...
echo.
echo Frontend will open automatically in your browser.
echo.

start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo Both servers should now be starting!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT:
echo - Keep both command windows open
echo - Check the windows for any error messages
echo - If you see connection errors in the browser,
echo   wait a few more seconds for the backend to
echo   fully initialize
echo ============================================
pause
