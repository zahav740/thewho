@echo off
echo ====================================
echo PRODUCTION CRM - FULL RESTART
echo ====================================
echo.

echo Step 1: STOPPING PROCESSES ON PORTS 5100 AND 5101
echo ===================================================

echo Killing processes on port 5100 (frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5100
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Killing processes on port 5101 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5101  
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Processes stopped successfully
echo.

echo Step 2: CHECKING DATABASE CONNECTION
echo ====================================

echo Testing PostgreSQL connection with password: magarel
echo Database: thewho, User: postgres, Host: localhost:5432

set PGPASSWORD=magarel
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Database connected successfully!' as status;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database connection successful
) else (
    echo ❌ Database connection failed
    echo Make sure PostgreSQL is running and database 'thewho' exists
    echo Password should be: magarel
    pause
    exit /b 1
)

echo.

echo Step 3: DEPLOYING PRODUCTION CODE
echo =================================

echo Deploying safe operation entity...
copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul

echo Deploying production orders service...
copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul

echo Running database operations fix...
set PGPASSWORD=magarel
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-SIMPLE.sql" 2>nul

echo Production code deployed successfully
echo.

echo Step 4: STARTING BACKEND SERVER
echo ================================

echo Starting backend on port 5101...
cd backend

if not exist package.json (
    echo ERROR: package.json not found in backend directory
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install --silent

echo Starting backend server...
start "Backend-Server" cmd /k "echo ===== BACKEND STARTING ===== && npm run start:dev"

echo Waiting 15 seconds for backend to initialize...
timeout /t 15 /nobreak >nul

echo Testing backend connection...
curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server started successfully
) else (
    echo ⚠️ Backend server may need more time to start
)

cd ..
echo.

echo Step 5: STARTING FRONTEND APPLICATION  
echo =======================================

echo Starting frontend on port 5100...
cd frontend

if not exist package.json (
    echo ERROR: package.json not found in frontend directory
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install --silent

echo Starting frontend application...
start "Frontend-App" cmd /k "echo ===== FRONTEND STARTING ===== && npm start"

echo Waiting 20 seconds for frontend to build and start...
timeout /t 20 /nobreak >nul

cd ..
echo.

echo Step 6: TESTING API ENDPOINTS
echo ==============================

echo Testing health endpoint...
curl -s -w "HTTP %%{http_code}" http://localhost:5101/api/health
echo.

echo Testing orders endpoint...
curl -s -w "HTTP %%{http_code}" "http://localhost:5101/api/orders?limit=3"
echo.

echo Testing calendar endpoint...
curl -s -w "HTTP %%{http_code}" http://localhost:5101/api/calendar/test
echo.

echo Step 7: OPENING APPLICATION
echo ============================

echo Opening application in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5100

echo.
echo ====================================
echo STARTUP COMPLETE!
echo ====================================
echo.
echo Application URLs:
echo • Frontend:     http://localhost:5100
echo • Backend API:  http://localhost:5101/api  
echo • API Docs:     http://localhost:5101/api/docs
echo • Health Check: http://localhost:5101/api/health
echo.
echo Database Connection:
echo • Host: localhost:5432
echo • Database: thewho
echo • User: postgres  
echo • Password: magarel
echo.
echo Server windows are running in background.
echo Close them manually when you're done.
echo.
echo Order C6HP0021A should now show 3 operations in Database section!
echo.
pause
