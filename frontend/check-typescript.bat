@echo off
echo "=== Проверка TypeScript компиляции ==="
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo "Проверяем TypeScript ошибки..."
npx tsc --noEmit

echo "=== Проверка завершена ==="
pause
