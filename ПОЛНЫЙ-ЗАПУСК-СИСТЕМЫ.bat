@echo off
echo ===========================================
echo     ПОЛНЫЙ ЗАПУСК СИСТЕМЫ МОНИТОРИНГА
echo ===========================================
echo.

echo 📋 Порядок запуска:
echo    1. Backend (NestJS) на порту 5100
echo    2. Frontend (React) на порту 3000
echo    3. Тестирование API (опционально)
echo.

echo ⚠️  ВАЖНО: НЕ ЗАКРЫВАЙТЕ ЭТО ОКНО!
echo    Оно будет управлять всеми процессами
echo.

pause

echo.
echo ===========================================
echo         ЭТАП 1: ЗАПУСК BACKEND
echo ===========================================
echo.

echo Запускаем backend в новом окне...
start "BACKEND-SERVER" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\backend && npm run start"

echo Ждем запуска backend (30 секунд)...
timeout /t 30 /nobreak

echo.
echo ===========================================
echo         ЭТАП 2: ЗАПУСК FRONTEND  
echo ===========================================
echo.

echo Запускаем frontend в новом окне...
start "FRONTEND-SERVER" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && set GENERATE_SOURCEMAP=false && set TSC_COMPILE_ON_ERROR=true && npm start"

echo Ждем запуска frontend (20 секунд)...
timeout /t 20 /nobreak

echo.
echo ===========================================
echo           СИСТЕМА ЗАПУЩЕНА!
echo ===========================================
echo.
echo 🌐 URL для доступа:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5100
echo.
echo 📱 Как пользоваться:
echo    1. Откройте http://localhost:3000 в браузере
echo    2. Перейдите в секцию "Смены" для автоматического мониторинга
echo    3. Или в секцию "Производство" для ручного управления
echo    4. При достижении 30 деталей появится модальное окно
echo.
echo 🎯 Тестирование:
echo    - Нажмите T для тестирования API
echo    - Нажмите B для перезапуска Backend
echo    - Нажмите F для перезапуска Frontend
echo    - Нажмите Q для выхода
echo.

:menu
echo.
choice /c TBFQ /m "Выберите действие: [T]ест API, [B]ackend, [F]rontend, [Q]выход"

if errorlevel 4 goto :exit
if errorlevel 3 goto :restart_frontend
if errorlevel 2 goto :restart_backend
if errorlevel 1 goto :test_api

:test_api
echo.
echo Тестируем API endpoints...
start "API-TEST" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm && ТЕСТ-НОВЫХ-API.bat"
goto :menu

:restart_backend
echo.
echo Перезапускаем Backend...
taskkill /f /fi "WINDOWTITLE eq BACKEND-SERVER"
start "BACKEND-SERVER" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\backend && npm run start"
goto :menu

:restart_frontend
echo.
echo Перезапускаем Frontend...
taskkill /f /fi "WINDOWTITLE eq FRONTEND-SERVER"
start "FRONTEND-SERVER" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && set TSC_COMPILE_ON_ERROR=true && npm start"
goto :menu

:exit
echo.
echo Завершаем все процессы...
taskkill /f /fi "WINDOWTITLE eq BACKEND-SERVER" 2>nul
taskkill /f /fi "WINDOWTITLE eq FRONTEND-SERVER" 2>nul
echo.
echo 👋 Спасибо за использование системы мониторинга!
echo.
pause
exit

echo.
echo ❌ Если возникли проблемы:
echo    1. Проверьте, что PostgreSQL запущен
echo    2. Убедитесь, что порты 3000 и 5100 свободны
echo    3. Проверьте логи в окнах серверов
echo.
pause
