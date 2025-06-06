@echo off
echo ====================================
echo DATABASE OPERATIONS TEST
echo ====================================
echo.

echo Checking if operations are saved in PostgreSQL...
echo.

echo Expected results:
echo - TH1K4108A should have 2 operations
echo - C6HP0021A should have 1 operation  
echo - G63828A should have 2 operations
echo.

echo Starting backend to test API...
echo Press Ctrl+C to stop when testing is done
echo.

cd backend
npm run start:dev

pause
