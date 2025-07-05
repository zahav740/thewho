@echo off
echo ====================================
echo ДИАГНОСТИКА BACKEND
echo ====================================
echo.

echo 🔍 Проверяем процессы на порту 5100...
netstat -ano | findstr ":5100"
if errorlevel 1 (
    echo ❌ Порт 5100 не занят - backend НЕ ЗАПУЩЕН
    echo.
    echo 💡 РЕШЕНИЕ: Запустите backend командой:
    echo    cd backend
    echo    npm run start:dev
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Порт 5100 занят - backend работает
)

echo.
echo 🔍 Проверяем доступность API...
curl -s http://localhost:5100/api/health
if errorlevel 1 (
    echo ❌ API недоступно
    echo.
    echo 💡 РЕШЕНИЕ: Перезапустите backend:
    echo    1. Закройте окно backend (Ctrl+C)
    echo    2. cd backend
    echo    3. npm run start:dev
) else (
    echo ✅ API доступно
)

echo.
echo 🔍 Проверяем Excel Import API...
curl -s http://localhost:5100/api/excel-import-db/filters
if errorlevel 1 (
    echo ❌ Excel Import API недоступно
    echo.
    echo 💡 ПРОБЛЕМА: Контроллер не подключен или backend не перезапущен
    echo.
    echo 🔧 РЕШЕНИЕ:
    echo    1. Остановите backend (Ctrl+C)
    echo    2. cd backend
    echo    3. npm run start:dev
    echo    4. Дождитесь сообщения "Application is running on: http://localhost:5100"
) else (
    echo ✅ Excel Import API работает!
)

echo.
echo ====================================
echo ДИАГНОСТИКА ЗАВЕРШЕНА
echo ====================================
pause
