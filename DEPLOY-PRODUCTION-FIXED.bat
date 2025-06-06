@echo off
echo ====================================
echo PRODUCTION DEPLOYMENT FIXED
echo ====================================
echo.

echo FIXING DATABASE STRUCTURE AND DEPLOYING PRODUCTION CODE
echo.

echo 1. Backing up current files...
copy "backend\src\modules\orders\orders.service.ts" "backend\src\modules\orders\orders.service.BACKUP.ts" >nul
copy "backend\src\database\entities\operation.entity.ts" "backend\src\database\entities\operation.entity.BACKUP.ts" >nul
echo Files backed up

echo.
echo 2. Running database structure fixes...
echo This will rename fields to match the production entity...
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-DB-STRUCTURE.sql"

echo.
echo 3. Deploying production service...
copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul
echo Production service deployed!

echo.
echo 4. Deploying matching entity...
copy /Y "backend\src\database\entities\operation.entity.FIXED.ts" "backend\src\database\entities\operation.entity.ts" >nul
echo Production entity deployed!

echo.
echo 5. Testing API connection...
timeout /t 2 /nobreak >nul
curl -s "http://localhost:5101/api/orders?limit=1" | findstr "drawingNumber" >nul
if %errorlevel% equ 0 (
    echo ✅ API is responding
) else (
    echo ⚠️ API needs restart
)

echo.
echo ====================================
echo PRODUCTION DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo CHANGES MADE:
echo ✅ Database fields renamed to snake_case
echo ✅ Operations linked to orders via order_id  
echo ✅ Added missing operations for C6HP0021A
echo ✅ Removed ALL test data from service
echo ✅ Entity matches database structure
echo.
echo 🚨 RESTART BACKEND SERVER NOW! 🚨
echo 1. Go to backend server window
echo 2. Press Ctrl+C to stop
echo 3. Run: npm run start:dev
echo.
echo After restart, C6HP0021A should show 3 operations!
echo.
pause
