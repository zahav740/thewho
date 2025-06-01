@echo off
echo ==========================================
echo     PRODUCTION CRM - SIMPLE START
echo ==========================================
echo.

echo Starting Production CRM...
echo.

REM Check administrator rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator rights required!
    pause
    exit /b 1
)

echo Administrator rights OK
echo.

REM Stop old processes
echo Stopping old processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
timeout /t 3 /nobreak >nul

REM Check PostgreSQL
echo Checking PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL...
    net start postgresql >nul 2>&1
    timeout /t 5 /nobreak >nul
)

echo PostgreSQL ready
echo.

REM Backend
echo Starting Backend...
cd /d "%~dp0backend"

echo - Installing dependencies...
call npm install >nul 2>&1

echo - Building...
call npm run build >nul 2>&1

echo - Starting in production...
start "Production CRM Backend" cmd /k "echo Backend starting... && npm run start:prod"

echo Waiting for backend (30 sec)...
timeout /t 30 /nobreak >nul

echo Backend started
echo.

REM Frontend
echo Starting Frontend...
cd /d "%~dp0frontend"

echo - Installing dependencies...
call npm install >nul 2>&1

echo - Building...
call npm run build >nul 2>&1

echo - Installing serve...
call npm install -g serve >nul 2>&1

echo - Starting static server...
start "Production CRM Frontend" cmd /k "echo Frontend starting... && serve -s build -l 3000"

echo Waiting for frontend (20 sec)...
timeout /t 20 /nobreak >nul

echo Frontend started
echo.

REM Check system
echo Checking system...
echo.

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Backend API working
) else (
    echo ERROR: Backend API not responding
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Frontend working
) else (
    echo ERROR: Frontend not responding
)

echo.
echo ==========================================
echo      PRODUCTION CRM STARTED!
echo ==========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:3001
echo API Docs:  http://localhost:3001/api/docs
echo.

REM Open browser
start http://localhost:3000
start http://localhost:3001/api/docs

echo Done! Check "Production CRM Backend" and "Production CRM Frontend" windows
echo.
pause
