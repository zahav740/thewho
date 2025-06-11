@echo off
echo Проверка ошибок TypeScript...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo Запуск TypeScript компилятора...
npx tsc --noEmit --project .

echo.
echo === Готово ===
pause
