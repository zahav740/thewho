@echo off
echo ========================================
echo ФИНАЛЬНАЯ ПРОВЕРКА TYPESCRIPT
echo ========================================
echo.

cd backend

echo 🔍 Проверяем TypeScript...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Все еще есть ошибки! Смотрите выше.
    echo.
) else (
    echo.
    echo 🎉 ОТЛИЧНО! ВСЕ TYPESCRIPT ОШИБКИ ИСПРАВЛЕНЫ!
    echo.
    echo ✅ Система готова к запуску на портах:
    echo    📱 Frontend: http://localhost:5101
    echo    🔌 Backend:  http://localhost:5100
    echo.
    echo 🚀 Запускаем систему? (y/n)
    set /p start=
    if /i "%start%"=="y" (
        cd ..
        call START-CRM-PORTS-5100-5101.bat
    )
)

pause
