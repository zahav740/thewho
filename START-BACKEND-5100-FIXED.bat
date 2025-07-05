@echo off
echo ==============================================
echo         БЫСТРЫЙ ЗАПУСК BACKEND (ПОРТ 5100)
echo ==============================================

cd /d "%~dp0\backend"

echo.
echo 🔧 Запускаем backend на порту 5100...
echo.

start "CRM Backend" npm run start:dev

echo.
echo ✅ Backend запущен на порту 5100
echo ✅ Проверьте статус: http://localhost:5100/api/health
echo.
echo 📋 Доступные API эндпоинты:
echo    - http://localhost:5100/api/orders/v2
echo    - http://localhost:5100/api/orders/v2/parse-excel
echo.
pause
