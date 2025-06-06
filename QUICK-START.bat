@echo off
echo Starting Production CRM...
echo.

echo Killing existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do taskkill /F /PID %%a >nul 2>&1

echo.
echo Starting backend...
cd backend
start "Backend" cmd /k "npm run start:dev"
cd ..

echo Waiting 8 seconds...
timeout /t 8 /nobreak >nul

echo.
echo Starting frontend...
cd frontend  
start "Frontend" cmd /k "npm start"
cd ..

echo.
echo Done!
echo Frontend: http://localhost:5100
echo Backend: http://localhost:5101
echo.
timeout /t 3 /nobreak >nul

start http://localhost:5100
