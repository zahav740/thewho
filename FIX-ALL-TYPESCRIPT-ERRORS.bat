@echo off
echo ===============================================
echo ИСПРАВЛЕНИЕ ВСЕХ TYPESCRIPT ОШИБОК
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo.
echo 1. Применяем исправления через Node.js...
node fix-typescript-errors.js

echo.
echo 2. Переходим в backend директорию...
cd backend

echo.
echo 3. Проверяем TypeScript компиляцию...
echo Запуск: npx tsc --noEmit
npx tsc --noEmit

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ TypeScript ошибки исправлены!
    echo.
    echo 4. Запускаем backend сервер...
    npm run start
) ELSE (
    echo.
    echo ❌ Есть ошибки TypeScript. Проверьте вывод выше.
    echo.
)

echo.
echo === ГОТОВО ===
pause
