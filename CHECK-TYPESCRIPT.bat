@echo off
echo ====================================
echo TYPESCRIPT COMPILATION CHECK
echo ====================================
echo.

echo Checking TypeScript compilation in backend...
cd backend

echo.
echo Running TypeScript compiler...
call npx tsc --noEmit

echo.
echo ====================================
echo COMPILATION CHECK COMPLETED
echo ====================================
echo.
echo If no errors shown above, TypeScript compilation is successful!
echo If there are errors, they will be listed above.
echo.
pause
