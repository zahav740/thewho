@echo off
echo ====================================
echo QUICK START - SKIP DB CHECKS
echo ====================================
echo.

echo Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do taskkill /F /PID %%a >nul 2>&1
echo Processes stopped

echo.
echo Applying code fixes...

if exist "backend\src\database\entities\operation.entity.SAFE.ts" (
    copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul
    echo Operation entity fixed
)

if exist "backend\src\database\entities\machine.entity.FIXED.ts" (
    copy /Y "backend\src\database\entities\machine.entity.FIXED.ts" "backend\src\database\entities\machine.entity.ts" >nul
    echo Machine entity fixed
)

if exist "backend\src\modules\orders\orders.service.PRODUCTION.ts" (
    copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul
    echo Production service applied
)

echo.
echo Starting backend...
cd backend
start "Backend-5101" cmd /k "echo BACKEND STARTING && npm run start:dev"
cd ..

echo Waiting 12 seconds for backend compilation...
timeout /t 12 /nobreak >nul

echo.
echo Starting frontend...
cd frontend
start "Frontend-5100" cmd /k "echo FRONTEND STARTING && npm start"
cd ..

echo Waiting 15 seconds for frontend...
timeout /t 15 /nobreak >nul

echo.
echo Testing connections...
curl -s -w "Health: %%{http_code}" http://localhost:5101/api/health
echo.
curl -s -w "Orders: %%{http_code}" "http://localhost:5101/api/orders?limit=1"
echo.

echo.
echo Opening browser...
start http://localhost:5100

echo.
echo ====================================
echo QUICK START COMPLETE!
echo ====================================
echo.
echo URLs:
echo Frontend: http://localhost:5100
echo Backend:  http://localhost:5101/api
echo.
echo Check server windows for any errors.
echo Database connection will be handled by backend automatically.
echo.
pause
