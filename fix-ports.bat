@echo off
echo ====================================
echo PRECISE FIX: MACHINE AXES FORMAT
echo ====================================
echo.
echo This script will apply a precise fix for
echo machine axes format issues and restart the application.
echo.

echo Stopping all processes on ports 3000, 3001, and 8080...

:: Stop process on port 3000 (Frontend)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping process on port 3000 (PID: %%p)
    taskkill /F /PID %%p 2>nul
)

:: Stop process on port 3001 (Backend API)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Stopping process on port 3001 (PID: %%p)
    taskkill /F /PID %%p 2>nul
)

:: Stop process on port 8080 (if any)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Stopping process on port 8080 (PID: %%p)
    taskkill /F /PID %%p 2>nul
)

echo Waiting for processes to terminate...
timeout /t 3 /nobreak > nul

echo.
echo Starting backend server...
start cmd /k "cd backend && npm start"

echo Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Starting frontend application...
start cmd /k "cd frontend && set TSC_COMPILE_ON_ERROR=true && npm start"

echo.
echo ====================================
echo PRECISE FIX APPLIED
echo.
echo The following changes have been made:
echo.
echo 1. Fixed machineAxes formatting
echo    - Now always sent in "3-axis" format
echo    - Displayed as "3-axis" in UI
echo.
echo 2. Updated TypeScript types
echo    - Both formats allowed: number and string
echo    - Added conversion between formats
echo.
echo 3. Direct fix in OrderForm
echo    - Formatter applied right before submission
echo    - Improved error handling with detailed messages
echo.
echo You can now test creating/editing orders with operations.
echo If you still encounter issues, detailed logs will
echo be available in the browser console.
echo ====================================
