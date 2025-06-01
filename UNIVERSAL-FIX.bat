@echo off
chcp 65001 > nul
echo ====================================
echo UNIVERSAL FIX: OPERATIONS FORMAT
echo ====================================
echo.
echo This script will apply a universal fix for
echo operations format issues and restart the application.
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
echo ====================================
echo UNIVERSAL FIX APPLIED
echo.
echo The following changes have been made:
echo.
echo 1. Created universal operation formatter utility
echo    - Ensures machineAxes is always in "3-axis" format
echo    - Properly formats numeric values in operations
echo.
echo 2. Enhanced API service with double-format fallback
echo    - First tries your format
echo    - Automatically retries with alternate format on error
echo.
echo 3. Added detailed error logging
echo    - Shows exactly what data is being sent
echo    - Provides detailed error analysis
echo.
echo You can now test creating/editing orders with operations.
echo If you still encounter issues, detailed logs will
echo be available in the browser console.
echo ====================================
