@echo off
echo ====================================
echo EMERGENCY FIX - 500 ERROR
echo ====================================
echo.

echo FIXING 500 error by using safe entity and simple DB fix...
echo.

echo 1. Deploying safe entity (matches existing DB exactly)...
copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul
echo Safe entity deployed

echo.
echo 2. Running simple database fix (no field renaming)...
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-SIMPLE.sql"

echo.
echo 3. Deploying production service...
copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul
echo Production service deployed

echo.
echo ====================================
echo EMERGENCY FIX COMPLETE
echo ====================================
echo.
echo RESTART BACKEND SERVER:
echo 1. Go to backend window
echo 2. Press Ctrl+C
echo 3. Run: npm run start:dev
echo.
echo This should fix the 500 error!
echo Then test: http://localhost:5100
echo.
pause
