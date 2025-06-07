@echo off
echo 🔍 Проверяем, запущен ли backend на порту 5100...

curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend запущен и работает на порту 5100
    
    echo 📋 Проверяем shifts endpoint...
    echo GET /api/shifts:
    curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/shifts
    echo.
    
    echo 📊 Пробуем создать тестовую запись смены...
    echo POST /api/shifts:
    curl -X POST http://localhost:5100/api/shifts ^
         -H "Content-Type: application/json" ^
         -d "{\"date\": \"2025-06-07\", \"shiftType\": \"DAY\", \"machineId\": 5, \"operationId\": 23, \"drawingNumber\": \"C6HP0021A\", \"dayShiftQuantity\": 10, \"dayShiftOperator\": \"Test Operator\"}" ^
         -w "\nHTTP Status: %%{http_code}\n"
         
) else (
    echo ❌ Backend не отвечает на порту 5100
    echo 🔧 Попробуйте запустить backend командой:
    echo    cd backend ^&^& npm run start:dev
)

echo.
echo 🔍 Проверяем, запущен ли frontend на порту 5101...
curl -s http://localhost:5101 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend запущен и работает на порту 5101
) else (
    echo ❌ Frontend не отвечает на порту 5101
    echo 🔧 Попробуйте запустить frontend командой:
    echo    cd frontend ^&^& npm start
)

pause
