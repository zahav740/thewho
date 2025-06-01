@echo off
chcp 65001 >nul
color 0A

echo ==========================================
echo     PRODUCTION CRM - PRODUCTION DEPLOY
echo ==========================================
echo.

echo Starting Production CRM system in production mode...
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

REM =====================================================
REM STEP 1: STOP ALL PROCESSES ON PORTS 3000, 3001, 8080
REM =====================================================

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

REM Stop all Node.js and npm processes
echo Stopping all Node.js and npm processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im "npm.cmd" >nul 2>&1

REM Close specific production windows
taskkill /fi "WINDOWTITLE eq Production CRM Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Production CRM Frontend" /f >nul 2>&1

echo Waiting for processes to fully terminate...
timeout /t 5 /nobreak >nul

REM Verify ports are free
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

REM =====================================================
REM STEP 2: SETUP ENVIRONMENT AND POSTGRESQL
REM =====================================================

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

REM =====================================================
REM STEP 3: PREPARE AND START BACKEND
REM =====================================================

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

REM Install dependencies (all dependencies needed for build)
echo Installing backend dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    echo Trying with verbose output...
    call npm install
    pause
    exit /b 1
)

echo Backend dependencies installed successfully
echo.

REM Build backend
echo Building backend...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    echo Trying with verbose output...
    call npm run build
    pause
    exit /b 1
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
call npm run migration:run >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Migrations completed with errors (possibly already executed)
)

REM Start backend in production
echo Starting backend in production mode...
start "Production CRM Backend" /min cmd /k "echo Starting Production CRM Backend on port 3001... && npm run start:prod"

REM Wait for backend startup
echo Waiting for backend startup...
set /a counter=0
:backend_wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend started successfully and responding
    goto backend_ready
)
set /a counter+=1
if %counter% lss 15 (
    echo   Waiting... (%counter%/15)
    goto backend_wait_loop
)

echo ERROR: Backend not responding after 30 seconds
echo Check logs in "Production CRM Backend" window
pause
exit /b 1

:backend_ready
echo Backend is ready on http://localhost:3001
echo.

REM =====================================================
REM STEP 4: PREPARE AND START FRONTEND
REM =====================================================

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

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    echo Trying with verbose output...
    call npm install
    pause
    exit /b 1
)

echo Frontend dependencies installed successfully
echo.

REM Build frontend for production
echo Building frontend for production...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    echo Trying with verbose output...
    call npm run build
    pause
    exit /b 1
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
echo Starting frontend in production mode...
start "Production CRM Frontend" /min cmd /k "echo Starting Production CRM Frontend on port 3000... && serve -s build -l 3000"

REM Wait for frontend startup
echo Waiting for frontend startup...
set /a counter=0
:frontend_wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend started successfully and responding
    goto frontend_ready
)
set /a counter+=1
if %counter% lss 10 (
    echo   Waiting... (%counter%/10)
    goto frontend_wait_loop
)

echo ERROR: Frontend not responding after 20 seconds
echo Check logs in "Production CRM Frontend" window
pause
exit /b 1

:frontend_ready
echo Frontend is ready on http://localhost:3000
echo.

REM =====================================================
REM STEP 5: FINAL SYSTEM CHECK
REM =====================================================

echo [STEP 5] Final system check...
echo.

echo 1. Checking API health...
curl -s http://localhost:3001/api/health 2>nul
if %errorlevel% neq 0 (
    echo   ERROR: API health check failed
) else (
    echo   API health check passed
)

echo.
echo 2. Checking API documentation...
curl -s http://localhost:3001/api/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: API documentation unavailable
) else (
    echo   API documentation available
)

echo.
echo 3. Checking main endpoints...
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

echo.
echo ==========================================
echo      PRODUCTION CRM STARTED SUCCESSFULLY!
echo ==========================================
echo.
echo Frontend (Production):  http://localhost:3000
echo Backend API:            http://localhost:3001
echo API Documentation:      http://localhost:3001/api/docs
echo API Health:             http://localhost:3001/api/health
echo.
echo Main endpoints:
echo   Machines:             http://localhost:3001/api/machines
echo   Orders:               http://localhost:3001/api/orders
echo   Calendar:             http://localhost:3001/api/calendar
echo   Files:                http://localhost:3001/api/files
echo   Planning:             http://localhost:3001/api/planning
echo.
echo System running in PRODUCTION mode
echo Logs available in separate windows:
echo   - "Production CRM Backend" window
echo   - "Production CRM Frontend" window
echo.
echo To stop the system, use: STOP-PRODUCTION.bat
echo.

REM Open browser windows
echo Opening application in browser...
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:3001/api/docs

echo.
echo Production deployment completed successfully!
echo.
pause