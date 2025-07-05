@echo off
echo ====================================
echo ПРОВЕРКА TYPESCRIPT И ЗАПУСК
echo ====================================
echo.

cd /d "%~dp0backend"

echo 🔍 Проверяем TypeScript ошибки...
npx tsc --noEmit
if errorlevel 1 (
    echo ❌ Есть ошибки TypeScript, но попробуем запустить...
    echo.
) else (
    echo ✅ TypeScript ошибок нет!
    echo.
)

echo 🛑 Останавливаем процессы на порту 5100...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul

echo ⏳ Ожидание...
timeout /t 2 /nobreak > nul

echo.
echo 🚀 Запускаем backend с исправлениями...
npm run start:dev

pause
