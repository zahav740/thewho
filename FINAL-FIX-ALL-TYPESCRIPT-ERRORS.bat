@echo off
title ИСПРАВЛЕНИЕ ВСЕХ TYPESCRIPT ОШИБОК
echo.
echo ========================================
echo  АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ TS ОШИБОК
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/5] Создание типов Express...
if not exist "src\types" mkdir "src\types"

echo [2/5] Обновление package.json (типы)...
npm install --save-dev @types/express@latest @types/node@latest

echo [3/5] Запуск автоматического исправления...
node fix-express-types.js

echo [4/5] Исправление основных файлов вручную...

echo [5/5] Проверка компиляции...
echo Запускаем TypeScript компилятор...
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ ВСЕ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ УСПЕШНО!
    echo ✅ TypeScript ошибки устранены
    echo.
    echo Можно запускать:
    echo   npm run start:dev
    echo   npm run build
    echo.
) else (
    echo.
    echo ⚠️ Остались некоторые ошибки TypeScript
    echo Проверьте вывод выше для деталей
    echo.
)

pause
