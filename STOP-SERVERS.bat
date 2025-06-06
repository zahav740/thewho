@echo off
echo ====================================
echo STOP SERVERS
echo ====================================
echo.

echo Stopping processes on port 5100 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5100') do (
    echo Killing process %%a on port 5100
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Stopping processes on port 5101 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5101') do (
    echo Killing process %%a on port 5101
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo ✅ All servers stopped!
echo Ports 5100 and 5101 are now free.
echo.
pause
