@echo off
echo ====================================
echo CONFIGURATION CHECK
echo ====================================
echo.

echo 📋 Checking configuration files...
echo.

echo 1. Frontend .env:
findstr "REACT_APP_API_URL\|PORT" frontend\.env
echo.

echo 2. Backend .env:
findstr "PORT\|CORS_ORIGIN" backend\.env
echo.

echo 3. Package.json configurations:
echo Frontend start script:
findstr "start" frontend\package.json
echo.

echo 4. Testing if ports are free:
echo.
netstat -aon | find ":5101" | find "LISTENING" >nul
if %errorlevel%==0 (
    echo ❌ Port 5101 is OCCUPIED
) else (
    echo ✅ Port 5101 is FREE
)

netstat -aon | find ":5100" | find "LISTENING" >nul
if %errorlevel%==0 (
    echo ❌ Port 5100 is OCCUPIED
) else (
    echo ✅ Port 5100 is FREE
)

echo.
echo 5. Current configuration should be:
echo ✅ Frontend: http://localhost:5101
echo ✅ Backend: http://localhost:5100
echo ✅ API URL: http://localhost:5100/api
echo ✅ Database: localhost:5432 (magarel)
echo.

echo ====================================
echo CONFIGURATION CHECK COMPLETE
echo ====================================
pause
