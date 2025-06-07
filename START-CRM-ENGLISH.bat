@echo off
echo ====================================
echo PRODUCTION CRM - START SCRIPT
echo ====================================
echo.

echo 1. Stopping processes on ports 5100 and 5101...
echo.

echo Checking and killing processes on port 5100 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5100" ^| find "LISTENING"') do (
    echo Found process %%a on port 5100, terminating...
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking and killing processes on port 5101 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5101" ^| find "LISTENING"') do (
    echo Found process %%a on port 5101, terminating...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Stopping any remaining Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo 3. Database configuration check...
echo Database Host: localhost
echo Database Port: 5432
echo Database Name: thewho
echo Database Username: postgres
echo Database Password: magarel
echo.

echo 4. Checking PostgreSQL service...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel%==0 (
    echo PostgreSQL service found, checking status...
    sc query postgresql-x64-14 | find "RUNNING" >nul
    if %errorlevel%==0 (
        echo ✅ PostgreSQL is already running
    ) else (
        echo Starting PostgreSQL service...
        net start postgresql-x64-14 >nul 2>&1
        if %errorlevel%==0 (
            echo ✅ PostgreSQL started successfully
        ) else (
            echo ⚠️ Failed to start PostgreSQL service
        )
    )
) else (
    echo ⚠️ PostgreSQL service not found - assuming Docker or manual setup
)

echo.
echo 5. Starting Backend server on port 5100...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)

echo Starting backend in development mode...
start "Backend API Server" cmd /k "echo BACKEND STARTING ON PORT 5100... && echo Database: postgresql://postgres:magarel@localhost:5432/thewho && npm run start:dev"

echo.
echo 6. Waiting for backend to initialize...
timeout /t 10 /nobreak > nul

echo.
echo 7. Testing backend connection...
echo Testing health endpoint: http://localhost:5100/api/health
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend is responding
) else (
    echo ⚠️ Backend may still be starting up
)

echo.
echo 8. Starting Frontend application on port 5101...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo Starting frontend React application...
start "Frontend React App" cmd /k "echo FRONTEND STARTING ON PORT 5101... && echo API URL: http://localhost:5100/api && npm start"

echo.
echo ====================================
echo STARTUP COMPLETE!
echo ====================================
echo.
echo 🌐 Application URLs:
echo Frontend:        http://localhost:5101
echo Backend API:     http://localhost:5100/api
echo API Docs:        http://localhost:5100/api/docs
echo Health Check:    http://localhost:5100/api/health
echo.
echo 🗄️ Database Connection:
echo Host:            localhost:5432
echo Database:        thewho
echo Username:        postgres
echo Password:        magarel
echo.
echo 📝 Notes:
echo - Backend and Frontend are running in separate terminal windows
echo - Database connection will be established automatically
echo - Close terminal windows manually when finished
echo - If you see CORS errors, make sure both services are fully started
echo.
echo ✅ All services should be running now!
echo Open your browser and navigate to: http://localhost:5101
echo.
pause
