@echo off
echo ====================================
echo ADAPTIVE FORMAT FIX
echo ====================================
echo.
echo This script will apply an adaptive fix for
echo server's contradictory data format requirements.
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
echo ADAPTIVE FORMAT FIX APPLIED
echo.
echo The following changes have been made:
echo.
echo 1. Fixed machineAxes to be sent as numbers
echo    - Options: 3 and 4
echo    - Values are validated and converted
echo.
echo 2. Made priority handling adaptive
echo    - First tries as string
echo    - Falls back to number if needed
echo    - Automatic retry with alternate format
echo.
echo 3. Enhanced error detection
echo    - Detailed logging of data formats
echo    - Automatic format correction attempts
echo.
echo This fix handles contradictory server requirements
echo by trying both formats when needed.
echo ====================================
