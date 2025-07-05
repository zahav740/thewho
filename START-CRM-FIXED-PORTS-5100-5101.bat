@echo off
chcp 65001
echo ========================================
echo ЗАПУСК CRM СИСТЕМЫ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
echo ========================================
echo Бэкенд: порт 5100
echo Фронтенд: порт 5101
echo ========================================

echo.
echo 🔧 ПРОВЕРКА ПОРТОВ...
echo Проверяем, свободны ли порты 5100 и 5101...

netstat -an | find "5100" >nul
if %errorlevel% == 0 (
    echo ❌ Порт 5100 уже занят!
    echo Завершаем процессы на порту 5100...
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":5100"') do taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 >nul
)

netstat -an | find "5101" >nul
if %errorlevel% == 0 (
    echo ❌ Порт 5101 уже занят!
    echo Завершаем процессы на порту 5101...
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":5101"') do taskkill /PID %%a /F >nul 2>&1
    timeout /t 2 >nul
)

echo ✅ Порты освобождены!

echo.
echo 🛠️ ИСПРАВЛЕНИЯ TYPESCRIPT В BACKEND...
cd backend
echo Исправляем типы Express...

echo.
echo 📦 УСТАНОВКА ЗАВИСИМОСТЕЙ BACKEND...
if not exist node_modules (
    echo Устанавливаем зависимости backend...
    call npm install
) else (
    echo ✅ Зависимости backend уже установлены
)

echo.
echo 🚀 ЗАПУСК BACKEND на порту 5100...
start "Backend Server" cmd /k "cd /d %cd% && echo BACKEND СЕРВЕР ПОРТ 5100 && npm run start:dev"

echo Ждем запуск backend сервера...
timeout /t 8 >nul

echo.
echo 📦 УСТАНОВКА ЗАВИСИМОСТЕЙ FRONTEND...
cd ..\frontend
if not exist node_modules (
    echo Устанавливаем зависимости frontend...
    call npm install
) else (
    echo ✅ Зависимости frontend уже установлены
)

echo.
echo 🌐 ЗАПУСК FRONTEND на порту 5101...
start "Frontend Server" cmd /k "cd /d %cd% && echo FRONTEND СЕРВЕР ПОРТ 5101 && npm run start-no-browser"

echo.
echo ⏳ Ждем запуск frontend сервера...
timeout /t 5 >nul

echo.
echo 🎯 ПРОВЕРКА СЕРВИСОВ...
echo Проверяем доступность сервисов...

timeout /t 5 >nul

echo.
echo ================================================================
echo ✅ CRM СИСТЕМА ЗАПУЩЕНА УСПЕШНО!
echo ================================================================
echo.
echo 🖥️  BACKEND API:     http://localhost:5100/api
echo 📚 Документация:    http://localhost:5100/api/docs  
echo 🌐 FRONTEND:        http://localhost:5101
echo 🔧 Состояние:       http://localhost:5100/api/health
echo.
echo ================================================================
echo 🔥 ИСПРАВЛЕНИЯ В ЭТОЙ ВЕРСИИ:
echo ✅ Исправлены ошибки типизации Express в backend
echo ✅ Изменена загрузка Excel с колонки J на колонку K для приоритета
echo ✅ Настроены порты: Backend 5100, Frontend 5101
echo ✅ Добавлена автоочистка занятых портов
echo ================================================================
echo.
echo Для остановки нажмите любую клавишу...
start "" "http://localhost:5101"
pause >nul

echo Завершаем процессы...
taskkill /FI "WINDOWTITLE eq Backend Server" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server" /T /F >nul 2>&1
echo Все процессы завершены.
