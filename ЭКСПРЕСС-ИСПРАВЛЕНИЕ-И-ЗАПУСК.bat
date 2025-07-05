@echo off
chcp 65001 > nul
echo.
echo ⚡ ЭКСПРЕСС-ИСПРАВЛЕНИЕ И ЗАПУСК BACKEND
echo ====================================
echo.

cd /d "%~dp0"

echo 📋 СИТУАЦИЯ:
echo   ❌ 105+ ошибок TypeScript блокируют запуск backend
echo   ✅ Frontend работает на 5101, ждет backend на 5100
echo.

echo 🔧 Шаг 1: Исправляем все ошибки TypeScript...
node fix-all-typescript-errors.js

echo.
echo 🔍 Шаг 2: Проверяем компиляцию...
cd backend
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo ✅ TypeScript ошибки исправлены!
    echo.
    echo 🚀 Шаг 3: Запускаем backend...
    echo 📡 Backend запускается на порту 5100...
    
    start "Backend (порт 5100)" cmd /k "echo 🚀 Запуск Backend на порту 5100... && npx ts-node --transpile-only src/main.ts"
    
    echo.
    echo ⏳ Ждем 8 секунд для полного запуска backend...
    timeout /t 8 /nobreak > nul
    
    echo.
    echo 🔍 Шаг 4: Проверяем доступность backend...
    curl -s http://localhost:5100/api/health > nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo ✅ Backend успешно запущен и отвечает!
        echo.
        echo 🎉 СИСТЕМА ПОЛНОСТЬЮ ГОТОВА:
        echo   Frontend: http://localhost:5101 ✅
        echo   Backend:  http://localhost:5100/api ✅
        echo   Swagger:  http://localhost:5100/api/docs ✅
        echo.
        echo 🔄 Обновите страницу frontend - ошибки подключения исчезнут!
        echo 🔐 Теперь можно авторизоваться и работать с системой
        
    ) else (
        echo ⚠️ Backend еще запускается или есть проблемы
        echo 📂 Проверьте окно "Backend (порт 5100)" на наличие ошибок
        echo.
        echo 🔧 Если backend не запустился:
        echo 1. Проверьте логи в окне backend
        echo 2. Убедитесь что порт 5100 свободен
        echo 3. Проверьте файл .env в папке backend
    )
    
) else (
    echo ❌ Остались ошибки TypeScript
    echo.
    echo 🔧 РЕШЕНИЕ:
    echo 1. Запустите этот файл еще раз (некоторые ошибки исправляются поэтапно)
    echo 2. Или используйте: ПОЛНОЕ-ИСПРАВЛЕНИЕ-TYPESCRIPT.bat
    echo.
    echo 📋 Частые ошибки TypeScript исправляются за 2-3 прогона
)

echo.
cd ..
echo 💡 Подсказка: Держите это окно открытым для мониторинга
pause
