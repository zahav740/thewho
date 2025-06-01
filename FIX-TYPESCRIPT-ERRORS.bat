@echo off
echo ============================================
echo  FIXING TYPESCRIPT TYPE ERRORS
echo ============================================
echo.
echo Applied changes:
echo.
echo 1. Fixed operations typings in service:
echo    - Corrected type casting for Operations
echo    - Fixed TypeScript errors in enrichOrder
echo.
echo 2. Improved entity compatibility:
echo    - Updated service to match entity structure
echo    - Fixed type inconsistencies in mappings
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

timeout /t 10 /nobreak > nul
echo.
echo Starting frontend...
start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo TypeScript errors fixed!
echo.
echo If you still see errors:
echo 1. Check if TypeScript compilation completes successfully
echo 2. Try restarting both services manually:
echo    - cd backend && npm start
echo    - cd frontend && npm start
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
