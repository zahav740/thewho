@echo off
echo ====================================
echo МОНИТОРИНГ КОМПИЛЯЦИИ TYPESCRIPT
echo ====================================
echo.

cd /d "%~dp0backend"

echo 🔍 Проверяем TypeScript ошибки...
npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo.
    echo ❌ ЕСТЬ ОШИБКИ TYPESCRIPT!
    echo 🔧 Проверьте сообщения выше для деталей
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ TYPESCRIPT ОШИБОК НЕТ!
    echo 🚀 Можно запускать backend
    echo.
)

echo 🔄 Запускаем автоматическую компиляцию...
echo 💡 Следите за сообщениями компилятора
echo 🛑 Нажмите Ctrl+C для остановки
echo.

npm run start:dev
