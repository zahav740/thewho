@echo off
echo ==========================================
echo      PRODUCTION CRM - ENHANCED START
echo ==========================================
echo.

echo Starting Production CRM with all fixes...
echo.

REM Check administrator rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator rights required!
    echo Please run as Administrator
    pause
    exit /b 1
)

echo Administrator rights OK
echo.

REM Stop old processes
echo Stopping old processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
taskkill /f /im serve.cmd >nul 2>&1

REM Clear specific ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :80') do (
    taskkill /f /pid %%a >nul 2>&1
)

timeout /t 3 /nobreak >nul
echo Processes stopped
echo.

REM Check PostgreSQL
echo Checking PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL...
    net start postgresql >nul 2>&1
    net start postgresql-x64-14 >nul 2>&1
    timeout /t 5 /nobreak >nul
    
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: PostgreSQL failed to start!
        echo Check PostgreSQL installation and service
        pause
        exit /b 1
    )
)

echo PostgreSQL ready
echo.

REM Backend
echo Starting Backend...
cd /d "%~dp0backend"

echo - Installing dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend npm install failed!
    call npm install
    pause
    exit /b 1
)

echo - Building backend...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    call npm run build
    pause
    exit /b 1
)

echo - Starting backend in production...
start "Production CRM Backend" cmd /k "echo Backend starting on :3001... && npm run start:prod"

echo Waiting for backend startup (30 sec)...
timeout /t 30 /nobreak >nul

REM Check backend health
echo Checking backend health...
curl -s http://localhost:3001/api/orders >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Backend API responding
) else (
    echo WARNING: Backend may still be starting...
    timeout /t 10 /nobreak >nul
)

echo Backend started
echo.

REM Frontend  
echo Starting Frontend with all fixes...
cd /d "%~dp0frontend"

echo - Installing dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Frontend npm install failed!
    call npm install
    pause
    exit /b 1
)

echo - Building frontend with fixes...
echo   * Context menu positioning fix
echo   * Excel import API fix  
echo   * SVG error suppression
echo   * Bulk delete with exclusions
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    call npm run build
    pause
    exit /b 1
)

echo - Installing serve...
call npm install -g serve >nul 2>&1

echo - Starting frontend on port 80...
start "Production CRM Frontend - ENHANCED" cmd /k "echo Frontend starting on :80... && serve -s build -l 80"

echo Waiting for frontend startup (20 sec)...
timeout /t 20 /nobreak >nul

REM System health check
echo.
echo Performing system health check...
echo.

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend API: WORKING
) else (
    echo ✗ Backend API: NOT RESPONDING
)

curl -s http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend: WORKING  
) else (
    echo ✗ Frontend: NOT RESPONDING
)

curl -s http://localhost:3001/api/orders >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Orders API: WORKING
) else (
    echo ✗ Orders API: NOT RESPONDING
)

echo.
echo ==========================================
echo    PRODUCTION CRM ENHANCED - READY!
echo ==========================================
echo.
echo NEW FEATURES:
echo ✓ Right-click context menu (properly positioned)
echo ✓ Delete selected orders (batch delete)
echo ✓ Delete all with exclusions (choose which to keep)
echo ✓ Excel import (fixed API endpoint)  
echo ✓ SVG errors suppressed
echo ✓ Detailed error logging
echo.
echo ACCESS URLS:
echo Frontend:     http://localhost
echo Backend API:  http://localhost:3001
echo API Docs:     http://localhost:3001/api/docs
echo Health:       http://localhost:3001/api/health
echo.
echo USAGE:
echo 1. Right-click on table for context menu
echo 2. "Delete all with exclusions" for selective delete
echo 3. Excel import now saves to database
echo 4. Clean production-ready database
echo.

REM Open browser
start http://localhost
timeout /t 2 /nobreak >nul
start http://localhost:3001/api/docs

echo.
echo System ready! Check both browser windows.
echo Backend logs: "Production CRM Backend" window
echo Frontend logs: "Production CRM Frontend - ENHANCED" window
echo.
pause
