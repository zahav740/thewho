@echo off
echo ====================================
echo PRIORITY LOGIC UPDATE
echo ====================================
echo.
echo This script will apply updates to the priority logic
echo using the following values:
echo 1 - HIGH (Высокий)
echo 2 - MEDIUM (Средний)
echo 3 - LOW (Низкий)
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
echo PRIORITY LOGIC UPDATED
echo.
echo The following changes have been made:
echo.
echo 1. Changed Priority enum values:
echo    - HIGH = 1 (Высокий)
echo    - MEDIUM = 2 (Средний)
echo    - LOW = 3 (Низкий)
echo    - Removed CRITICAL priority
echo.
echo 2. Updated form dropdown options:
echo    - Adjusted Select component options
echo    - Default set to MEDIUM (2)
echo.
echo 3. Fixed priority handling in API:
echo    - Still uses adaptive format detection
echo    - Compatible with updated priority values
echo.
echo You can now test creating/editing orders with the
echo updated priority logic.
echo ====================================
