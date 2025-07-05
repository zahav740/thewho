@echo off
echo ====================================
echo   ПРОВЕРКА КОМПИЛЯЦИИ ORDERS V2
echo ====================================
echo.

echo [1/2] Проверка Backend компиляции...
cd /d "%~dp0backend"
echo Запускаем TypeScript компиляцию...
npx tsc --noEmit
if %errorlevel% equ 0 (
    echo ✅ Backend компилируется без ошибок
) else (
    echo ❌ Найдены ошибки компиляции в Backend
    pause
    exit /b 1
)

echo.
echo [2/2] Проверка Frontend компиляции...
cd /d "%~dp0frontend"
echo Запускаем TypeScript проверку...
npx tsc --noEmit
if %errorlevel% equ 0 (
    echo ✅ Frontend компилируется без ошибок
) else (
    echo ❌ Найдены ошибки компиляции в Frontend
    pause
    exit /b 1
)

echo.
echo ====================================
echo   ✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!
echo ====================================
echo Система готова к запуску.
echo Используйте START-ORDERS-V2.bat для запуска.
echo.
pause
