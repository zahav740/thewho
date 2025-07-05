@echo off
chcp 65001 > nul
echo.
echo 🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ ВСЕХ TYPESCRIPT ОШИБОК
echo ==========================================
echo.

cd /d "%~dp0"

echo 📋 ПРОБЛЕМА: 105+ ошибок TypeScript с типизацией Express
echo 🎯 РЕШЕНИЕ: Автоматическое исправление всех файлов
echo.

echo 🚀 Запускаем полное исправление...
node fix-all-typescript-errors.js

echo.
echo 🔍 Финальная проверка компиляции...
cd backend
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ ОШИБКИ ИСПРАВЛЕНЫ! TYPESCRIPT КОМПИЛЯЦИЯ УСПЕШНА!
    echo.
    echo 🚀 Теперь можно запускать backend:
    echo.
    echo 📂 В новом окне запустите:
    start "Backend (5100)" cmd /k "npx ts-node --transpile-only src/main.ts"
    
    echo.
    echo ⏳ Ждем 3 секунды...
    timeout /t 3 /nobreak > nul
    
    echo.
    echo 🌐 После запуска backend будет доступен:
    echo   Backend API: http://localhost:5100/api
    echo   Swagger docs: http://localhost:5100/api/docs
    echo   Health check: http://localhost:5100/api/health
    echo.
    echo 🎉 Frontend сможет подключиться и ошибки исчезнут!
    
) else (
    echo.
    echo ❌ Остались некоторые ошибки TypeScript
    echo 🔧 Возможно нужно запустить исправление повторно
    echo.
    echo 📋 Рекомендации:
    echo 1. Запустите этот батник еще раз
    echo 2. Проверьте ошибки выше
    echo 3. При необходимости исправьте вручную
)

echo.
cd ..
pause
