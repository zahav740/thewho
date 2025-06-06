@echo off
echo ====================================
echo FORCE START - IGNORE TYPESCRIPT ERRORS
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
echo Step 3: Force starting backend (ignoring TypeScript errors)...
echo.
echo IMPORTANT: Watch for operation-related logs:
echo - "OrdersService.create: Начало создания заказа"
echo - "OrdersService.create: Создание N операций"
echo - "OrdersService.create: Операции сохранены"
echo.

cd backend

start /min cmd /k "title Frontend Server && cd ..\frontend && echo Starting frontend on port 5100... && npm start"

echo Backend starting with detailed logs...
echo Create an order with operations in the UI to see logs!
echo.

npm run start:dev

echo.
echo ====================================
echo SERVERS STOPPED
echo ====================================
pause
