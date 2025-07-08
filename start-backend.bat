@echo off
echo Starting Backend Server...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Start the development server
echo Starting backend on port 5100...
npm run start:dev
