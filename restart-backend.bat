@echo off
echo Stopping backend on port 5100...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul
echo.
echo Starting backend...
cd backend
npm run start:dev
pause
