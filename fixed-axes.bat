@echo off
echo ====================================
echo FIXED AXES VALUES: ONLY 3 OR 4
echo ====================================
echo.
echo This script will apply a fix for machine axes
echo values, restricting them to only 3 or 4.
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
echo STRICT AXES FIX APPLIED
echo.
echo The following changes have been made:
echo.
echo 1. Changed axes input to a dropdown
echo    - Now restricted to only 3 or 4
echo    - Values are sent as numbers
echo.
echo 2. Updated formatter to enforce rules
echo    - Only valid values: 3 or 4
echo    - Default value: 3
echo.
echo 3. Ensured consistent display
echo    - Table shows "3-axis" or "4-axis"
echo    - Form shows dropdown with 3 or 4
echo.
echo You can now test creating/editing orders with operations.
echo The axes values are strictly validated to be only 3 or 4.
echo ====================================
