@echo off
echo ========================================
echo   БЫСТРАЯ ПРОВЕРКА КОМПИЛЯЦИИ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🔨 Проверяем TypeScript компиляцию...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ ЕСТЬ ОШИБКИ КОМПИЛЯЦИИ!
    echo.
    echo 🔧 Запустите сначала установку зависимостей:
    echo    npm install xlsx @types/xlsx
    echo.
) else (
    echo.
    echo ✅ ВСЕ ОШИБКИ ИСПРАВЛЕНЫ!
    echo.
    echo 🚀 Можно запускать приложение:
    echo    Backend:  ЗАПУСК-BACKEND-ИСПРАВЛЕННЫЙ-5100.bat
    echo    Frontend: ЗАПУСК-FRONTEND-ИСПРАВЛЕННЫЙ-5101.bat
    echo.
)

pause
