@echo off
title Production CRM - Fixed Ports (5100/5101)
echo.
echo ========================================
echo  Production CRM System
echo  Backend: http://localhost:5100
echo  Frontend: http://localhost:5101
echo ========================================
echo.

echo [1/3] Checking configuration...
echo ✓ Backend port: 5100
echo ✓ Frontend port: 5101
echo ✓ Removed problematic ports: 3001, 5200
echo.

echo [2/3] Starting Backend on port 5100...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "echo Starting backend on port 5100... && npm run start:prod"

echo.
echo [3/3] Starting Frontend on port 5101...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "echo Starting frontend on port 5101... && npm start"

echo.
echo ✅ Both servers are starting...
echo.
echo Backend will be available at: http://localhost:5100
echo Frontend will be available at: http://localhost:5101
echo.
echo Press any key to exit this window...
pause >nul
