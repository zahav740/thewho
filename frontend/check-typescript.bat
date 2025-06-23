@echo off
echo ====================================
echo TYPESCRIPT ERRORS CHECK
echo ====================================
echo Проверка ошибок TypeScript...
echo.

cd /d "%~dp0"

echo Запуск проверки TypeScript...
npx tsc --noEmit --skipLibCheck

echo.
echo Проверка завершена!
pause