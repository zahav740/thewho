@echo off
echo ====================================
echo ЭКСТРЕННЫЙ ЗАПУСК BACKEND
echo ====================================
echo.

echo 🔍 Проверяем порт 5100...
netstat -ano | findstr ":5100"
if errorlevel 1 (
    echo ❌ Порт 5100 свободен - backend НЕ ЗАПУЩЕН!
    echo 🚀 Запускаем backend...
) else (
    echo ⚠️  Порт 5100 занят, завершаем процессы...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul
    timeout /t 2 /nobreak > nul
)

echo.
echo 🚀 ЗАПУСК BACKEND НА ПОРТУ 5100...
echo.
cd /d "%~dp0backend"

echo 📋 СЛЕДИТЕ ЗА КОНСОЛЬЮ:
echo    ✅ Дождитесь: "Application is running on: http://localhost:5100"
echo    ✅ Должно появиться: "Swagger API docs: http://localhost:5100/api/docs"
echo.
echo 🎯 ПОСЛЕ ЭТОГО ОБНОВИТЕ СТРАНИЦУ В БРАУЗЕРЕ!
echo.

npm run start:dev

pause
