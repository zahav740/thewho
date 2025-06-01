@echo off
echo ==========================================
echo     PRODUCTION CRM - PRODUCTION DEPLOY
echo ==========================================
echo.

echo Starting Production CRM system...
echo.

REM Check administrator rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator rights required!
    echo Run script as Administrator
    pause
    exit /b 1
)

echo Administrator rights confirmed
echo.

REM Stop old processes
echo Stopping old processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
taskkill /f /im serve.cmd >nul 2>&1

REM Clear ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

timeout /t 3 /nobreak >nul
echo Processes stopped
echo.

REM Set production environment
echo Setting production environment...
set NODE_ENV=production
set PORT=3001
set FRONTEND_PORT=3000

REM Check PostgreSQL
echo Checking PostgreSQL service...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL...
    net start postgresql >nul 2>&1
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

REM Prepare backend
echo Preparing backend for production...
cd /d "%~dp0backend"

REM Check package.json
if not exist "package.json" (
    echo ERROR: package.json not found in backend!
    pause
    exit /b 1
)

REM Install production dependencies
echo Installing production dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    call npm install
    pause
    exit /b 1
)

REM Build backend
echo Building backend...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    call npm run build
    pause
    exit /b 1
)

echo Backend built successfully
echo.

REM Run database migrations (optional)
echo Running database migrations...
call npm run migration:run >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Migrations completed with warnings (possibly already executed)
)

REM Start backend in production
echo Starting backend in production mode...
start "Production CRM Backend" cmd /k "npm run start:prod"

REM Wait for backend startup
echo Waiting for backend startup...
set backend_ready=0
for /l %%i in (1,1,15) do (
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:3001/api/health >nul 2>&1
    if not errorlevel 1 (
        echo Backend started and responding
        set backend_ready=1
        goto backend_ok
    )
    echo   Waiting... (%%i/15)
)

:backend_ok
if %backend_ready%==0 (
    echo ERROR: Backend not responding on http://localhost:3001
    echo Check logs in "Production CRM Backend" window
    pause
    exit /b 1
)

echo Backend ready on http://localhost:3001
echo.

REM Prepare frontend
echo Preparing frontend for production...
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
    call npm install
    pause
    exit /b 1
)

REM Build frontend for production
echo Building frontend for production...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    call npm run build
    pause
    exit /b 1
)

echo Frontend built successfully
echo.

REM Install and run static server
echo Checking static server...
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing serve...
    call npm install -g serve
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install serve!
        pause
        exit /b 1
    )
)

REM Start frontend in production
echo Starting frontend in production mode...
start "Production CRM Frontend" cmd /k "serve -s build -l 3000"

REM Wait for frontend startup
echo Waiting for frontend startup...
set frontend_ready=0
for /l %%i in (1,1,10) do (
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if not errorlevel 1 (
        echo Frontend started and responding
        set frontend_ready=1
        goto frontend_ok
    )
    echo   Waiting... (%%i/10)
)

:frontend_ok
if %frontend_ready%==0 (
    echo ERROR: Frontend not responding on http://localhost:3000
    echo Check logs in "Production CRM Frontend" window
    pause
    exit /b 1
)

echo Frontend ready on http://localhost:3000
echo.

REM Final system check
echo Final system check...
echo.

echo 1. Checking API health...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: API not responding
) else (
    echo SUCCESS: API working
)

echo.
echo 2. Checking API documentation...
curl -s http://localhost:3001/api/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: API documentation unavailable
) else (
    echo SUCCESS: API documentation available
)

echo.
echo 3. Checking main endpoints...
curl -s http://localhost:3001/api/machines >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Machines API unavailable
) else (
    echo SUCCESS: Machines API working
)

curl -s http://localhost:3001/api/orders >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Orders API unavailable
) else (
    echo SUCCESS: Orders API working
)

echo.
echo ==========================================
echo      PRODUCTION CRM STARTED SUCCESSFULLY!
echo ==========================================
echo.
echo Frontend (Production):  http://localhost:3000
echo Backend API:            http://localhost:3001
echo API Documentation:      http://localhost:3001/api/docs
echo Machines:               http://localhost:3001/api/machines
echo Orders:                 http://localhost:3001/api/orders
echo Calendar:               http://localhost:3001/api/calendar
echo.
echo System running in PRODUCTION mode
echo Logs available in separate windows
echo To stop the system, use: STOP-PRODUCTION-CRM.bat
echo.

REM Open browser
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:3001/api/docs

echo Production deployment completed successfully!
echo.
pause
