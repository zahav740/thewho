@echo off
echo ====================================
echo RESTORE ORIGINAL ORDERS SERVICE
echo ====================================
echo.
echo This script will restore the original orders.service.ts file if needed.
echo.

echo Stopping application...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
if exist "backend\src\modules\orders\orders.service.backup.ts" (
  echo Restoring from backup...
  copy /Y "backend\src\modules\orders\orders.service.backup.ts" "backend\src\modules\orders\orders.service.ts"
  echo Original service file restored from backup.
) else (
  echo No backup found to restore.
  echo Please reinstall the application if needed.
)

echo.
echo Restarting application...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo System restored to original state.
echo ====================================
pause
