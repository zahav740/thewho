@echo off
echo ============================================
echo  STARTING FRONTEND SERVER - PORT 3000
echo ============================================
echo.
echo This script ensures the frontend is running
echo correctly on port 3000.
echo.
echo IMPORTANT: Make sure the backend is already
echo running before starting the frontend!
echo.
echo ============================================
echo.
echo Stopping previous frontend instances...

echo Stopping service on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak > nul
echo.
echo Checking frontend configuration...
cd frontend

echo Checking package.json...
if not exist package.json (
    echo ERROR: package.json not found in frontend directory!
    echo Make sure you're running this script from the correct location.
    goto :error
)

echo Verifying node_modules...
if not exist node_modules (
    echo Node modules not found, installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install dependencies!
        goto :error
    )
)

echo.
echo Starting frontend...
echo.
echo *** IMPORTANT: Leave this window open while using the application ***
echo.
echo The frontend should start in a moment...
echo When ready, it will automatically open in your browser.
echo.

:: Start React app in development mode
call npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Frontend failed to start!
    echo Check the error messages above for details.
    goto :error
)

goto :end

:error
echo.
echo ============================================
echo  ERROR STARTING FRONTEND
echo ============================================
echo.
echo Please check the following:
echo 1. Make sure no other application is using port 3000
echo 2. Check if Node.js is installed correctly
echo 3. Verify proxy settings in package.json
echo 4. Make sure backend is running on port 3001
echo.
pause
exit /b 1

:end
