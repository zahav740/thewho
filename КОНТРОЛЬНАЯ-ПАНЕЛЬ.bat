@echo off
title Production CRM - Быстрый запуск

:menu
cls
echo ===============================================
echo 🚀 PRODUCTION CRM - КОНТРОЛЬНАЯ ПАНЕЛЬ
echo ===============================================
echo.
echo Выберите действие:
echo.
echo 1. 🔍 Проверить TypeScript ошибки
echo 2. 🏗️ Собрать backend
echo 3. 🚀 Запустить backend (production)
echo 4. 🎨 Запустить frontend
echo 5. 📦 Полное развертывание системы
echo 6. 🗄️ Проверить подключение к базе данных
echo 7. 📋 Показать статус портов 5100-5101
echo 8. ❌ Выход
echo.
set /p choice="Ваш выбор (1-8): "

if "%choice%"=="1" goto check_typescript
if "%choice%"=="2" goto build_backend
if "%choice%"=="3" goto run_backend
if "%choice%"=="4" goto run_frontend
if "%choice%"=="5" goto full_deploy
if "%choice%"=="6" goto check_database
if "%choice%"=="7" goto check_ports
if "%choice%"=="8" goto exit
goto menu

:check_typescript
cls
echo 🔍 Проверка TypeScript ошибок...
echo ===============================================
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
npx tsc --noEmit
echo.
echo ✅ Проверка завершена!
pause
goto menu

:build_backend
cls
echo 🏗️ Сборка backend...
echo ===============================================
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm run build
echo.
echo ✅ Сборка завершена!
pause
goto menu

:run_backend
cls
echo 🚀 Запуск backend (production)...
echo ===============================================
echo Backend будет доступен на: http://localhost:5100
echo API документация: http://localhost:5100/api/docs
echo.
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm run start:prod
pause
goto menu

:run_frontend
cls
echo 🎨 Запуск frontend...
echo ===============================================
echo Frontend будет доступен на: http://localhost:5101
echo.
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
call npm start
pause
goto menu

:full_deploy
cls
echo 📦 Полное развертывание...
echo ===============================================
call "C:\Users\kasuf\Downloads\TheWho\production-crm\ПОЛНОЕ-РАЗВЕРТЫВАНИЕ.bat"
pause
goto menu

:check_database
cls
echo 🗄️ Проверка подключения к базе данных...
echo ===============================================
echo Проверяем PostgreSQL на localhost:5432...
echo База данных: thewho
echo Пользователь: postgres
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "\dt"
if errorlevel 1 (
    echo ❌ Ошибка подключения к базе данных!
    echo Убедитесь что PostgreSQL запущен и база данных 'thewho' создана.
) else (
    echo ✅ Подключение к базе данных успешно!
)
pause
goto menu

:check_ports
cls
echo 📋 Статус портов 5100-5101...
echo ===============================================
netstat -an | findstr ":5100"
netstat -an | findstr ":5101"
echo.
echo Если порты заняты, используйте команду для освобождения:
echo taskkill /f /im node.exe
pause
goto menu

:exit
cls
echo ✅ До свидания!
echo.
exit /b 0
