@echo off
echo ========================================
echo   ИСПРАВЛЕНИЕ ОПЕРАЦИЙ В UPDATE
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🔨 Проверяем TypeScript компиляцию...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ ЕЩЕ ЕСТЬ ОШИБКИ ТИПОВ!
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ ВСЕ ТИПЫ ИСПРАВЛЕНЫ!
    echo.
    echo 🚀 Пересобираем и запускаем...
    
    call npm run build
    if errorlevel 1 (
        echo ❌ Ошибка сборки!
        pause
        exit /b 1
    )
    
    echo.
    echo 🎯 Запускаем Backend на порту 5100...
    call npm run start:dev
)

pause
