@echo off
echo =====================================================
echo  ЗАПУСК CRM С АУТЕНТИФИКАЦИЕЙ
echo =====================================================
echo.

echo Шаг 1: Установка зависимостей для аутентификации...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call install-auth-deps.bat

echo.
echo Шаг 2: Запуск backend сервера...
start "Backend Server" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\backend && npm run start:dev"

echo.
echo Ожидание запуска backend сервера...
timeout /t 5 /nobreak >nul

echo.
echo Шаг 3: Запуск frontend приложения...
start "Frontend App" cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && npm start"

echo.
echo =====================================================
echo  СИСТЕМА ЗАПУЩЕНА!
echo =====================================================
echo.
echo Backend: http://localhost:5100
echo Frontend: http://localhost:5101
echo API Docs: http://localhost:5100/api/docs
echo.
echo Админ доступ:
echo Логин: kasuf
echo Пароль: kasuf123
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
