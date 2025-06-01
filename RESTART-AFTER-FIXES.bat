@echo off
chcp 65001 > nul
echo ====================================
echo RESTART APPLICATION AFTER FIXES
echo ====================================
echo.
echo The files have been fixed. Now restarting the application...
echo.

echo Stopping any running node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting backend server...
start cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo.
echo Starting frontend application...
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo Application should be restarting now!
echo.
echo The following fixes have been applied:
echo 1. Frontend: Added number conversion for operations
echo 2. Backend: Fixed extractMachineAxesNumber method
echo.
echo You can now try to create/edit orders with operations
echo ====================================
