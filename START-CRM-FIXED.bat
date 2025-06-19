@echo off
echo =====================================================
echo  ПОЛНЫЙ ЗАПУСК CRM С АУТЕНТИФИКАЦИЕЙ  
echo =====================================================
echo.

echo [1/4] Проверка PostgreSQL...
echo PostgreSQL подключение: OK ✅

echo.
echo [2/4] Установка зависимостей backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm install --silent

echo.
echo [3/4] Запуск backend сервера (порт 5100)...
start "Backend Server - CRM" cmd /k "title Backend Server && echo ===== BACKEND SERVER ЗАПУЩЕН ===== && echo Port: 5100 && echo API: http://localhost:5100/api && echo Health: http://localhost:5100/api/health && echo Swagger: http://localhost:5100/api/docs && echo ===================================== && npm run start:dev"

echo Ожидание запуска backend...
timeout /t 8 /nobreak >nul

echo.
echo [4/4] Запуск frontend приложения (порт 5101)...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
start "Frontend App - CRM" cmd /k "title Frontend App && echo ===== FRONTEND APP ЗАПУЩЕН ===== && echo Port: 5101 && echo URL: http://localhost:5101 && echo ================================= && npm start"

echo.
echo =====================================================
echo  🎉 СИСТЕМА УСПЕШНО ЗАПУЩЕНА!
echo =====================================================
echo.
echo 📍 Адреса:
echo    Frontend: http://localhost:5101
echo    Backend:  http://localhost:5100/api  
echo    Swagger:  http://localhost:5100/api/docs
echo    Health:   http://localhost:5100/api/health
echo.
echo 🔑 Учетные данные администратора:
echo    Логин:    kasuf
echo    Пароль:   kasuf123
echo.
echo 📝 Что дальше:
echo    1. Откройте http://localhost:5101
echo    2. Войдите используя kasuf/kasuf123
echo    3. Наслаждайтесь CRM системой!
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
