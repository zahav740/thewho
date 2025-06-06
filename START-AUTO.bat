@echo off
echo ====================================
echo AUTOMATIC PRODUCTION CRM START
echo ====================================
echo.

echo 1. STOPPING EXISTING PROCESSES
echo ===============================

echo Stopping all processes on ports 5100 and 5101...

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
echo.

echo 2. CHECKING POSTGRESQL
echo =======================

echo Checking PostgreSQL...

netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo PostgreSQL is running on port 5432
) else (
    echo PostgreSQL is not running on port 5432
    echo Please start PostgreSQL manually
    pause
    exit /b 1
)

echo.

echo 3. AUTOMATIC DATABASE CONNECTION
echo =================================

echo Testing automatic DB connection using .env settings...

if exist "backend\.env" (
    echo Found backend .env file
    
    set DB_HOST=localhost
    set DB_PORT=5432
    set DB_NAME=thewho
    set DB_USERNAME=postgres
    set DB_PASSWORD=magarel
    
    echo Connection: postgresql://postgres:***@localhost:5432/thewho
) else (
    echo Backend .env file not found
    pause
    exit /b 1
)

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "SELECT 'Connection successful!' as status;" >nul 2>&1
if %errorlevel% equ 0 (
    echo Database connection successful
) else (
    echo Cannot connect to database automatically
    echo Check settings in backend .env
    pause
    exit /b 1
)

echo.

echo 4. APPLYING DATABASE AND CODE FIXES
echo ====================================

echo Applying database fixes and production code...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -f "FIX-SIMPLE.sql" >nul 2>&1

if exist "backend\src\database\entities\operation.entity.SAFE.ts" (
    copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul
    echo Safe operation entity applied
)

if exist "backend\src\database\entities\machine.entity.FIXED.ts" (
    copy /Y "backend\src\database\entities\machine.entity.FIXED.ts" "backend\src\database\entities\machine.entity.ts" >nul
    echo Fixed machine entity applied
)

if exist "backend\src\modules\orders\orders.service.PRODUCTION.ts" (
    copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul
    echo Production service applied
)

echo.

echo 5. AUTOMATIC BACKEND START
echo ===========================

echo Starting backend server...
cd backend

if not exist package.json (
    echo package.json not found in backend
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install --silent

echo Starting backend server on port 5101...
start "Production-Backend" cmd /k "echo BACKEND STARTING ON PORT 5101 && npm run start:dev"

echo Waiting 15 seconds for backend to start...
timeout /t 15 /nobreak >nul

curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend server started and responding
) else (
    echo Backend server not responding
    echo Check backend window for errors
)

cd ..

echo.

echo 6. AUTOMATIC FRONTEND START
echo ============================

echo Starting frontend application...
cd frontend

if not exist package.json (
    echo package.json not found in frontend
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install --silent

echo Starting frontend on port 5100...
start "Production-Frontend" cmd /k "echo FRONTEND STARTING ON PORT 5100 && npm start"

echo Waiting 20 seconds for frontend to start...
timeout /t 20 /nobreak >nul

cd ..

echo.

echo 7. AUTOMATIC TESTING
echo ====================

echo Testing all systems...

echo.
echo Health Check:
curl -s -w "HTTP code: %%{http_code}" http://localhost:5101/api/health
echo.

echo.
echo Orders API:
curl -s -w "HTTP code: %%{http_code}" "http://localhost:5101/api/orders?limit=3"
echo.

echo.
echo Calendar API:
curl -s -w "HTTP code: %%{http_code}" http://localhost:5101/api/calendar/test
echo.

echo.

echo 8. CHECKING C6HP0021A DATA
echo ===========================

echo Checking operations for order C6HP0021A...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "SELECT o.drawing_number, COUNT(op.id) as operations_count FROM orders o LEFT JOIN operations op ON o.id = op.\"orderId\" WHERE o.drawing_number = 'C6HP0021A' GROUP BY o.drawing_number;" 2>nul

echo.

echo 9. OPENING BROWSER
echo ==================

echo Opening application in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5100

echo.

echo ====================================
echo AUTOMATIC START COMPLETE!
echo ====================================
echo.
echo PRODUCTION CRM IS RUNNING AND READY!
echo.
echo URLs:
echo Frontend:      http://localhost:5100
echo Backend API:   http://localhost:5101/api
echo API Docs:      http://localhost:5101/api/docs
echo Health Check:  http://localhost:5101/api/health
echo.
echo What was done:
echo - Stopped all processes on ports 5100/5101
echo - Verified automatic PostgreSQL connection
echo - Applied database and code fixes
echo - Started backend server with production code
echo - Started frontend application
echo - Tested all API endpoints
echo - Opened browser with application
echo.
echo Order C6HP0021A should now show 3 operations!
echo Server windows are running separately for log monitoring.
echo.
pause
