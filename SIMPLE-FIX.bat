@echo off
cls
echo QUICK DATABASE FIX
echo ==================

echo.
echo Step 1: Starting Backend...
cd /d C:\Users\Alexey\Downloads\thewho-main\backend

curl -s http://localhost:5100/api/orders >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Backend is running OK
) else (
    echo Starting backend...
    start /MIN cmd /c "npm run start:dev"
    echo Waiting 15 seconds...
    timeout /t 15 /nobreak >nul
)

echo.
echo Step 2: Creating test orders...

curl -X POST http://localhost:5100/api/orders ^
-H "Content-Type: application/json" ^
-d "{\"drawingNumber\":\"TEST-001\",\"quantity\":10,\"deadline\":\"2025-08-15T00:00:00.000Z\",\"priority\":2,\"workType\":\"Test Work\",\"operations\":[]}" >nul 2>&1

curl -X POST http://localhost:5100/api/orders ^
-H "Content-Type: application/json" ^
-d "{\"drawingNumber\":\"TEST-002\",\"quantity\":5,\"deadline\":\"2025-08-20T00:00:00.000Z\",\"priority\":1,\"workType\":\"Test Work\",\"operations\":[]}" >nul 2>&1

echo Test orders created

echo.
echo Step 3: Checking result...
curl -s http://localhost:5100/api/orders >test_result.json

if exist test_result.json (
    echo API is working
    del test_result.json >nul 2>&1
) else (
    echo API problem
)

echo.
echo Step 4: Starting frontend...
cd /d C:\Users\Alexey\Downloads\thewho-main\frontend

curl -s http://localhost:5101 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Frontend is running OK
) else (
    echo Starting frontend...
    start /MIN cmd /c "npm start"
)

echo.
echo DONE!
echo Open: http://localhost:5101/database
echo.
pause
