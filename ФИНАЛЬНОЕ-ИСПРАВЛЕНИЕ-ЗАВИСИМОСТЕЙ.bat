@echo off
echo ========================================
echo   ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ЗАВИСИМОСТЕЙ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🛑 Останавливаем все процессы Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 🔧 Очищаем кэш и пересобираем...
rmdir /s /q dist 2>nul
call npm run build

if errorlevel 1 (
    echo.
    echo ❌ ОШИБКА СБОРКИ!
    echo.
    echo 🔍 Проверьте TypeScript ошибки:
    echo    npx tsc --noEmit
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ СБОРКА УСПЕШНА!
echo.
echo 🚀 Запускаем Backend с исправленными зависимостями...
echo.
echo 📊 Сервисы будут доступны на:
echo    Backend API:  http://localhost:5100/api
echo    Swagger UI:   http://localhost:5100/api/docs  
echo    Health Check: http://localhost:5100/api/health
echo.
echo 🔄 Запуск в режиме разработки...

call npm run start:dev

pause
