@echo off
echo ====================================
echo PRODUCTION CRM - ALL IN ONE
echo ====================================
echo.

echo Step 1: Stopping all processes on ports 5100 and 5101...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5100') do (
    echo Killing process %%a on port 5100
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Killing process %%a on port 5101
    taskkill /f /pid %%a >nul 2>&1
)

taskkill /f /im node.exe >nul 2>&1
echo Ports cleared.

echo.
echo Step 2: Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting Backend on port 5101...
cd backend
start cmd /k "title Backend Server - Port 5101 && echo BACKEND STARTING... && npm run start:dev"

echo.
echo Step 4: Waiting 8 seconds for backend initialization...
timeout /t 8 /nobreak >nul

echo.
echo Step 5: Starting Frontend on port 5100...
cd ..\frontend
start cmd /k "title Frontend Server - Port 5100 && echo FRONTEND STARTING... && npm start"

echo.
echo ====================================
echo STARTUP COMPLETED!
echo ====================================
echo.
echo Frontend: http://localhost:5100
echo Backend:  http://localhost:5101
echo API Docs: http://localhost:5101/api/docs
echo.
echo Both servers are running in separate windows.
echo Create an order with operations to test!
echo Close the windows manually when done.
echo.
pause
