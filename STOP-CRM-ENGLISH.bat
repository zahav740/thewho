@echo off
echo ====================================
echo STOP ALL CRM PROCESSES
echo ====================================
echo.

echo 1. Stopping processes on ports 5100 and 5101...
echo.

echo Terminating processes on port 5100 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5100" ^| find "LISTENING"') do (
    echo Killing process %%a on port 5100...
    taskkill /f /pid %%a >nul 2>&1
)

echo Terminating processes on port 5101 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5101" ^| find "LISTENING"') do (
    echo Killing process %%a on port 5101...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Stopping all Node.js and npm processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo 3. Checking port status...
netstat -aon | find ":5100" | find "LISTENING" >nul
if %errorlevel%==0 (
    echo ⚠️ Port 5100 still occupied
) else (
    echo ✅ Port 5100 is now free
)

netstat -aon | find ":5101" | find "LISTENING" >nul
if %errorlevel%==0 (
    echo ⚠️ Port 5101 still occupied
) else (
    echo ✅ Port 5101 is now free
)

echo.
echo ====================================
echo ALL PROCESSES STOPPED
echo ====================================
echo.
echo Ports 5100 and 5101 are now available.
echo PostgreSQL database service was left running.
echo.
echo You can now start the application with:
echo START-CRM-ENGLISH.bat
echo.
pause
