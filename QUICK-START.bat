@echo off
echo ====================================
echo БЫСТРАЯ ПРОВЕРКА И ЗАПУСК
echo ====================================
echo.

cd /d "%~dp0backend"

echo 🔍 Проверяем TypeScript...
npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo ❌ ОШИБКИ TYPESCRIPT - ПОПРОБУЕМ ПРИНУДИТЕЛЬНО
) else (
    echo ✅ TYPESCRIPT OK!
)

echo.
echo 🛑 Убиваем процессы на 5100...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul

echo ⏳ Пауза...
timeout /t 2 /nobreak > nul

echo.
echo 🚀 ЗАПУСК BACKEND...
npm run start:dev
