@echo off
echo ========================================
echo   ПРОВЕРКА ИСПРАВЛЕННЫХ ТИПОВ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🔨 Проверяем только TypeScript типы...
call npx tsc --noEmit --skipLibCheck

if errorlevel 1 (
    echo.
    echo ❌ ЕЩЕ ЕСТЬ ОШИБКИ ТИПОВ!
    echo.
    echo 🔧 Попробуйте перезапустить компиляцию:
    echo    npm run start:dev
    echo.
) else (
    echo.
    echo ✅ ВСЕ ТИПЫ ИСПРАВЛЕНЫ!
    echo.
    echo 🚀 Теперь можно запускать:
    echo    Backend:  ЗАПУСК-BACKEND-ИСПРАВЛЕННЫЙ-5100.bat
    echo    Frontend: ЗАПУСК-FRONTEND-ИСПРАВЛЕННЫЙ-5101.bat
    echo.
    echo 📊 Порты настроены:
    echo    Backend:  http://localhost:5100/api
    echo    Frontend: http://localhost:5101
    echo    Swagger:  http://localhost:5100/api/docs
    echo.
)

pause
