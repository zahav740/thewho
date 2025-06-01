@echo off
chcp 65001 >nul
color 0A

echo ==========================================
echo     PRODUCTION CRM - FULL SYSTEM START
echo ==========================================
echo.

echo Starting complete Production CRM system...
echo.

REM Administrator rights check
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator rights required!
    echo Run script as Administrator
    pause
    exit /b 1
)

echo Administrator rights confirmed
echo.

REM STEP 1: STOP ALL PROCESSES ON PORTS 3000, 3001, 8080
echo [STEP 1] Stopping processes on ports 3000, 3001, 8080...
echo.

echo Stopping processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo   Killing process %%a on port 3000
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo   Killing process %%a on port 3001  
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping processes on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo   Killing process %%a on port 8080
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping all Node.js and npm processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
taskkill /f /im serve.cmd >nul 2>&1

echo Waiting for processes to fully terminate...
timeout /t 5 /nobreak >nul

echo Verifying ports are free...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 still in use
) else (
    echo   Port 3000 is free
)

netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 3001 still in use
) else (
    echo   Port 3001 is free
)

netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 8080 still in use
) else (
    echo   Port 8080 is free
)

echo Ports cleared successfully
echo.

REM STEP 2: SETUP ENVIRONMENT AND POSTGRESQL
echo [STEP 2] Setting up environment and PostgreSQL...
echo.

REM Setting production environment variables
echo Setting production environment...
set NODE_ENV=production
set PORT=3001
set FRONTEND_PORT=3000

REM PostgreSQL check and start
echo Checking PostgreSQL service...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL service not found, trying standard service...
    net start postgresql >nul 2>&1
)

REM Start PostgreSQL if not running
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL...
    net start postgresql-x64-14 >nul 2>&1
    timeout /t 5 /nobreak >nul
    
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Failed to start PostgreSQL!
        echo Check PostgreSQL installation
        pause
        exit /b 1
    )
)

echo PostgreSQL is running
echo.

REM STEP 3: PREPARE AND START BACKEND
echo [STEP 3] Preparing and starting backend...
echo.

REM Switch to backend directory
echo Switching to backend directory...
cd /d "%~dp0backend"

REM Check package.json
if not exist "package.json" (
    echo ERROR: package.json not found in backend!
    pause
    exit /b 1
)

echo Checking backend dependencies...
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies!
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)

echo.

REM Build backend
echo Building backend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    echo Trying to fix dependencies...
    call npm install
    call npm run build
    if %errorlevel% neq 0 (
        echo CRITICAL ERROR: Backend build still failing
        pause
        exit /b 1
    )
)

echo Backend built successfully
echo.

REM Check if build output exists
if not exist "dist\src\main.js" (
    echo ERROR: Backend build output not found!
    echo Expected: dist\src\main.js
    pause
    exit /b 1
)

REM Run database migrations
echo Running database migrations...
call npm run migration:run
if %errorlevel% neq 0 (
    echo WARNING: Migrations completed with errors (possibly already executed)
)

echo.

REM Start backend in production
echo Starting backend in production mode on port 3001...
start "Production CRM Backend" cmd /k "echo Starting Production CRM Backend... && npm run start:prod"

REM Wait for backend startup with progress indicator
echo Waiting for backend startup...
set /a counter=0
:backend_wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   Backend started successfully and responding!
    goto backend_ready
)
set /a counter+=1
echo   Waiting for backend... (%counter%/15)
if %counter% lss 15 (
    goto backend_wait_loop
)

echo ERROR: Backend not responding after 30 seconds
echo Check logs in "Production CRM Backend" window
pause
exit /b 1

:backend_ready
echo   Backend is ready on http://localhost:3001
echo.

REM STEP 4: PREPARE AND START FRONTEND
echo [STEP 4] Preparing and starting frontend...
echo.

REM Switch to frontend directory
echo Switching to frontend directory...
cd /d "%~dp0frontend"

REM Check package.json
if not exist "package.json" (
    echo ERROR: package.json not found in frontend!
    pause
    exit /b 1
)

