@echo off
echo ===============================================
echo      ПОЛНОЕ ТЕСТИРОВАНИЕ CRM СИСТЕМЫ ЛОКАЛЬНО
echo ===============================================
echo.

echo 1. Настройка базы данных...
echo    Выполните в вашей БД:
echo    - 1-create-users-table.sql
echo    - Затем команды из generate-password-hashes.js
echo.
pause

echo 2. Генерируем пароли для БД...
cd backend
node generate-password-hashes.js > users-insert.sql
echo    ✅ SQL команды сохранены в users-insert.sql
echo    📋 Скопируйте и выполните их в базе данных
echo.
pause

echo 3. Запускаем backend на порту 5200...
start "Backend" cmd /k "npm run start:dev"
echo    ⏳ Ждем 10 секунд для запуска...
timeout /t 10

echo 4. Тестируем backend endpoints...
node test-auth-endpoints.js
echo.
pause

echo 5. Запускаем frontend...
cd ..\frontend
start "Frontend" cmd /k "npm start"
echo    🌐 Frontend запускается на http://localhost:5101
echo.

echo 6. Автоматические тесты...
timeout /t 5
echo    Тестируем API подключение из браузера...
echo    Откройте: http://localhost:5101
echo    В консоли браузера должно быть:
echo    - ✅ API Success: /api/translations/client 200
echo    - ✅ Auth endpoint работает: http://localhost:5200/api/auth/test
echo.

echo 7. Тест авторизации...
echo    В приложении попробуйте войти:
echo    Логин: kasuf
echo    Пароль: password123
echo.

echo ===============================================
echo              СИСТЕМА ГОТОВА!
echo ===============================================
echo.
echo Если все работает:
echo 1. Остановите серверы (Ctrl+C в окнах)
echo 2. Запустите: BILD.bat (для деплоя)
echo 3. Загрузите deploy.zip на сервер
echo.
pause
