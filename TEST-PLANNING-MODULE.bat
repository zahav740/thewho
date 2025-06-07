@echo off
echo ====================================
echo TESTING PLANNING MODULE
echo ====================================
echo.

echo 1. Checking if backend is responding...
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend is responding
) else (
    echo ❌ Backend is not responding - start it first with RESTART-BACKEND-ONLY.bat
    pause
    exit /b 1
)

echo.
echo 2. Testing planning demo endpoint...
echo Running demo planning with test data:
curl -s -X POST http://localhost:5100/api/planning/demo
echo.

echo.
echo 3. Testing latest results endpoint...
echo Getting latest planning results:
curl -s http://localhost:5100/api/planning/results/latest
echo.

echo.
echo 4. Testing operation progress endpoint...
echo Getting operation progress:
curl -s http://localhost:5100/api/planning/progress
echo.

echo.
echo 5. Database check...
echo Checking if we have data for planning:
echo.

echo Orders with priorities 1,2,3:
curl -s "http://localhost:5100/api/orders?limit=10" | find "priority"
echo.

echo Available machines:
curl -s http://localhost:5100/api/machines | find "code"
echo.

echo ====================================
echo PLANNING MODULE TEST COMPLETE
echo ====================================
echo.
echo ✅ If you see JSON responses above, planning module is working
echo ❌ If you see 404 errors, check that backend was restarted after changes
echo.
echo To restart backend: RESTART-BACKEND-ONLY.bat
echo To test full planning: Go to Production Planning page in frontend
echo.
pause
