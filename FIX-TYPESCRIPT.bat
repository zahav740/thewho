@echo off
echo ====================================
echo TYPESCRIPT ERRORS FIX
echo ====================================
echo.

echo Fixing TypeScript compilation errors...
echo.

echo 1. Checking for TypeScript errors...
cd backend
call npm run build 2>nul
if %errorlevel% neq 0 (
    echo TypeScript errors found, applying fixes...
) else (
    echo No TypeScript errors found
)

echo.
echo 2. Applying safe entity files...
copy /Y "..\backend\src\database\entities\operation.entity.SAFE.ts" "src\database\entities\operation.entity.ts" >nul
echo Safe operation entity applied

echo.
echo 3. Testing compilation...
call npm run build
if %errorlevel% equ 0 (
    echo ✅ TypeScript compilation successful
) else (
    echo ❌ TypeScript compilation failed
    echo Check the errors above and fix manually
)

cd ..
echo.
echo TypeScript fix complete!
pause
