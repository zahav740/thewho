@echo off
echo ====================================
echo PRODUCTION CRM - COMPLETE STARTUP
echo ====================================
echo.

echo Step 1: Stopping all processes on ports 5100 and 5101...
echo.

echo Checking port 5100 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5100') do (
    echo Killing process %%a on port 5100
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking port 5101 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Killing process %%a on port 5101
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Step 2: Waiting 3 seconds for ports to clear...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Checking TypeScript compilation...
cd backend
echo Compiling TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript compilation failed!
    echo Please fix the errors above before continuing.
    pause
    exit /b 1
)
echo ✅ TypeScript compilation successful!

echo.
echo Step 4: Installing/updating backend dependencies...
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed.
)

echo.
echo Step 5: Starting Backend server on port 5101...
echo Backend logs will show in this window.
echo Look for operation-related logs when creating orders.
echo.
echo Starting backend with detailed logging...
echo Press Ctrl+C when you want to stop both servers.
echo.

start /min cmd /k "title Frontend Server && cd ..\frontend && echo Installing frontend dependencies... && if not exist node_modules npm install && echo Starting frontend on port 5100... && echo Frontend will open automatically in browser && npm start"

echo.
echo Backend starting with detailed logs:
echo - Watch for "OrdersService.create" logs
echo - Look for operation creation messages
echo - Check for any errors in red
echo.

npm run start:dev

echo.
echo ====================================
echo SERVERS STOPPED
echo ====================================
echo.
echo Both backend and frontend have been stopped.
echo.
pause
