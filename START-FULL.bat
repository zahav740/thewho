@echo off
echo ====================================
echo PRODUCTION CRM FULL START
echo ====================================
echo.

echo 1. STOPPING EXISTING PROCESSES
echo ===============================

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
echo.

echo 2. CHECKING POSTGRESQL
echo =======================

echo Checking PostgreSQL connection...

netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo PostgreSQL is listening on port 5432
) else (
    echo PostgreSQL is not listening on port 5432
    echo Please start PostgreSQL manually
)

echo.

echo 3. CHECKING DATABASE
echo ====================

echo Testing database connection...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Connection successful!' as status;" >nul 2>&1
if %errorlevel% equ 0 (
    echo Database connection successful
    echo.
    echo Checking tables...
    psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>nul
    echo.
    echo Checking operations for order C6HP0021A...
    psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT o.drawing_number, op.sequence_number, op.operation_type, op.machine, op.status FROM orders o LEFT JOIN operations op ON o.id = op.order_id WHERE o.drawing_number = 'C6HP0021A' ORDER BY op.sequence_number;" 2>nul
    
) else (
    echo Cannot connect to database
    echo Check that:
    echo - PostgreSQL is running
    echo - Database 'thewho' exists
    echo - User 'postgres' with password 'magarel'
    pause
    exit /b 1
)

echo.

echo 4. STARTING BACKEND SERVER
echo ==========================

echo Going to backend directory...
cd backend

if not exist package.json (
    echo package.json not found in backend directory
    pause
    exit /b 1
)

echo Installing dependencies if needed...
call npm install --silent

echo.
echo Starting backend server on port 5101...
start "Backend-Server" cmd /k "echo BACKEND STARTING && npm run start:dev"

echo Waiting 10 seconds for backend to start...
timeout /t 10 /nobreak >nul

curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend server started successfully
) else (
    echo Backend server is not responding
    echo Check the backend server window for errors
)

cd ..

echo.

echo 5. STARTING FRONTEND APPLICATION
echo ================================

echo Going to frontend directory...
cd frontend

if not exist package.json (
    echo package.json not found in frontend directory
    pause
    exit /b 1
)

echo Installing dependencies if needed...
call npm install --silent

echo.
echo Starting frontend application on port 5100...
start "Frontend-App" cmd /k "echo FRONTEND STARTING && npm start"

echo Waiting 15 seconds for frontend to start...
timeout /t 15 /nobreak >nul

cd ..

echo.

echo 6. TESTING API ENDPOINTS
echo =========================

echo Testing API endpoints...

echo.
echo Health check:
curl -s -w "HTTP code: %%{http_code}" http://localhost:5101/api/health
echo.

echo.
echo Calendar test:
curl -s -w "HTTP code: %%{http_code}" http://localhost:5101/api/calendar/test
echo.

echo.
echo Orders test:
curl -s -w "HTTP code: %%{http_code}" "http://localhost:5101/api/orders?limit=5"
echo.

echo.
echo Machines test:
curl -s -w "HTTP code: %%{http_code}" http://localhost:5101/api/machines
echo.

echo.

echo 7. OPERATIONS DIAGNOSTICS
echo =========================

echo Checking operations in database...

psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Total orders:' as info, COUNT(*) as count FROM orders UNION ALL SELECT 'Total operations:' as info, COUNT(*) as count FROM operations UNION ALL SELECT 'Order C6HP0021A:' as info, COUNT(*) as count FROM orders o LEFT JOIN operations op ON o.id = op.order_id WHERE o.drawing_number = 'C6HP0021A';" 2>nul

echo.
echo Detailed info for order C6HP0021A:

psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT o.id as order_id, o.drawing_number, o.quantity, o.priority, op.id as operation_id, op.sequence_number, op.operation_type, op.machine, op.estimated_time, op.status, op.created_at FROM orders o LEFT JOIN operations op ON o.id = op.order_id WHERE o.drawing_number = 'C6HP0021A' ORDER BY op.sequence_number;" 2>nul

echo.

echo 8. LAUNCH COMPLETE
echo ==================

echo LAUNCH COMPLETE!
echo.
echo URLs:
echo Frontend: http://localhost:5100
echo Backend API: http://localhost:5101/api
echo API Docs: http://localhost:5101/api/docs
echo Health Check: http://localhost:5101/api/health
echo.
echo Server log windows have been opened separately.
echo Check them for errors if something is not working.
echo.
echo If operations issues persist - check the data above.
echo.
pause
