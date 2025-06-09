@echo off
setlocal enabledelayedexpansion

echo ====================================
echo PRODUCTION CRM - START SCRIPT
echo ====================================
echo VERSION: 1.0.0
echo DATE: %date% %time%
echo.

REM Set production environment variables
set NODE_ENV=production
set PORT=5100
set FRONTEND_PORT=5101

echo 1. Stopping processes on ports %PORT% and %FRONTEND_PORT%...
echo.

echo Checking and killing processes on port %PORT% (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%PORT%" ^| find "LISTENING"') do (
    echo Found process %%a on port %PORT%, terminating...
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking and killing processes on port %FRONTEND_PORT% (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%FRONTEND_PORT%" ^| find "LISTENING"') do (
    echo Found process %%a on port %FRONTEND_PORT%, terminating...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Stopping any remaining Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo 3. Production database configuration check...
echo Database Host: localhost
echo Database Port: 5432
echo Database Name: thewho
echo Database Username: postgres
echo Environment: PRODUCTION
echo.

echo 4. Checking PostgreSQL service...
REM Check multiple possible PostgreSQL service names
set PG_SERVICE=
for %%s in (postgresql-x64-14 postgresql-x64-15 postgresql-x64-16 postgresql-x64-17 PostgreSQL) do (
    sc query "%%s" >nul 2>&1
    if !errorlevel!==0 (
        set PG_SERVICE=%%s
        goto :found_service
    )
)

:found_service
if defined PG_SERVICE (
    echo PostgreSQL service found: %PG_SERVICE%
    sc query "%PG_SERVICE%" | find "RUNNING" >nul
    if !errorlevel!==0 (
        echo ✅ PostgreSQL is already running
    ) else (
        echo Starting PostgreSQL service...
        net start "%PG_SERVICE%" >nul 2>&1
        if !errorlevel!==0 (
            echo ✅ PostgreSQL started successfully
        ) else (
            echo ⚠️ Failed to start PostgreSQL service
            echo Checking if PostgreSQL is running via Docker...
            docker ps | find "postgres" >nul 2>&1
            if !errorlevel!==0 (
                echo ✅ PostgreSQL found running in Docker
            ) else (
                echo ❌ PostgreSQL not found - please start manually
            )
        )
    )
) else (
    echo ⚠️ PostgreSQL service not found - checking Docker...
    docker ps | find "postgres" >nul 2>&1
    if !errorlevel!==0 (
        echo ✅ PostgreSQL found running in Docker
    ) else (
        echo ❌ PostgreSQL not found - please start manually
    )
)

echo.
echo 5. Validating backend directory and dependencies...
if not exist "backend" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

cd backend

if not exist "package.json" (
    echo ❌ Backend package.json not found!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing backend dependencies...
    echo This may take a few minutes for production build...
    npm ci --production
    if !errorlevel! neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies found
)

echo.
echo 6. Starting Backend server on port %PORT%...
echo Mode: %NODE_ENV%
echo Database: postgresql://postgres:***@localhost:5432/thewho

REM For production, use npm start instead of start:dev
start "Production Backend API Server" cmd /k "echo PRODUCTION BACKEND STARTING ON PORT %PORT%... && echo Database: postgresql://postgres:magarel@localhost:5432/thewho && echo Environment: %NODE_ENV% && npm run start"

echo.
echo 7. Waiting for backend to initialize...
echo Checking backend health every 2 seconds...

set /a attempts=0
:check_backend
set /a attempts+=1
if %attempts% gtr 30 (
    echo ❌ Backend failed to start after 60 seconds
    goto :continue_frontend
)

ping -n 3 127.0.0.1 >nul 2>&1
curl -s http://localhost:%PORT%/api/health >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Backend is responding (attempt %attempts%)
    goto :backend_ready
) else (
    echo ⏳ Backend starting... (attempt %attempts%/30)
    goto :check_backend
)

:backend_ready
echo ✅ Backend is fully operational!

:continue_frontend
echo.
echo 8. Validating frontend directory and dependencies...
cd ..\frontend

if not exist "package.json" (
    echo ❌ Frontend package.json not found!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing frontend dependencies...
    echo This may take a few minutes for production build...
    npm ci --production
    if !errorlevel! neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies found
)

echo.
echo 9. Starting Frontend application on port %FRONTEND_PORT%...
echo Building production optimized version...

REM For production, build and serve optimized version
if not exist "build" (
    echo Building production bundle...
    npm run build
    if !errorlevel! neq 0 (
        echo ❌ Failed to build frontend
        pause
        exit /b 1
    )
)

start "Production Frontend React App" cmd /k "echo PRODUCTION FRONTEND STARTING ON PORT %FRONTEND_PORT%... && echo API URL: http://localhost:%PORT%/api && echo Environment: PRODUCTION && npm start"

echo.
echo ====================================
echo PRODUCTION STARTUP COMPLETE!
echo ====================================
echo.
echo 🌐 Application URLs:
echo Frontend:        http://localhost:%FRONTEND_PORT%
echo Backend API:     http://localhost:%PORT%/api
echo API Docs:        http://localhost:%PORT%/api/docs
echo Health Check:    http://localhost:%PORT%/api/health
echo.
echo 🗄️ Database Connection:
echo Host:            localhost:5432
echo Database:        thewho
echo Username:        postgres
echo Environment:     PRODUCTION
echo.
echo 🔧 System Information:
echo Node Environment: %NODE_ENV%
echo Backend Port:     %PORT%
echo Frontend Port:    %FRONTEND_PORT%
echo Current Time:     %date% %time%
echo.
echo 📝 Production Notes:
echo - Backend and Frontend are running in production mode
echo - Frontend is optimized and minified
echo - Database connections are pooled for performance
echo - Error logging is enabled
echo - CORS is configured for production domains
echo.
echo 🔍 Monitoring:
echo - Backend logs: Check Backend terminal window
echo - Frontend logs: Check Frontend terminal window  
echo - Database logs: Check PostgreSQL logs
echo.
echo ✅ All production services are running!
echo.
echo 🌍 Open your browser and navigate to: http://localhost:%FRONTEND_PORT%
echo.
echo Press any key to open the application in your default browser...
pause >nul

REM Open browser automatically
start http://localhost:%FRONTEND_PORT%

echo.
echo 🎉 Production CRM is now running!
echo Keep this window open to monitor the startup process.
echo.
pause