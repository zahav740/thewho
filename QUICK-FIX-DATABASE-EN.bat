@echo off
chcp 65001 >nul
echo 🚀 QUICK DATABASE FIX
echo ==========================================

echo.
echo 📋 1. Checking and starting backend...
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\backend

:: Check if backend is running
curl -s http://localhost:5100/api/orders >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is already running on port 5100
) else (
    echo ❌ Backend not responding, starting...
    echo.
    echo 🔧 Installing dependencies...
    npm install --silent
    
    echo 🚀 Starting backend in background...
    start /MIN cmd /c "npm run start:dev"
    
    echo ⏳ Waiting for backend startup 15 seconds...
    timeout /t 15 /nobreak >nul
)

echo.
echo 📋 2. Checking API and creating test data...
echo.

:: Check API
curl -s http://localhost:5100/api/orders -H "Content-Type: application/json" >api_test.json
if exist api_test.json (
    echo ✅ API orders responding
    
    :: Read order count
    node -e "try { const fs = require('fs'); const data = JSON.parse(fs.readFileSync('api_test.json', 'utf8')); console.log('📊 Orders in database:', data.total || 0); if ((data.total || 0) === 0) { console.log('❌ Database is empty - creating test orders...'); process.exit(1); } } catch (e) { console.log('❌ Error reading API response:', e.message); process.exit(1); }"
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo 🔧 Creating test orders...
        
        curl -X POST http://localhost:5100/api/orders -H "Content-Type: application/json" -d "{\"drawingNumber\":\"TEST-001\",\"quantity\":10,\"deadline\":\"2025-08-15T00:00:00.000Z\",\"priority\":2,\"workType\":\"Milling\",\"operations\":[]}" >nul 2>&1
        
        curl -X POST http://localhost:5100/api/orders -H "Content-Type: application/json" -d "{\"drawingNumber\":\"TEST-002\",\"quantity\":5,\"deadline\":\"2025-08-20T00:00:00.000Z\",\"priority\":1,\"workType\":\"Turning\",\"operations\":[]}" >nul 2>&1
        
        curl -X POST http://localhost:5100/api/orders -H "Content-Type: application/json" -d "{\"drawingNumber\":\"TEST-003\",\"quantity\":8,\"deadline\":\"2025-08-25T00:00:00.000Z\",\"priority\":3,\"workType\":\"Assembly\",\"operations\":[]}" >nul 2>&1
        
        echo ✅ Created 3 test orders
    )
    
    del api_test.json >nul 2>&1
) else (
    echo ❌ API not responding
)

echo.
echo 📋 3. Checking frontend...
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\frontend

curl -s http://localhost:5101 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend running on port 5101
) else (
    echo ❌ Frontend not running
    echo 🚀 Starting frontend...
    start /MIN cmd /c "npm start"
    echo ⏳ Frontend started in background
)

echo.
echo 📋 FINAL CHECK:
echo ==========================================

echo 🔍 Testing final result...
timeout /t 3 /nobreak >nul

curl -s http://localhost:5100/api/orders -H "Content-Type: application/json" >final_test.json
if exist final_test.json (
    node -e "try { const fs = require('fs'); const data = JSON.parse(fs.readFileSync('final_test.json', 'utf8')); console.log('✅ SUCCESS! Backend working'); console.log('📊 Total orders:', data.total || 0); console.log('📋 Data on page:', (data.data || []).length); if (data.data && data.data.length > 0) { console.log('📝 First order:', data.data[0].drawingNumber); } } catch (e) { console.log('❌ Error:', e.message); }"
    del final_test.json >nul 2>&1
) else (
    echo ❌ API still not responding
)

echo.
echo 🌐 Open: http://localhost:5101/database
echo 📋 Backend API: http://localhost:5100/api/orders
echo.
echo ✅ DONE! If database still empty:
echo   1. Go to Database section
echo   2. Click Create Order
echo   3. Or use CSV/Excel import
echo.
pause
