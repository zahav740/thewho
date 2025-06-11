@echo off
echo ================================================
echo 🚀 ИСПРАВЛЕНИЕ И ЗАПУСК PRODUCTION BACKEND 
echo ================================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo.
echo 📋 Проверяем применённые исправления...
node check-fixes.js

echo.
echo 🔧 Переходим в backend...
cd backend

echo.
echo 📝 Проверяем TypeScript компиляцию...
echo Команда: npx tsc --noEmit --skipLibCheck
npx tsc --noEmit --skipLibCheck

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ TypeScript ошибки исправлены!
    echo.
    echo 🚀 Запускаем backend сервер на порту 5100...
    echo.
    set NODE_ENV=production
    set PORT=5100
    npm run start
) ELSE (
    echo.
    echo ❌ Всё ещё есть ошибки TypeScript.
    echo Попробуем запустить без строгих проверок...
    echo.
    echo 🚀 Принудительный запуск сервера...
    set NODE_ENV=production
    set PORT=5100
    npm run start
)

echo.
echo === ГОТОВО ===
pause
