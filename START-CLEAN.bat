@echo off
echo ====================================
echo PRODUCTION CRM - CLEAN START
echo ====================================
echo.

echo Step 1: Killing processes on ports 5100 and 5101...
echo.

echo Checking port 5100 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5100') do (
    echo Killing process %%a on port 5100
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking port 5101 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Killing process %%a on port 5101
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Step 2: Waiting 3 seconds for ports to clear...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Checking TypeScript compilation...
cd backend
call npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript compilation failed!
    echo Check the errors above and run CHECK-TYPESCRIPT.bat for details
    pause
    exit /b 1
)
echo ✅ TypeScript compilation successful!
echo.

echo Step 4: Starting Backend server (port 5101)...
start cmd /k "echo BACKEND STARTING... && npm run start:dev"

echo Backend starting in separate window...
echo.

echo Step 5: Waiting 8 seconds for backend to initialize...
timeout /t 8 /nobreak >nul

echo.
echo Step 6: Starting Frontend application (port 5100)...
cd ..\frontend
start cmd /k "echo FRONTEND STARTING... && npm start"

echo Frontend starting in separate window...
echo.

echo ====================================
echo STARTUP COMPLETED!
echo ====================================
echo.
echo URLs:
echo - Frontend: http://localhost:5100
echo - Backend API: http://localhost:5101/api
echo - API Docs: http://localhost:5101/api/docs
echo - Health Check: http://localhost:5101/api/health
echo.
echo Both applications are running in separate windows.
echo Close those windows manually when you're done.
echo.
echo Press any key to test API endpoints...
pause

echo.
echo ====================================
echo TESTING API ENDPOINTS
echo ====================================
echo.

echo Testing health endpoint...
curl -s http://localhost:5101/api/health
echo.
echo.

echo Testing calendar test endpoint...
curl -s http://localhost:5101/api/calendar/test
echo.
echo.

echo If you see JSON responses above, everything is working!
echo Otherwise, check the backend console window for errors.
echo.
pause
