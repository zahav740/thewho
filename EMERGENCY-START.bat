@echo off
echo ====================================
echo EMERGENCY RESTART - MINIMAL BACKEND
echo ====================================
echo.

echo Stopping all Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo.
echo Starting minimal backend (only Orders + Health modules)...
echo.

cd backend

echo Should compile cleanly now...
npm run start:dev

echo.
pause
