@echo off
echo Installing missing backend dependencies...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Installing helmet...
npm install helmet
npm install @types/helmet --save-dev

echo Installing @nestjs/schedule...
npm install @nestjs/schedule

echo Dependencies installed successfully!
echo.
echo Now you can start the backend with:
echo npm run start:dev
pause
