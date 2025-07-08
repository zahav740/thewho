@echo off
echo ==============================================
echo          ОКОНЧАТЕЛЬНОЕ ИСПРАВЛЕНИЕ ОШИБОК
echo ==============================================

cd /d "%~dp0backend"
echo Переходим в папку backend: %cd%

echo.
echo ⏳ Проверяем компиляцию TypeScript...
npx tsc --noEmit

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Все ошибки исправлены! Компиляция прошла успешно.
    echo.
    echo 🚀 Запускаем backend...
    npm run start:dev
) else (
    echo.
    echo ❌ Остались ошибки компиляции. Проверьте вывод выше.
    echo.
    pause
)
