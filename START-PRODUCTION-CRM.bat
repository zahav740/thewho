@echo off
echo ====================================
echo PRODUCTION CRM - FULL RESTART
echo ====================================
echo.

echo 1. Stopping existing CRM processes on ports 5100 and 5101...
echo.

echo Killing processes on port 5100 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5100" ^| find "LISTENING"') do (
    echo Found process %%a on port 5100, killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 5101 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5101" ^| find "LISTENING"') do (
    echo Found process %%a on port 5101, killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Stopping any existing node processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo 4. Configuration check...
echo DB Host: localhost
echo DB Port: 5432
echo DB Name: thewho
echo DB Username: postgres
echo DB Password: magarel
echo Backend Port: 5100
echo Frontend Port: 5101
echo.

echo 5. Starting backend server on port 5100...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)

echo Starting backend in development mode...
start "Backend Server" cmd /k "echo BACKEND SERVER STARTING... && npm run start:dev"

echo 6. Waiting for backend to initialize...
timeout /t 8 /nobreak > nul

echo.
echo 7. Starting frontend application on port 5101...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo Starting frontend application...
start "Frontend App" cmd /k "echo FRONTEND APPLICATION STARTING... && npm start"

echo.
echo ====================================
echo STARTUP COMPLETE!
echo ====================================
echo Backend API: http://localhost:5100
echo Frontend App: http://localhost:5101
echo API Documentation: http://localhost:5100/api/docs
echo Health Check: http://localhost:5100/api/health
echo.
echo Database connection will be established automatically
echo using credentials from .env file (password: magarel)
echo.
echo Both services are running in separate terminal windows.
echo Close the terminal windows manually when you're done.
echo.
pause
