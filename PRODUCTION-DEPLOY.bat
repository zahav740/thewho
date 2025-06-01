@echo off
echo ==========================================
echo      PRODUCTION CRM - REAL PRODUCTION
echo ==========================================

REM PRODUCTION CONFIGURATION
set NODE_ENV=production
set PORT=3001
set FRONTEND_PORT=80

REM STOP ALL DEVELOPMENT PROCESSES
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1

echo PRODUCTION DEPLOYMENT STARTING...
echo.

REM POSTGRESQL PRODUCTION START
echo Starting PostgreSQL for production...
net start postgresql >nul 2>&1

REM BACKEND PRODUCTION
echo Building Backend for PRODUCTION...
cd /d "%~dp0backend"
call npm install --production --silent
call npm run build --silent

echo Starting Backend PRODUCTION server...
start "PRODUCTION-BACKEND" cmd /c "npm run start:prod"

REM FRONTEND PRODUCTION  
echo Building Frontend for PRODUCTION...
cd /d "%~dp0frontend"
call npm install --production --silent
call npm run build --silent

echo Installing production server...
call npm install -g serve --silent

echo Starting Frontend PRODUCTION server on port 80...
start "PRODUCTION-FRONTEND" cmd /c "serve -s build -l 80"

echo.
echo Waiting for services to start...
timeout /t 20 /nobreak >nul

echo.
echo ==========================================
echo     PRODUCTION SYSTEM IS LIVE
echo ==========================================
echo.
echo PRODUCTION ACCESS:
echo Main App: http://localhost
echo API:      http://localhost:3001  
echo Docs:     http://localhost:3001/api/docs
echo.

start http://localhost

echo PRODUCTION DEPLOYMENT COMPLETE
pause
