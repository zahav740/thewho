@echo off
chcp 65001 > nul
echo ====================================
echo COMPREHENSIVE FIX AND RESTART
echo ====================================
echo.
echo This script will restart the application after applying
echo comprehensive fixes to solve the 400 Bad Request error.
echo.

echo Stopping all node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Recompiling backend...
cd backend
call npm run build
cd ..

echo.
echo Starting backend server...
start cmd /k "cd backend && npm start"

echo Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Starting frontend application...
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo COMPREHENSIVE FIXES APPLIED
echo.
echo The following fixes have been implemented:
echo.
echo 1. FRONTEND:
echo - Added automatic number conversion for operations
echo - Added detailed request/response logging in API
echo - Added retry mechanism with alternative data format
echo.
echo 2. BACKEND:
echo - Added OrdersDataMiddleware to normalize request data
echo - Fixed extractMachineAxesNumber function
echo - Enhanced error handling for type conversion
echo.
echo Now you can test creating/editing orders with operations
echo If you see any errors in the console, they will contain
echo detailed information about the request and response.
echo ====================================
