@echo off
echo 🔍 Быстрая проверка ошибок TypeScript...

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📋 Проверяем только файлы с OperationCompletionModal...
call npx tsc --noEmit --pretty 2>&1 | findstr /C:"OperationCompletion"

echo.
echo 📋 Общая проверка TypeScript...
call npx tsc --noEmit --pretty

pause
