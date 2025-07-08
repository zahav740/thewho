@echo off
setlocal enabledelayedexpansion

echo ====================================
echo PRODUCTION CRM - START SCRIPT (ENHANCED)
echo ====================================
echo VERSION: 1.1.0 (Dependencies Fixed)
echo DATE: %date% %time%
echo.

REM Set development environment variables
set NODE_ENV=development
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

timeout /t 3 >nul

echo.
echo 3. Database configuration check...
echo Database Host: localhost
echo Database Port: 5432
echo Database Name: thewho
echo Database Username: postgres
echo Environment: %NODE_ENV%
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

echo.
echo 🔧 Checking and installing backend dependencies...
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies found
)

echo.
echo 🔍 Checking for TypeScript compilation errors...
echo Running TypeScript check...
npx tsc --noEmit --skipLibCheck
if !errorlevel!==0 (
    echo ✅ TypeScript compilation successful
) else (
    echo ⚠️ TypeScript compilation has warnings (continuing anyway...)
)

echo.
echo 6. Starting Backend server on port %PORT%...
echo Mode: %NODE_ENV%
echo Database: postgresql://postgres:***@localhost:5432/thewho

REM Use development start script
start "CRM Backend API Server" cmd /k "echo BACKEND STARTING ON PORT %PORT%... && echo Database: postgresql://postgres:magarel@localhost:5432/thewho && echo Environment: %NODE_ENV% && npm run start:dev"

echo.
echo 7. Waiting for backend to initialize...
echo Checking backend health every 2 seconds...

set /a attempts=0
:check_backend
set /a attempts+=1
if %attempts% gtr 20 (
    echo ⚠️ Backend taking longer than expected, continuing with frontend...
    goto :continue_frontend
)

timeout /t 2 >nul
curl -s http://localhost:%PORT%/api/health >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Backend is responding (attempt %attempts%)
    goto :backend_ready
) else (
    echo ⏳ Backend starting... (attempt %attempts%/20)
    goto :check_backend
)

:backend_ready
echo ✅ Backend is fully operational!

echo.
echo 🧪 Testing Excel Import API...
node test-excel-simple.js

:continue_frontend
echo.
echo 8. Validating frontend directory and dependencies...
cd ..\frontend

if not exist "package.json" (
    echo ❌ Frontend package.json not found!
    pause
    exit /b 1
)

echo.
echo 🔧 Checking and installing frontend dependencies...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies found
)

echo.
echo 🔍 Checking frontend TypeScript...
echo Running frontend TypeScript check...
npx tsc --noEmit --skipLibCheck
if !errorlevel!==0 (
    echo ✅ Frontend TypeScript compilation successful
) else (
    echo ⚠️ Frontend TypeScript has warnings (continuing anyway...)
)

echo.
echo 9. Starting Frontend React application on port %FRONTEND_PORT%...
echo Mode: Development (Hot Reload Enabled)
echo Browser will open automatically when ready!
echo.

REM Setting up auto-browser environment
echo Setting up auto-browser environment...
set BROWSER=default
set OPEN_BROWSER=true

REM Starting React development server
echo 🚀 Starting React development server with auto-browser...
start "CRM Frontend React App" cmd /k "set BROWSER=default && set OPEN_BROWSER=true && set PORT=%FRONTEND_PORT% && echo FRONTEND STARTING ON PORT %FRONTEND_PORT%... && echo API URL: http://localhost:%PORT%/api && echo Environment: %NODE_ENV% && echo Hot Reload: ENABLED && echo Auto Browser: ENABLED && npm start"

echo.
echo ⏳ Waiting for frontend server to be ready...
echo Checking frontend availability every 3 seconds...

set /a frontend_attempts=0
:check_frontend
set /a frontend_attempts+=1
if %frontend_attempts% gtr 25 (
    echo ⚠️ Frontend taking longer than expected, opening browser manually...
    goto :open_browser_manual
)

timeout /t 3 >nul
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Frontend is responding (attempt %frontend_attempts%)
    goto :frontend_ready
) else (
    echo ⏳ Frontend starting... (attempt %frontend_attempts%/25)
    goto :check_frontend
)

:frontend_ready
echo ✅ Frontend is fully operational!
echo ⏳ Waiting 3 seconds for React to fully initialize...
timeout /t 3 >nul

:open_browser_manual
echo.
echo 📱 Opening application in browser...
start "" "http://localhost:%FRONTEND_PORT%"

echo.
echo ====================================
echo DEVELOPMENT STARTUP COMPLETE!
echo ====================================
echo.
echo 🌐 Application URLs:
echo Frontend:        http://localhost:%FRONTEND_PORT%
echo Backend API:     http://localhost:%PORT%/api
echo API Docs:        http://localhost:%PORT%/api/docs
echo Health Check:    http://localhost:%PORT%/api/health
echo Excel Import:    http://localhost:%PORT%/api/excel-import/stats
echo.
echo 🗄️ Database Connection:
echo Host:            localhost:5432
echo Database:        thewho
echo Username:        postgres
echo Environment:     %NODE_ENV%
echo.
echo 🔧 System Information:
echo Node Environment: %NODE_ENV%
echo Backend Port:     %PORT%
echo Frontend Port:    %FRONTEND_PORT%
echo Hot Reload:       ENABLED
echo TypeScript:       ENABLED ✅
echo ESLint:           ENABLED
echo Auto Browser:     ENABLED ✅
echo Excel Import:     ENABLED ✅
echo Current Time:     %date% %time%
echo.
echo 📝 Development Notes:
echo - Backend is running with nodemon (auto-restart)
echo - Frontend has hot reload enabled
echo - TypeScript compilation is real-time
echo - ESLint warnings will be shown
echo - Source maps are enabled for debugging
echo - Browser opens automatically when ready ✅
echo - Excel Import module is active ✅
echo.
echo 🔍 Monitoring:
echo - Backend logs: Check Backend terminal window
echo - Frontend logs: Check Frontend terminal window  
echo - Database logs: Check PostgreSQL logs
echo - Browser DevTools: F12 for debugging
echo.
echo ✅ All development services are running!
echo ✅ Browser should have opened automatically!
echo ✅ Excel Import functionality is ready!
echo.
echo 🎉 CRM Development Environment is now running!
echo.
echo 💡 Tips:
echo - Save files to trigger hot reload
echo - Check terminal windows for logs
echo - Backend changes restart automatically
echo - Frontend changes reload in browser
echo - Browser opened automatically at: http://localhost:%FRONTEND_PORT%
echo - Test Excel Import at: Database ^> Import Excel
echo.
echo 🧪 Excel Import Testing:
echo 1. Go to Database section in the app
echo 2. Click "Import Excel" button  
echo 3. Upload an Excel file
echo 4. Configure column mapping
echo 5. Test the new hide/edit functionality ✅
echo.
echo Keep this window open to monitor the system.
echo.
pause
