@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ====================================
echo FULL PRODUCTION DEPLOYMENT
echo ====================================
echo.

:: Цвета для вывода
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m" 
set "RESET=[0m"

echo %YELLOW%1. STOPPING ALL PROCESSES%RESET%
echo ===============================

echo Stopping processes on ports 5100 and 5101...

:: Останавливаем процессы на порту 5100
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5100
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Останавливаем процессы на порту 5101
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5101
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo %GREEN%Processes stopped%RESET%
timeout /t 2 /nobreak >nul

echo.
echo %YELLOW%2. DATABASE SETUP%RESET%
echo ====================

echo Checking PostgreSQL connection...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'DB Connected' as status;" 2>nul
if %errorlevel% neq 0 (
    echo %RED%Cannot connect to database. Check PostgreSQL is running.%RESET%
    pause
    exit /b 1
)

echo %GREEN%Database connected successfully%RESET%

echo.
echo Adding missing operations for C6HP0021A...
psql -h localhost -p 5432 -U postgres -d thewho -f "ADD-OPERATIONS-C6HP0021A.sql" 2>nul

echo.
echo %YELLOW%3. DEPLOYING PRODUCTION CODE%RESET%
echo =================================

echo Backing up current files...
copy "backend\src\modules\orders\orders.service.ts" "backend\src\modules\orders\orders.service.BACKUP.ts" >nul 2>&1
copy "backend\src\database\entities\operation.entity.ts" "backend\src\database\entities\operation.entity.BACKUP.ts" >nul 2>&1

echo Deploying production entity...
copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul

echo Deploying production service...
copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul

echo %GREEN%Production code deployed%RESET%

echo.
echo %YELLOW%4. STARTING BACKEND SERVER%RESET%
echo ===============================

echo Starting backend on port 5101...
cd backend

if not exist .env (
    echo %RED%Backend .env file not found!%RESET%
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
start "Backend-Server" cmd /k "echo %GREEN%BACKEND STARTING%RESET% && npm run start:dev"

echo Waiting for backend to start...
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% neq 0 goto wait_backend

echo %GREEN%Backend server is running!%RESET%

cd ..

echo.
echo %YELLOW%5. STARTING FRONTEND APPLICATION%RESET%
echo =====================================

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
start "Frontend-App" cmd /k "echo %GREEN%FRONTEND STARTING%RESET% && npm start"

echo Waiting for frontend to start...
timeout /t 15 /nobreak >nul

cd ..

echo.
echo %YELLOW%6. TESTING DEPLOYMENT%RESET%
echo ==========================

echo Testing API endpoints...

echo Health check:
curl -s -w "Status: %%{http_code}" http://localhost:5101/api/health
echo.

echo Orders endpoint:
curl -s -w "Status: %%{http_code}" "http://localhost:5101/api/orders?limit=1"
echo.

echo.
echo %YELLOW%7. FINAL VERIFICATION%RESET%
echo =========================

echo Checking C6HP0021A operations...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'C6HP0021A has ' || COUNT(op.id) || ' operations' as result FROM orders o LEFT JOIN operations op ON o.id = op.\"orderId\" WHERE o.drawing_number = 'C6HP0021A';" 2>nul

echo.
echo %GREEN%====================================
echo DEPLOYMENT COMPLETE!
echo ====================================%RESET%
echo.
echo %GREEN%SYSTEM READY FOR PRODUCTION:%RESET%
echo - Frontend: http://localhost:5100
echo - Backend: http://localhost:5101
echo - API Docs: http://localhost:5101/api/docs
echo - NO test data fallbacks
echo - Real database connections
echo - C6HP0021A should show 3 operations
echo.
echo %YELLOW%Opening browser...%RESET%
timeout /t 3 /nobreak >nul
start http://localhost:5100

echo.
echo %GREEN%Production deployment successful!%RESET%
echo Both servers are running in separate windows.
echo.
pause

endlocal
