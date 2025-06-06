@echo off
echo ====================================
echo PRODUCTION CRM - RESTART & RUN
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

taskkill /f /im node.exe >nul 2>&1

echo.
echo Step 2: Waiting 3 seconds for ports to clear...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting Backend server on port 5101...
echo IMPORTANT: Watch for operation creation logs:
echo - "OrdersService.create: Начало создания заказа"
echo - "OrdersService.create: Создание N операций"  
echo - "OrdersService.create: Операции сохранены"
echo - "OrdersService.create: Проверка - найдено N операций"
echo.

start /min cmd /k "title Frontend Server (Port 5100) && cd ..\frontend && echo Starting Frontend... && npm start"

echo Frontend starting in minimized window...
echo Backend logs will show below:
echo.

cd backend
npm run start:dev

echo.
echo ====================================
echo SERVERS STOPPED
echo ====================================
pause
