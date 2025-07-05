@echo off
echo ========================================
echo ОЧИСТКА И ПЕРЕЗАПУСК BACKEND
echo ========================================
echo.

cd backend

echo 🧹 Очищаем скомпилированные файлы...
if exist "dist" rmdir /s /q "dist"

echo 🔧 Перезапускаем TypeScript компиляцию...
echo.

call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Есть TypeScript ошибки!
    echo.
) else (
    echo.
    echo ✅ TypeScript OK! Запускаем сервер...
    echo.
    set PORT=5100
    call npm run start:dev
)

pause
