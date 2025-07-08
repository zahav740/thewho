@echo off
echo ROLLBACK CHANGES - RESTORE WORKING STATE
echo ========================================

echo.
echo Rolling back TypeScript fixes that may have broken Excel import...
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\backend\src\modules\orders

echo Step 1: Backing up current files...
copy excel-simple.controller.ts excel-simple.controller.ts.backup >nul 2>&1
copy excel-test.controller.ts excel-test.controller.ts.backup >nul 2>&1
copy excel-upload-test.controller.ts excel-upload-test.controller.ts.backup >nul 2>&1

echo Step 2: Restoring original logger usage...

echo Restoring excel-simple.controller.ts...
powershell -Command "(Get-Content excel-simple.controller.ts) -replace 'const logger = new Logger\(ExcelSimpleController\.name\);', '' -replace 'logger\.log', 'this.logger.log' -replace 'logger\.error', 'this.logger.error' | Set-Content excel-simple.controller.ts"

echo Restoring excel-test.controller.ts...
powershell -Command "(Get-Content excel-test.controller.ts) -replace 'const logger = new Logger\(ExcelTestController\.name\);', '' -replace 'logger\.log', 'this.logger.log' -replace 'logger\.error', 'this.logger.error' | Set-Content excel-test.controller.ts"

echo Restoring excel-upload-test.controller.ts...
powershell -Command "(Get-Content excel-upload-test.controller.ts) -replace 'const logger = new Logger\(ExcelUploadTestController\.name\);', '' -replace 'logger\.log', 'this.logger.log' -replace 'logger\.error', 'this.logger.error' | Set-Content excel-upload-test.controller.ts"

echo.
echo Step 3: Restarting backend to apply changes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting backend...
start /MIN cmd /c "npm run start:dev"

echo.
echo Step 4: Waiting for backend restart...
timeout /t 15 /nobreak >nul

echo.
echo Step 5: Testing Excel import...
echo Checking if backend responds...
curl -s http://localhost:5100/api/orders >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is responding
    echo.
    echo ✅ ROLLBACK COMPLETE
    echo.
    echo Try your Excel import again at: http://localhost:5101/database
    echo The original Excel import functionality should now work
) else (
    echo ❌ Backend not responding yet, wait a bit more
)

echo.
echo If Excel import still doesn't work, the issue may be in the Excel file format
echo rather than the TypeScript changes.
echo.
pause
