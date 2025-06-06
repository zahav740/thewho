@echo off
echo ====================================
echo CLEAN REINSTALL DEPENDENCIES
echo ====================================
echo.

echo Step 1: Cleaning Backend dependencies...
cd backend
if exist node_modules (
    echo Removing backend node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing backend package-lock.json...
    del package-lock.json
)

echo.
echo Step 2: Installing Backend dependencies...
call npm install

echo.
echo Step 3: Cleaning Frontend dependencies...
cd ..\frontend
if exist node_modules (
    echo Removing frontend node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing frontend package-lock.json...
    del package-lock.json
)

echo.
echo Step 4: Installing Frontend dependencies...
call npm install

echo.
echo ====================================
echo DEPENDENCIES REINSTALLED!
echo ====================================
echo.
echo Next steps:
echo 1. Run START-CLEAN.bat to start both servers
echo 2. Or start manually:
echo    - Backend: cd backend && npm run start:dev
echo    - Frontend: cd frontend && npm start
echo.
pause
