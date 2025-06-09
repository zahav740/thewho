@echo off
echo ==========================================
echo ПРОВЕРКА TYPESCRIPT ОШИБОК
echo ==========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo ✅ Переходим в директорию backend...
echo Текущая директория: %CD%

echo.
echo 🔍 Проверяем TypeScript компиляцию...

npx tsc --noEmit

echo.
echo ✅ Проверка завершена!
echo.

pause
