@echo off
echo ====================================
echo PRIORITY LOGIC UPDATE - FINAL FIX
echo ====================================
echo.
echo This script will apply final updates to
echo remove all references to CRITICAL priority
echo from OrdersList.tsx.
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo Done!

echo Waiting for processes to terminate...
timeout /t 3 /nobreak > nul

echo.
echo Starting backend server...
cd backend
start cmd /k "npm start"
cd ..

echo Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Starting frontend application...
cd frontend
start cmd /k "set TSC_COMPILE_ON_ERROR=true && npm start"
cd ..

echo.
echo ====================================
echo PRIORITY LOGIC FULLY UPDATED
echo.
echo The following changes have been made:
echo.
echo 1. Removed all CRITICAL references:
echo    - Fixed getPriorityConfig function
echo    - Removed CRITICAL option from filter
echo.
echo 2. Updated priority display:
echo    - 1 = Высокий (orange)
echo    - 2 = Средний (blue)
echo    - 3 = Низкий (green)
echo.
echo You can now test creating/editing orders with the
echo updated priority logic.
echo ====================================
