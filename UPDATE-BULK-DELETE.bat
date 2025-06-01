@echo off
echo ==========================================
echo    UPDATING BULK DELETE WITH FIXES
echo ==========================================
echo.

echo Updating bulk delete modal with improved logic...
echo.

REM Go to frontend directory
cd /d "%~dp0frontend"

echo 1. Fixed bulk operations:
echo    - "Save ALL" button works with ALL orders
echo    - "Delete ALL" button works with ALL orders  
echo    - "Visible" buttons work only with filtered results
echo    - Clear explanations added
echo.

echo 2. Building frontend with updates...

REM Clean old build
if exist "build" rmdir /s /q build

REM Build frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Frontend built with bulk delete fixes!
echo.

REM Stop old frontend
taskkill /f /im serve.cmd >nul 2>&1

REM Start new frontend
echo Starting updated frontend...
start "Production CRM Frontend" cmd /k "serve -s build -l 80"

echo.
echo Waiting for frontend startup...
timeout /t 8 /nobreak >nul

echo.
echo ==========================================
echo   BULK DELETE LOGIC FIXED AND UPDATED
echo ==========================================
echo.
echo New buttons available:
echo  [Сохранить ВСЕ] - Mark ALL orders for saving
echo  [Удалить ВСЕ]   - Mark ALL orders for deletion  
echo  [Сохранить видимые] - Only filtered orders
echo  [Удалить видимые]   - Only filtered orders
echo.
echo Frontend: http://localhost
echo.

start http://localhost

echo Bulk delete now works with ALL orders, not just visible ones!
pause
