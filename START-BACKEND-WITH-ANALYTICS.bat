@echo off
echo Starting Production CRM Backend with Analytics Module...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Starting backend server...
npm run start:dev

pause