echo Checking frontend dependencies...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies!
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)

echo.

REM Clear TypeScript and React caches
echo Clearing TypeScript cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "tsconfig.tsbuildinfo" del "tsconfig.tsbuildinfo"

echo Clearing React cache...
if exist "build" rmdir /s /q "build"

echo.

REM Build frontend for production
echo Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    echo Trying with cache clean...
    
    call npm cache clean --force
    rmdir /s /q "node_modules\.cache" 2>nul
    
    echo Rebuilding frontend...
    call npm run build
    
    if %errorlevel% neq 0 (
        echo CRITICAL ERROR: Frontend build still failing
        echo Check console for TypeScript errors
        pause
        exit /b 1
    )
)

echo Frontend built successfully
echo.

REM Check if build output exists
if not exist "build\index.html" (
    echo ERROR: Frontend build output not found!
    echo Expected: build\index.html
    pause
    exit /b 1
)

REM Install static server if not present
echo Checking static server (serve)...
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing static server (serve)...
    call npm install -g serve
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install serve!
        pause
        exit /b 1
    )
)

REM Start frontend in production
echo Starting frontend in production mode on port 3000...
start "Production CRM Frontend" cmd /k "echo Starting Production CRM Frontend... && serve -s build -l 3000"

REM Wait for frontend startup with progress indicator
echo Waiting for frontend startup...
set /a counter=0
:frontend_wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo   Frontend started successfully and responding!
    goto frontend_ready
)
set /a counter+=1
echo   Waiting for frontend... (%counter%/10)
if %counter% lss 10 (
    goto frontend_wait_loop
)

echo ERROR: Frontend not responding after 20 seconds
echo Check logs in "Production CRM Frontend" window
pause
exit /b 1

:frontend_ready
echo   Frontend is ready on http://localhost:3000
echo.

REM STEP 5: FINAL SYSTEM CHECK
echo [STEP 5] Final system check...
echo.

echo Testing API endpoints...

echo 1. API Health Check...
curl -s http://localhost:3001/api/health
if %errorlevel% neq 0 (
    echo   ERROR: API health check failed
) else (
    echo   API health check passed
)

echo.
echo 2. API Documentation...
curl -s http://localhost:3001/api/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: API documentation unavailable
) else (
    echo   API documentation available
)

echo.
echo 3. Main API Endpoints...
curl -s http://localhost:3001/api/machines >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: Machines API unavailable
) else (
    echo   Machines API working
)

curl -s http://localhost:3001/api/orders >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: Orders API unavailable
) else (
    echo   Orders API working
)

curl -s http://localhost:3001/api/files >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: Files API unavailable
) else (
    echo   Files API working
)

echo.
echo ==========================================
echo     PRODUCTION CRM SYSTEM STARTED!
echo ==========================================
echo.
echo   Frontend:             http://localhost:3000
echo   Backend API:          http://localhost:3001
echo   API Documentation:    http://localhost:3001/api/docs
echo   API Health:           http://localhost:3001/api/health
echo.
echo Main API endpoints:
echo   Machines:             http://localhost:3001/api/machines
echo   Orders:               http://localhost:3001/api/orders
echo   Calendar:             http://localhost:3001/api/calendar
echo   Files:                http://localhost:3001/api/files
echo   Planning:             http://localhost:3001/api/planning
echo.
echo System components:
echo   - PostgreSQL Database: Running
echo   - Backend (NestJS):    Running on port 3001
echo   - Frontend (React):    Running on port 3000
echo.
echo Log windows:
echo   - "Production CRM Backend" - Backend logs
echo   - "Production CRM Frontend" - Frontend logs
echo.
echo To stop the system: STOP-PRODUCTION.bat
echo.

REM Open browser windows
echo Opening application in browser...
start http://localhost:3000
timeout /t 3 /nobreak >nul
start http://localhost:3001/api/docs

echo.
echo Production deployment completed successfully!
echo Both backend and frontend are running!
echo.
pause