@echo off
echo 🧹 Очищаем кэш и проверяем исправления...

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 🗑️ Очищаем кэш npm...
call npm cache clean --force

echo 🗑️ Удаляем node_modules...
rmdir /s /q node_modules

echo 📦 Переустанавливаем зависимости...
call npm install

echo 🔍 Проверяем TypeScript...
call npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo ✅ Все ошибки исправлены!
) else (
    echo ❌ Остались ошибки
)

pause
