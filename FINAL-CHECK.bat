@echo off
echo ====================================
echo FINAL TYPESCRIPT CHECK
echo ====================================
echo.

cd backend
echo Checking TypeScript compilation...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Still have TypeScript errors
    echo We may need to disable more modules temporarily
    echo But let's try to start anyway...
) else (
    echo.
    echo ✅ TypeScript compilation successful!
    echo.
    echo Ready to test operations saving!
)

echo.
echo Now try: START-ALL.bat
pause
