@echo off
chcp 65001 > nul
echo.
echo 🚀 БЫСТРЫЙ ЗАПУСК: BACKEND + FRONTEND
echo =================================
echo.

cd /d "%~dp0"

echo 📋 Проверяем статус портов...
call ДИАГНОСТИКА-ПОРТОВ.bat

echo.
echo 🔧 Frontend уже запущен на 5101, запускаем только Backend...
echo.

echo 🚀 Запуск Backend на порту 5100...
start "Backend (5100)" cmd /c "ЗАПУСК-BACKEND-ПОРТ-5100.bat"

echo.
echo ⏳ Ждем 3 секунды для запуска backend...
timeout /t 3 /nobreak > nul

echo.
echo 🔍 Проверяем доступность backend...
curl -s http://localhost:5100/api/health > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend запущен и доступен!
    echo.
    echo 🌐 Система готова:
    echo   Frontend: http://localhost:5101
    echo   Backend:  http://localhost:5100/api
    echo   Swagger:  http://localhost:5100/api/docs
    echo.
    echo 🎉 Попробуйте обновить страницу frontend
) else (
    echo ❌ Backend еще не готов, подождите немного...
    echo 📂 Проверьте окно "Backend (5100)" на наличие ошибок
)

echo.
pause
