@echo off
echo ====================================
echo БЫСТРЫЙ ЗАПУСК PRODUCTION CRM
echo ====================================
echo.

echo 1. Проверка настроек...
echo Backend порт: 5101
echo Frontend порт: 5100  
echo База данных: thewho на localhost:5432
echo.

echo 2. Запуск backend сервера...
cd backend
start cmd /k "echo BACKEND ЗАПУСКАЕТСЯ && npm run start:dev"
echo Backend запущен в отдельном окне

echo.
echo 3. Ждем 5 секунд для запуска backend...
timeout /t 5 /nobreak > nul

echo.
echo 4. Запуск frontend приложения...
cd ..\frontend  
start cmd /k "echo FRONTEND ЗАПУСКАЕТСЯ && npm start"
echo Frontend запущен в отдельном окне

echo.
echo ====================================
echo ЗАПУСК ЗАВЕРШЕН!
echo ====================================
echo Backend: http://localhost:5101
echo Frontend: http://localhost:5100
echo API Docs: http://localhost:5101/api/docs
echo Health: http://localhost:5101/api/health
echo.
echo Окна терминалов с логами запущены отдельно.
echo Закройте их вручную когда закончите работу.
echo.
pause
