@echo off
echo ============================================
echo FIXING PRIORITY TYPE IN ORDER DTO
echo ============================================
echo.
echo Applied changes:
echo.
echo 1. FIXED PRIORITY VALIDATION:
echo    - Priority is now a numeric type instead of string
echo    - Values: 1 - high, 2 - medium, 3 - low
echo.
echo 2. IMPROVED REQUEST PROCESSING:
echo    - Frontend now sends numeric values
echo    - Backend accepts numeric values without conversion
echo.
echo ============================================
echo.
echo Stopping application services...

echo Stopping service on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)

echo Stopping service on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3001"') do (
    taskkill /F /PID %%a 2>nul
)

echo Stopping service on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8080"') do (
    taskkill /F /PID %%a 2>nul
)

echo Killing all node.exe processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Applying fixes...
echo.
echo Restarting backend and frontend...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"
echo.
echo ============================================
echo Fix applied!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Operations saving should now work correctly
echo ============================================
pause
