@echo off
echo ====================================
echo CONNECTION TEST
echo ====================================
echo.

echo Testing backend connection on port 5101...
echo.

echo 1. Health endpoint:
curl -s -w "HTTP Status: %%{http_code}\n" http://localhost:5101/api/health
echo.

echo 2. Calendar test endpoint:
curl -s -w "HTTP Status: %%{http_code}\n" http://localhost:5101/api/calendar/test
echo.

echo 3. API documentation:
echo Open in browser: http://localhost:5101/api/docs
echo.

echo 4. Frontend:
echo Open in browser: http://localhost:5100
echo.

echo ====================================
echo If HTTP Status = 200, server is working ✅
echo If connection failed, run START-BACKEND-ONLY.bat ❌
echo ====================================
echo.

pause
