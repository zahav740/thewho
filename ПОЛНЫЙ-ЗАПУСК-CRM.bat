@echo off
echo ==============================================
echo    ПОЛНЫЙ ЗАПУСК CRM СИСТЕМЫ
echo ==============================================
echo.

echo 🛑 Останавливаем все процессы...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 🗃️ Запускаем PostgreSQL...
net start postgresql-x64-14 >nul 2>&1

echo 🔧 Запускаем Backend...
start "Backend Server" cmd /c "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\backend && npm run start:dev"

echo ⏱️ Ждем запуска backend (10 секунд)...
timeout /t 10 >nul

echo 🌐 Запускаем Frontend...
start "Frontend Server" cmd /c "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && npm start"

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА:
echo    🔧 Backend: http://localhost:5100
echo    🌐 Frontend: http://localhost:5101
echo.
echo 🔑 ДАННЫЕ ДЛЯ ВХОДА:
echo    Логин: kasuf
echo    Пароль: kasuf123
echo.
echo 📋 ИНСТРУКЦИЯ:
echo    1. Дождитесь полной загрузки (1-2 минуты)
echo    2. Откройте http://localhost:5101
echo    3. Войдите в систему
echo    4. Перейдите в "База данных"
echo    5. Проверьте большие иконки (32px)
echo.
echo ⚠️ Если вход не работает:
echo    - Проверьте что backend запустился без ошибок
echo    - Убедитесь что PostgreSQL работает
echo    - Проверьте консоль на ошибки
echo.

pause
