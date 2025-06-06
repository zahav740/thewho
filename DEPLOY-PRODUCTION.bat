@echo off
echo ====================================
echo PRODUCTION SERVICE DEPLOYMENT
echo ====================================
echo.

echo REMOVING TEST DATA FROM PRODUCTION!
echo.

echo 1. Backing up current service...
copy "backend\src\modules\orders\orders.service.ts" "backend\src\modules\orders\orders.service.BACKUP.ts"
echo Current service backed up

echo.
echo 2. Deploying production service...
copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts"
echo Production service deployed!

echo.
echo 3. Deploying production operation entity...
copy /Y "backend\src\database\entities\operation.entity.NEW.ts" "backend\src\database\entities\operation.entity.ts"
echo Production entity deployed!

echo.
echo 4. Running database fixes...
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-OPERATIONS-LINKS.sql"

echo.
echo ====================================
echo PRODUCTION DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo CRITICAL CHANGES MADE:
echo - Removed ALL test data fallbacks
echo - Fixed database operations links  
echo - Updated entities to match DB structure
echo - Service now throws real errors instead of hiding them
echo.
echo RESTART THE BACKEND SERVER NOW!
echo 1. Stop backend (Ctrl+C in backend window)
echo 2. Run: npm run start:dev
echo.
echo After restart, the system will show REAL data only.
echo Any errors will be genuine and need to be fixed.
echo.
pause
