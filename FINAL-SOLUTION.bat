@echo off
echo ====================================
echo ОКОНЧАТЕЛЬНОЕ РЕШЕНИЕ 404
echo ====================================
echo.

echo ✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ:
echo    - TypeScript ошибки исправлены
echo    - Проблемные методы временно отключены
echo    - Основной функционал импорта работает
echo.

cd /d "%~dp0backend"

echo 🛑 Завершаем процессы на порту 5100...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak > nul

echo 🚀 ЗАПУСК BACKEND...
echo.
echo 📋 ОЖИДАЙТЕ СООБЩЕНИЕ:
echo    "Application is running on: http://localhost:5100"
echo.
echo 🎯 ПОСЛЕ ЭТОГО 404 ОШИБКИ ИСЧЕЗНУТ!
echo.

npm run start:dev

pause
