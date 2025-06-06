@echo off
echo ====================================
echo QUICK TYPESCRIPT CHECK
echo ====================================
echo.

cd backend
echo Checking TypeScript compilation...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Still have TypeScript errors
    echo Check the errors above
) else (
    echo.
    echo ✅ TypeScript compilation successful!
    echo.
    echo Now you can run START-ALL.bat
)

echo.
pause
