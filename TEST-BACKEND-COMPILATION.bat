@echo off
echo ========================================
echo   ПРОВЕРКА BACKEND КОМПИЛЯЦИИ
echo ========================================
echo.

cd /d "%~dp0backend"

echo Проверяем TypeScript компиляцию...
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ УСПЕХ: Backend TypeScript компиляция прошла без ошибок!
    echo.
    echo Теперь можно запускать:
    echo 1. npm run migration:run
    echo 2. npm run start:dev
) else (
    echo.
    echo ❌ ОШИБКА: Backend TypeScript имеет ошибки
)

echo.
echo ========================================
pause
