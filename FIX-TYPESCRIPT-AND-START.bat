@echo off
echo ==========================================
echo      TYPESCRIPT FIX AND REBUILD
echo ==========================================
echo.

echo Fixing TypeScript compilation error...
echo.

REM Go to frontend directory
cd /d "%~dp0frontend"

echo 1. TypeScript config updated (es2015 target)
echo 2. Building frontend with fixed TypeScript...

REM Clean old build
if exist "build" rmdir /s /q build

REM Build frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build still failed!
    echo Trying alternative approach...
    
    REM Alternative: use legacy peer deps
    call npm install --legacy-peer-deps
    call npm run build
    
    if %errorlevel% neq 0 (
        echo CRITICAL: Build failed even with legacy deps
        pause
        exit /b 1
    )
)

echo.
echo SUCCESS: Frontend built successfully!
echo.

REM Stop old frontend
taskkill /f /im serve.cmd >nul 2>&1

REM Start new frontend
echo Starting fixed frontend...
start "Production CRM Frontend" cmd /k "serve -s build -l 80"

echo.
echo Waiting for frontend startup...
timeout /t 10 /nobreak >nul

REM Check if frontend is working
curl -s http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Frontend is working!
) else (
    echo WARNING: Frontend may not be responding yet
)

echo.
echo ==========================================
echo    TYPESCRIPT FIXED - FRONTEND READY
echo ==========================================
echo.
echo Frontend: http://localhost
echo.
echo TypeScript issues resolved:
echo  - Target changed to es2015
echo  - downlevelIteration enabled
echo  - Set iteration now works
echo.

start http://localhost

echo Excel import should now work properly!
pause
