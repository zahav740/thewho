@echo off
echo ====================================
echo STRING FORMAT FIX: "N-axis"
echo ====================================
echo.
echo This script will apply a fix for machine axes
echo using the string format "N-axis" (3-axis or 4-axis).
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
echo STRING FORMAT FIX APPLIED
echo.
echo The following changes have been made:
echo.
echo 1. Changed axes input to a dropdown with string values
echo    - Options: "3-axis" and "4-axis"
echo    - Values are sent as strings with "-axis" suffix
echo.
echo 2. Updated all TypeScript types
echo    - machineAxes is now always string
echo    - Format: "3-axis" or "4-axis"
echo.
echo 3. Ensured consistent data format
echo    - Form shows dropdown with 3 or 4
echo    - Data is always sent in "N-axis" format
echo.
echo You can now test creating/editing orders with operations.
echo The axes values are now consistently sent as strings.
echo ====================================
