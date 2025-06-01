@echo off
echo ==========================================
echo        PRODUCTION DEPLOYMENT - CRM
echo ==========================================
echo.

REM Administrator check
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Run as Administrator!
    pause
    exit /b 1
)

REM Stop all processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1

REM Set PRODUCTION environment
set NODE_ENV=production
set PORT=80
set BACKEND_PORT=3001

echo PRODUCTION MODE ENABLED
echo.

REM Start PostgreSQL
net start postgresql >nul 2>&1
timeout /t 3 /nobreak >nul

REM BACKEND PRODUCTION BUILD
echo [1/4] Backend Production Build...
cd /d "%~dp0backend"
call npm ci --only=production --silent
call npm run build --silent
if %errorlevel% neq 0 (
    echo BACKEND BUILD FAILED!
    pause
    exit /b 1
)

REM FRONTEND PRODUCTION BUILD  
echo [2/4] Frontend Production Build...
cd /d "%~dp0frontend"
call npm ci --only=production --silent
call npm run build --silent
if %errorlevel% neq 0 (
    echo FRONTEND BUILD FAILED!
    pause
    exit /b 1
)

REM START BACKEND IN PRODUCTION
echo [3/4] Starting Backend Production Server...
cd /d "%~dp0backend"
start "CRM-Backend-PROD" /min cmd /c "npm run start:prod"
timeout /t 15 /nobreak >nul

REM START FRONTEND PRODUCTION SERVER
echo [4/4] Starting Frontend Production Server...
cd /d "%~dp0frontend"
call npm install -g serve --silent
start "CRM-Frontend-PROD" /min cmd /c "serve -s build -l 80 --single"
timeout /t 10 /nobreak >nul

REM PRODUCTION HEALTH CHECK
echo.
echo PRODUCTION HEALTH CHECK:
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend Production: ONLINE
) else (
    echo ✗ Backend Production: FAILED
)

curl -s http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend Production: ONLINE  
) else (
    echo ✗ Frontend Production: FAILED
)

echo.
echo ==========================================
echo    PRODUCTION CRM SYSTEM DEPLOYED
echo ==========================================
echo.
echo PRODUCTION URLs:
echo Frontend: http://localhost
echo Backend:  http://localhost:3001
echo API Docs: http://localhost:3001/api/docs
echo.
echo System is running in PRODUCTION MODE
echo.

start http://localhost
pause
