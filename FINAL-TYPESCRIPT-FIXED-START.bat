@echo off
echo ================================================
echo 🚀 ЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ (ФИНАЛЬНЫЙ)
echo ================================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 📝 Проверяем TypeScript компиляцию...
echo Команда: npx tsc --noEmit --skipLibCheck
npx tsc --noEmit --skipLibCheck

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ TYPESCRIPT ОШИБКИ ИСПРАВЛЕНЫ!
    echo.
    echo 🚀 Запускаем production backend на порту 5100...
    echo.
    set NODE_ENV=production
    set PORT=5100
    npm run start
) ELSE (
    echo.
    echo ⚠️ Есть warnings или ошибки, но пробуем запуск...
    echo.
    echo 🚀 Принудительный запуск backend...
    set NODE_ENV=production
    set PORT=5100
    npm run start
)

echo.
echo === ГОТОВО ===
pause
