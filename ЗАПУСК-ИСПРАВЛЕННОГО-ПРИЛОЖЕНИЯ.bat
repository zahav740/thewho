@echo off
echo ==========================================
echo   ЗАПУСК ИСПРАВЛЕННОГО ПРИЛОЖЕНИЯ
echo ==========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo [INFO] Запускаем приложение с исправленными файлами...
echo.

echo [1/2] Запускаем Backend...
start "BACKEND" cmd /c "cd backend && npm start"

echo [2/2] Ожидаем 5 секунд и запускаем Frontend...
timeout /t 5 /nobreak

start "FRONTEND" cmd /c "cd frontend && npm start"

echo.
echo ✅ Приложение запущено!
echo.
echo Backend: http://localhost:5100
echo Frontend: http://localhost:3000
echo.
echo Откроется в браузере автоматически через несколько секунд.
echo.
echo Для остановки закройте окна терминалов или нажмите Ctrl+C
echo.
pause