@echo off
echo ========================================
echo БЫСТРАЯ ПРОВЕРКА TYPESCRIPT ИСПРАВЛЕНИЙ
echo ========================================
echo.

cd backend

echo 🔍 Проверяем TypeScript компиляцию...
echo.

call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Еще есть TypeScript ошибки!
    echo 📋 Просмотрите ошибки выше и выполните дополнительные исправления
    echo.
) else (
    echo.
    echo ✅ ОТЛИЧНО! Все TypeScript ошибки исправлены!
    echo 🎉 Система готова к запуску
    echo.
    echo 🚀 Хотите запустить систему сейчас? (y/n)
    set /p launch=
    if /i "%launch%"=="y" (
        cd ..
        call START-CRM-PORTS-5100-5101.bat
    )
)

echo.
pause
