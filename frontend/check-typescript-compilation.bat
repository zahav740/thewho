@echo off
echo ==============================================
echo        ПРОВЕРКА КОМПИЛЯЦИИ TYPESCRIPT
echo ==============================================

cd /d "%~dp0"

echo.
echo ℹ️  Проверяем типы TypeScript в frontend проекте...
echo.

npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ УСПЕХ: Компиляция TypeScript прошла без ошибок!
    echo.
    echo 🎉 Все исправления TypeScript завершены успешно!
    echo.
    pause
    exit /b 0
) else (
    echo.
    echo ❌ ОШИБКА: Обнаружены ошибки компиляции TypeScript
    echo.
    echo 📝 Проверьте детали ошибок выше
    echo.
    pause
    exit /b 1
)
