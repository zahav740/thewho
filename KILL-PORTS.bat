@echo off
echo ====================================
echo KILL ALL PROCESSES ON PORTS 5100/5101
echo ====================================
echo.

echo Killing processes on port 5100 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5100') do (
    echo Terminating PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 5101 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Terminating PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Checking if ports are free...
netstat -aon | findstr :5100 && echo Port 5100 still in use || echo Port 5100 is free ✅
netstat -aon | findstr :5101 && echo Port 5101 still in use || echo Port 5101 is free ✅

echo.
echo All processes killed!
pause
