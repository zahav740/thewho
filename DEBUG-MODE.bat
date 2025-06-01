@echo off
chcp 65001 > nul
echo ====================================
echo ORDER DEBUG MODE
echo ====================================
echo.
echo This script will restart the application
echo with diagnostic tools enabled.
echo.

echo Stopping all node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting backend server...
start cmd /k "cd backend && npm start"

echo Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Starting frontend application...
start cmd /k "cd frontend && set TSC_COMPILE_ON_ERROR=true && npm start"

echo.
echo Opening debug console in browser...
timeout /t 5 /nobreak > nul
start http://localhost:3000/order-debug.html

echo.
echo ====================================
echo DEBUG MODE ENABLED
echo.
echo Instructions:
echo 1. Use the Debug Console in your browser to test
echo    different data formats and find the issue
echo 2. Open browser dev tools (F12) to see detailed logs
echo 3. Follow the steps in the Debug Console to isolate
echo    the cause of the 400 Bad Request error
echo.
echo NOTE: You must reload the main application page
echo after the diagnostic tools are loaded.
echo ====================================
