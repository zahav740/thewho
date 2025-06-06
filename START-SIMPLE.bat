@echo off
echo ====================================
echo QUICK START PRODUCTION CRM
echo ====================================
echo.

echo Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do taskkill /F /PID %%a >nul 2>&1

echo.
echo Checking PostgreSQL...
netstat -ano | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo PostgreSQL not running! Start it first.
    pause
    exit /b 1
)

echo.
echo Applying fixes...
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-SIMPLE.sql" >nul 2>&1

if exist "backend\src\database\entities\operation.entity.SAFE.ts" (
    copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul
)

if exist "backend\src\database\entities\machine.entity.FIXED.ts" (
    copy /Y "backend\src\database\entities\machine.entity.FIXED.ts" "backend\src\database\entities\machine.entity.ts" >nul
)

if exist "backend\src\modules\orders\orders.service.PRODUCTION.ts" (
    copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul
)

echo.
echo Starting backend...
cd backend
start "Backend" cmd /k "npm run start:dev"
cd ..

echo Waiting 10 seconds...
timeout /t 10 /nobreak >nul

echo.
echo Starting frontend...
cd frontend
start "Frontend" cmd /k "npm start"
cd ..

echo Waiting 15 seconds...
timeout /t 15 /nobreak >nul

echo.
echo Testing APIs...
curl -s -w "Health: %%{http_code}" http://localhost:5101/api/health
echo.
curl -s -w "Orders: %%{http_code}" "http://localhost:5101/api/orders?limit=1"
echo.

echo.
echo Opening browser...
start http://localhost:5100

echo.
echo DONE!
echo Frontend: http://localhost:5100
echo Backend:  http://localhost:5101
echo.
pause
