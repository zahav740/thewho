@echo off
echo ==========================================
echo   НАСТРОЙКА AUTH СИСТЕМЫ - ШАГ ЗА ШАГОМ
echo ==========================================
echo.

echo ШАГ 1: Генерируем хэшированные пароли...
node generate-password-hashes.js

echo.
echo ШАГ 2: Выполните SQL скрипты в вашей базе данных:
echo    1. Сначала выполните: 1-create-users-table.sql
echo    2. Затем выполните команды выше для добавления пользователей
echo.

echo ШАГ 3: Запустите backend:
echo    npm run start:dev
echo.

echo ШАГ 4: Протестируйте endpoints:
echo    Откройте новое окно командной строки и выполните:
echo    node test-auth-endpoints.js
echo.

echo ШАГ 5: Проверьте в браузере:
echo    http://localhost:5200/api/auth/test
echo.

echo УЧЕТНЫЕ ДАННЫЕ ДЛЯ ТЕСТИРОВАНИЯ:
echo    kasuf / password123 (admin)
echo    admin / admin123 (admin)  
echo    user / user123 (user)
echo    demo / demo123 (user)
echo.

pause
