@echo off
echo Installing authentication dependencies...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Installing backend dependencies...
npm install @nestjs/jwt@^10.1.0 @nestjs/passport@^10.0.0 bcryptjs@^2.4.3 passport@^0.6.0 passport-jwt@^4.0.1 passport-local@^1.0.0

echo Installing dev dependencies...
npm install --save-dev @types/bcryptjs@^2.4.2 @types/passport-jwt@^3.0.8 @types/passport-local@^1.0.35

echo Backend dependencies installed successfully!
echo.
echo Starting backend server...
npm run start:dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying alternative start method...
    npm run start:direct
)

pause
