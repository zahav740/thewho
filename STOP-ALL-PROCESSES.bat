@echo off
echo ====================================
echo STOP ALL CRM PROCESSES
echo ====================================
echo.

echo 1. Stopping processes on ports 3000, 3001, 5100, and 5101...
echo.

echo Killing processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Found process %%a on port 3000, killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Found process %%a on port 3001, killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 5100...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5100" ^| find "LISTENING"') do (
    echo Found process %%a on port 5100, killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 5101...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5101" ^| find "LISTENING"') do (
    echo Found process %%a on port 5101, killing...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Stopping all Node.js and npm processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo ====================================
echo ALL PROCESSES STOPPED
echo ====================================
echo.
echo Ports 3000, 3001, 5100, and 5101 are now free.
echo All Node.js and npm processes have been terminated.
echo.
pause
