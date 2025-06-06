@echo off
echo ====================================
echo RESTART BACKEND AFTER FIXES
echo ====================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Step 2: Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting backend with clean compilation...
cd backend

echo TypeScript should compile without errors now...
echo.

echo Starting backend on port 5101...
echo Watch for OrdersService logs when creating orders!
echo.

npm run start:dev

pause
