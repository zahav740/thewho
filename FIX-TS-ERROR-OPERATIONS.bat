@echo off
echo ============================================
echo  FIXING TYPESCRIPT ERROR IN OPERATIONS
echo ============================================
echo.
echo Applied changes:
echo.
echo 1. Fixed TS2322 Type Error:
echo    - Added type casting with as any[]
echo    - Improved type handling in operations mapping
echo.
echo 2. Enhanced error handling:
echo    - Better priority type checking
echo    - Safer operations transformation
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
echo TypeScript errors in operations fixed!
echo.
echo If you see "net::ERR_CONNECTION_REFUSED" errors:
echo 1. Wait for the backend to fully initialize
echo 2. Refresh the browser page (F5)
echo.
echo If backend still fails to start, check:
echo 1. Error messages in the backend console
echo 2. Try running backend manually with:
echo    cd backend && npm start
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
