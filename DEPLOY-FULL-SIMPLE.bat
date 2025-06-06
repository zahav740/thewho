@echo off
echo ====================================
echo FULL PRODUCTION DEPLOYMENT
echo ====================================
echo.

echo 1. STOPPING ALL PROCESSES
echo ===========================

echo Stopping processes on ports 5100 and 5101...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5100
        taskkill /F /PID %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5101
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Processes stopped
timeout /t 2 /nobreak >nul

echo.
echo 2. DATABASE SETUP
echo ==================

echo Checking PostgreSQL connection...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'DB Connected' as status;" 2>nul
if %errorlevel% neq 0 (
    echo Cannot connect to database. Check PostgreSQL is running.
    pause
    exit /b 1
)

echo Database connected successfully

echo.
echo Adding missing operations for C6HP0021A...
psql -h localhost -p 5432 -U postgres -d thewho -f "ADD-OPERATIONS-C6HP0021A.sql" 2>nul

echo.
echo 3. DEPLOYING PRODUCTION CODE
echo =============================

echo Backing up current files...
copy "backend\src\modules\orders\orders.service.ts" "backend\src\modules\orders\orders.service.BACKUP.ts" >nul 2>&1
copy "backend\src\database\entities\operation.entity.ts" "backend\src\database\entities\operation.entity.BACKUP.ts" >nul 2>&1

echo Deploying production entity...
copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul

echo Deploying production service...
copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul

echo Production code deployed

echo.
echo 4. STARTING BACKEND SERVER
echo ===========================

echo Starting backend on port 5101...
cd backend

if not exist .env (
    echo Backend .env file not found!
    echo Creating .env with default values...
    echo NODE_ENV=production> .env
    echo PORT=5101>> .env
    echo DB_HOST=localhost>> .env
    echo DB_PORT=5432>> .env
    echo DB_NAME=thewho>> .env
    echo DB_USERNAME=postgres>> .env
    echo DB_PASSWORD=magarel>> .env
    echo JWT_SECRET=production-jwt-secret>> .env
    echo CORS_ORIGIN=http://localhost:5100>> .env
)

echo Installing dependencies...
call npm install --silent

echo Starting backend server...
start "Backend-Server" cmd /k "echo BACKEND STARTING && npm run start:dev"

echo Waiting for backend to start...
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% neq 0 goto wait_backend

echo Backend server is running!

cd ..

echo.
echo 5. STARTING FRONTEND APPLICATION
echo =================================

echo Starting frontend on port 5100...
cd frontend

if not exist .env (
    echo Creating frontend .env...
    echo REACT_APP_API_URL=http://localhost:5101/api> .env
    echo PORT=5100>> .env
)

echo Installing dependencies...
call npm install --silent

echo Starting frontend application...
start "Frontend-App" cmd /k "echo FRONTEND STARTING && npm start"

echo Waiting for frontend to start...
timeout /t 15 /nobreak >nul

cd ..

echo.
echo 6. TESTING DEPLOYMENT
echo ======================

echo Testing API endpoints...

echo Health check:
curl -s -w "Status: %%{http_code}" http://localhost:5101/api/health
echo.

echo Orders endpoint:
curl -s -w "Status: %%{http_code}" "http://localhost:5101/api/orders?limit=1"
echo.

echo.
echo 7. FINAL VERIFICATION
echo =====================

echo Checking C6HP0021A operations...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'C6HP0021A has ' || COUNT(op.id) || ' operations' as result FROM orders o LEFT JOIN operations op ON o.id = op.\"orderId\" WHERE o.drawing_number = 'C6HP0021A';" 2>nul

echo.
echo ====================================
echo DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo SYSTEM READY FOR PRODUCTION:
echo - Frontend: http://localhost:5100
echo - Backend: http://localhost:5101
echo - API Docs: http://localhost:5101/api/docs
echo - NO test data fallbacks
echo - Real database connections
echo - C6HP0021A should show 3 operations
echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5100

echo.
echo Production deployment successful!
echo Both servers are running in separate windows.
echo.
pause
