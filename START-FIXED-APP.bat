@echo off
echo ============================================
echo  START FIXED APPLICATION
echo ============================================
echo.
echo This script will start the application with all fixes applied.
echo.
echo ============================================
echo.
echo Stopping all services...

echo Stopping services on ports 3000, 3001, 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3001"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8080"') do (
    taskkill /F /PID %%a 2>nul
)

echo Killing all node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Starting backend...
start cmd /k "cd backend && npm start"

timeout /t 15 /nobreak > nul
echo.
echo Starting frontend...
start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo Application started with all fixes applied!
echo.
echo If you still see errors:
echo 1. Check backend console for error messages
echo 2. Refresh the browser page
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
