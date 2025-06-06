@echo off
echo ====================================
echo BACKEND ONLY - CLEAN START
echo ====================================
echo.

echo Step 1: Killing backend process on port 5101...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Killing process %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Step 2: Cleaning dependencies...
cd backend

if exist node_modules (
    echo Removing node_modules directory...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo Step 3: Installing fresh dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Starting backend server...
echo Backend will start on port 5101
echo Press Ctrl+C to stop the server
echo.

call npm run start:dev

pause
