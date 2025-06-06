@echo off
echo ====================================
echo PRODUCTION READINESS CHECK
echo ====================================
echo.

echo Checking current service for test data...
echo.

findstr /C:"Тестовый заказ" "backend\src\modules\orders\orders.service.ts" >nul
if %errorlevel% equ 0 (
    echo ❌ CRITICAL: Service contains TEST DATA fallbacks!
    echo This is NOT suitable for production!
    echo.
    echo Found test data patterns:
    findstr /N /C:"Тестовый" "backend\src\modules\orders\orders.service.ts"
    echo.
) else (
    echo ✅ Good: No test data patterns found
)

findstr /C:"catch.*error" "backend\src\modules\orders\orders.service.ts" >nul
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: Service has error handling that may hide real issues
    echo.
    echo Error handling patterns found:
    findstr /N /C:"catch" "backend\src\modules\orders\orders.service.ts"
    echo.
)

echo Checking database operations links...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as unlinked_operations FROM operations WHERE order_id IS NULL;" 2>nul

echo.
echo ====================================
echo RECOMMENDATIONS
echo ====================================
echo.

findstr /C:"Тестовый заказ" "backend\src\modules\orders\orders.service.ts" >nul
if %errorlevel% equ 0 (
    echo 🚨 IMMEDIATE ACTION REQUIRED:
    echo.
    echo 1. Run: DEPLOY-PRODUCTION.bat
    echo 2. This will remove ALL test data
    echo 3. Replace with production-ready service
    echo 4. Fix real database issues
    echo.
    echo TEST DATA MUST BE REMOVED FROM PRODUCTION!
) else (
    echo ✅ Service appears production-ready
    echo.
    echo Still run: DEPLOY-PRODUCTION.bat
    echo To ensure database links are fixed
)

echo.
pause
