@echo off
echo ========================================
echo 🔄 БЫСТРЫЙ ПЕРЕЗАПУСК BACKEND
echo ========================================

echo.
echo 🛑 Останавливаем backend процессы...
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im npm.cmd /t >nul 2>&1

echo.
echo ⏳ Ждем 3 секунды...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Запускаем backend...
cd backend
start "Backend Server" cmd /k "npm run start:dev"
cd ..

echo.
echo ⏳ Ждем запуска backend (15 секунд)...
timeout /t 15 /nobreak

echo.
echo 🔍 Проверяем статус backend...
curl -s http://localhost:5100/api/health
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Backend успешно запущен!
    echo 🌐 http://localhost:5100/api/docs - Swagger API
    echo 🏥 http://localhost:5100/api/health - Health check
) else (
    echo.
    echo ❌ Backend не запустился!
    echo Проверьте окно с backend для ошибок.
)

echo.
echo ========================================
pause
