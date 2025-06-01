@echo off
echo ============================================
echo  FIXING PRIORITY TYPE AND ORDER SAVING
echo ============================================
echo.
echo Applied changes:
echo.
echo 1. Fixed DTO validation:
echo    - Priority changed from string to number
echo    - Values: 1 - high, 2 - medium, 3 - low
echo.
echo 2. Fixed TypeScript errors in services:
echo    - Removed parseInt() for priority field
echo    - Updated type handling in all services
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
echo Clearing cache...
cd frontend
npm cache clean --force
cd ..
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
echo Next steps:
echo 1. Open the application in your browser
echo 2. Try to edit an order with operations
echo 3. The priority field should now work correctly
echo 4. Operations should save without errors
echo ============================================
pause
