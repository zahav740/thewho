@echo off
echo ==========================================
echo      REBUILD FRONTEND WITH FIXES
echo ==========================================
echo.

echo Rebuilding frontend with Excel import fixes...
echo.

REM Stop current frontend
echo Stopping current frontend...
taskkill /f /im serve.cmd >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :80') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 3 /nobreak >nul

REM Go to frontend directory
cd /d "%~dp0frontend"

echo Cleaning old build...
rmdir /s /q build >nul 2>&1

echo Installing dependencies...
call npm install >nul 2>&1

echo Building with fixes...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo Starting frontend on port 80...
start "Production CRM Frontend" cmd /k "serve -s build -l 80"

echo Waiting for startup...
timeout /t 10 /nobreak >nul

echo.
echo ==========================================
echo    FRONTEND REBUILT AND RESTARTED
echo ==========================================
echo.
echo Frontend: http://localhost
echo.

start http://localhost

echo Frontend updated with Excel import fixes!
pause
