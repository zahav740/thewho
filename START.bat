@echo off
echo ====================================
echo PRODUCTION CRM - COMPLETE LAUNCHER
echo ====================================
echo.

echo Step 1: Stopping all processes on ports 5100 and 5101...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5100') do (
    echo Killing process %%a on port 5100
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Killing process %%a on port 5101
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Step 2: Waiting 3 seconds for ports to clear...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Installing/updating dependencies if needed...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo Step 4: Starting Frontend server (minimized window)...
start /min cmd /k "title Frontend Server - Port 5100 && cd /d \"%~dp0frontend\" && echo Frontend starting on http://localhost:5100 && npm start"

echo.
echo Step 5: Starting Backend server with detailed operation logs...
echo.
echo ============================================
echo OPERATION LOGGING - WATCH FOR THESE LOGS:
echo ============================================
echo ✓ "OrdersService.create: Начало создания заказа"
echo ✓ "OrdersService.create: Заказ создан с ID X"
echo ✓ "OrdersService.create: Создание N операций"
echo ✓ "OrdersService.create: Создаем операцию"
echo ✓ "OrdersService.create: Операции сохранены (N)"
echo ✓ "OrdersService.create: Проверка - найдено N операций"
echo ============================================
echo.
echo Frontend: http://localhost:5100
echo Backend:  http://localhost:5101
echo API Docs: http://localhost:5101/api/docs
echo.
echo Press Ctrl+C to stop both servers
echo.

cd ..\backend
npm run start:dev

echo.
echo ====================================
echo SERVERS STOPPED
echo ====================================
echo.
echo Both Frontend and Backend have been stopped.
echo Frontend window should close automatically.
echo.
pause
