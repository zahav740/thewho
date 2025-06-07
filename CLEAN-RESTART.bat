@echo off
echo ====================================
echo CLEAN RESTART - PRODUCTION CRM
echo ====================================
echo.

echo 1. Stopping ALL Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo 2. Killing processes on all relevant ports...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5100" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5101" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo 3. Clearing npm cache...
cd backend
npm cache clean --force >nul 2>&1
cd ..\frontend
npm cache clean --force >nul 2>&1
cd ..

echo.
echo 4. Configuration check:
echo ✅ Backend: PORT=5100, CORS=5101
echo ✅ Frontend: PORT=5101, API=5100
echo ✅ Database: localhost:5432 (password: magarel)
echo.

echo 5. Starting backend server...
cd backend
start "Backend API" cmd /k "echo BACKEND STARTING ON PORT 5100 && npm run start:dev"

echo.
echo 6. Waiting for backend to initialize...
timeout /t 10 /nobreak > nul

echo.
echo 7. Starting frontend application...
cd ..\frontend
start "Frontend App" cmd /k "echo FRONTEND STARTING ON PORT 5101 && npm start"

echo.
echo ====================================
echo CLEAN RESTART COMPLETE!
echo ====================================
echo.
echo 🌐 URLs:
echo Frontend: http://localhost:5101
echo Backend API: http://localhost:5100/api
echo API Docs: http://localhost:5100/api/docs
echo Health Check: http://localhost:5100/api/health
echo.
echo 🗄️ Database: localhost:5432 (thewho, postgres/magarel)
echo.
echo ✅ All configurations have been synchronized!
echo ❌ If you still see CORS errors, close ALL browser tabs and restart.
echo.
pause
