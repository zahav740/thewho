@echo off
echo ====================================
echo RESTART BACKEND ONLY
echo ====================================
echo.

echo 1. Stopping backend process on port 5100...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5100" ^| find "LISTENING"') do (
    echo Killing backend process %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 3. Starting backend on port 5100...
cd backend
start "Backend API" cmd /k "echo BACKEND RESTARTING ON PORT 5100... && npm run start:dev"

echo.
echo ====================================
echo BACKEND RESTART COMPLETE
echo ====================================
echo.
echo Backend API: http://localhost:5100/api
echo Health Check: http://localhost:5100/api/health
echo Swagger Docs: http://localhost:5100/api/docs
echo.
echo Backend is starting in separate terminal window.
echo Frontend should remain running on port 5101.
echo.
pause
