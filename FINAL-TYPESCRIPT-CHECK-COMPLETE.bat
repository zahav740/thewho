@echo off
echo ==============================================
echo       ФИНАЛЬНАЯ ПРОВЕРКА TYPESCRIPT
echo ==============================================

cd /d "%~dp0\frontend"

echo.
echo 🔍 Выполняем финальную проверку TypeScript компиляции...
echo.

npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ УСПЕХ! ВСЕ ОШИБКИ TYPESCRIPT ИСПРАВЛЕНЫ!
    echo.
    echo 🎉 Система готова к запуску:
    echo    - Backend: порт 5100
    echo    - Frontend: порт 5101
    echo.
    echo 📋 Для запуска используйте:
    echo    START-CRM-TYPESCRIPT-FIXED-FINAL.bat
    echo.
    pause
    exit /b 0
) else (
    echo.
    echo ❌ ОШИБКА: Все еще есть ошибки TypeScript
    echo.
    echo 📝 Детали ошибок показаны выше
    echo.
    pause
    exit /b 1
)
