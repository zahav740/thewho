@echo off
echo ====================================
echo BACKEND LOGS MONITOR
echo ====================================
echo.

echo This script will start backend with detailed logging
echo You can then test order creation from frontend
echo All operation-related logs will be visible here
echo.

echo Starting backend with detailed operation logs...
echo Watch for lines containing:
echo - "OrdersService.create"
echo - "операции"
echo - "operations"
echo.
echo Press Ctrl+C to stop
echo.

cd backend
npm run start:dev

pause
