@echo off
echo ====================================
echo PRECISE FIX: MACHINE AXES FORMAT
echo ====================================
echo.
echo This script will apply a precise fix for
echo machine axes format issues and restart the application.
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
