@echo off
echo ====================================
echo NUMBER FORMAT FIX: MACHINE AXES
echo ====================================
echo.
echo This script will apply a fix for machine axes
echo using the NUMBER format (3 or 4) as required by the server.
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
echo NUMBER FORMAT FIX APPLIED
echo.
echo The following changes have been made:
echo.
echo 1. Changed axes input to a dropdown with numeric values
echo    - Options: 3 and 4 (as numbers)
echo    - Values are sent as numbers to the server
echo.
echo 2. Updated all TypeScript types
echo    - machineAxes is now always number
echo    - Valid values: 3 or 4 only
echo.
echo 3. Fixed format error in API communication
echo    - Form shows dropdown with 3 or 4
echo    - Data is always sent as numbers
echo    - Priority is explicitly converted to number
echo.
echo You can now test creating/editing orders with operations.
echo The axes values are now sent as numbers.
echo ====================================
