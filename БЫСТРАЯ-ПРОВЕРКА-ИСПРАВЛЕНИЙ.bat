@echo off
echo ==========================================
echo   БЫСТРАЯ ПРОВЕРКА ИСПРАВЛЕНИЙ TYPESCRIPT
echo ==========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo [1/3] Проверяем TypeScript ошибки...
echo.
call npx tsc --noEmit --project tsconfig.json

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ЕСТЬ ОШИБКИ TYPESCRIPT!
    echo.
    echo Попробуйте исправить ошибки выше
    pause
    exit /b 1
) else (
    echo.
    echo ✅ TypeScript ошибок не найдено!
    echo.
)

echo [2/3] Проверяем компиляцию...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА КОМПИЛЯЦИИ!
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Компиляция успешна!
    echo.
)

echo [3/3] Все проверки пройдены успешно!
echo.
echo 🎉 ГОТОВО К ЗАПУСКУ!
echo.
echo Запустите: START-FRONTEND.bat
echo.
pause