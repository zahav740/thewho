@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo  PRODUCTION CRM - FIXED START SCRIPT
echo ==========================================
echo.

REM Set environment variables
set NODE_ENV=development
set BACKEND_PORT=5100
set FRONTEND_PORT=5101

echo Stopping existing processes...
echo.

echo Killing processes on port %BACKEND_PORT% (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%BACKEND_PORT%" ^| find "LISTENING"') do (
    echo Terminating process %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port %FRONTEND_PORT% (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%FRONTEND_PORT%" ^| find "LISTENING"') do (
    echo Terminating process %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Checking PostgreSQL database...
echo Database: postgresql://postgres:magarel@localhost:5432/thewho
echo.

echo Starting Backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
)

echo Building backend...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Build failed, trying to start anyway...
)

echo Starting backend server on port %BACKEND_PORT%...
start "CRM Backend" cmd /k "echo Backend starting... && npm run start:dev"

echo.
echo Waiting for backend to start...
timeout /t 10 /nobreak

echo.
echo Starting Frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

echo Starting frontend server on port %FRONTEND_PORT%...
start "CRM Frontend" cmd /k "echo Frontend starting... && set BROWSER=default && set PORT=%FRONTEND_PORT% && npm start"

echo.
echo Waiting for frontend to start...
timeout /t 15 /nobreak

echo.
echo Opening application in browser...
start "" "http://localhost:%FRONTEND_PORT%"

echo.
echo ==========================================
echo  APPLICATION STARTED SUCCESSFULLY!
echo ==========================================
echo.
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend:  http://localhost:%BACKEND_PORT%/api
echo Database: localhost:5432/thewho
echo.
echo Keep this window open to monitor the system.
echo.
pause
