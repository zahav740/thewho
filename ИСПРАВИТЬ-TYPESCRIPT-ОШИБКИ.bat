@echo off
chcp 65001 > nul
echo.
echo 🔧 АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК
echo ============================================
echo.

cd /d "%~dp0"

echo 📝 Запускаем скрипт автоисправления...
node fix-typescript-errors.js

echo.
echo 🔍 Проверяем результат компиляции...
cd backend
npx tsc --noEmit

echo.
echo 📊 Проверка завершена!
echo.
pause
