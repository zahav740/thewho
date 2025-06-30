@echo off
echo =================================
echo     БЫСТРЫЙ ТЕСТ AUTH СИСТЕМЫ
echo =================================
echo.

echo 1. Генерируем хэшированные пароли...
node generate-password-hashes.js > password-hashes.sql
echo    ✅ Пароли сгенерированы в password-hashes.sql

echo.
echo 2. Создайте таблицу users в базе данных:
echo    - Выполните create-users-table-fixed.sql
echo    - Затем выполните password-hashes.sql
echo.

echo 3. Запустите backend:
echo    npm run start:dev
echo.

echo 4. Тестируем endpoints (в новом окне):
echo    node test-auth-endpoints.js
echo.

echo 5. Тест в браузере:
echo    http://localhost:5200/api/auth/test
echo.

pause
