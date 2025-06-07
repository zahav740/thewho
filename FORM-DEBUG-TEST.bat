@echo off
echo ====================================
echo FORM DEBUG - TESTING ORDER FORM
echo ====================================
echo.

echo 🔍 Testing form functionality...
echo.

echo 1. Checking if services are running...
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend API is responding on port 5100
) else (
    echo ❌ Backend API is not responding - please start backend first
    echo Run: START-CRM-ENGLISH.bat
    pause
    exit /b 1
)

echo.
echo 2. Testing orders endpoint...
curl -s "http://localhost:5100/api/orders?limit=1" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Orders API is working
) else (
    echo ❌ Orders API is not working
)

echo.
echo 3. Frontend should be running on port 5101
echo Opening browser to test form...
start http://localhost:5101

echo.
echo ====================================
echo FORM DEBUG SETUP COMPLETE
echo ====================================
echo.
echo 📋 To test the form issue:
echo 1. Navigate to Database page
echo 2. Click "Новый заказ" or edit existing order
echo 3. Check browser console (F12) for debug messages
echo 4. Form changes should show 🔍 Debug Info section
echo.
echo 🔍 Debug features enabled:
echo - Real-time form value tracking
echo - Console logging for all changes
echo - Visual debug info panel
echo - Error state monitoring
echo.
echo ⚠️ Remember to check browser console for detailed logs!
echo.
pause
