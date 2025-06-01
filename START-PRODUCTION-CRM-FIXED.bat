@echo off
chcp 65001 >nul
echo ==========================================
echo     PRODUCTION CRM - PRODUCTION DEPLOY
echo ==========================================
echo.

echo 🚀 Запуск Production CRM системы в продакшен...
echo.

REM Проверка прав администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ОШИБКА: Требуются права администратора!
    echo Запустите скрипт "Запуск от имени администратора"
    pause
    exit /b 1
)

echo ✅ Права администратора подтверждены
echo.

REM Остановка старых процессов
echo ⏹️  Остановка старых процессов...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im "npm.cmd" >nul 2>&1
taskkill /f /im "serve.cmd" >nul 2>&1

REM Очистка портов
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

timeout /t 3 /nobreak >nul
echo ✅ Процессы остановлены
echo.

REM Установка переменных окружения для продакшена
echo 🔧 Настройка environment для продакшена...
set NODE_ENV=production
set PORT=3001
set FRONTEND_PORT=3000

REM Проверка PostgreSQL
echo 🔍 Проверка PostgreSQL сервиса...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔄 Запуск PostgreSQL...
    net start postgresql >nul 2>&1
    net start postgresql-x64-14 >nul 2>&1
    timeout /t 5 /nobreak >nul
    
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Не удалось запустить PostgreSQL!
        echo Проверьте установку PostgreSQL
        pause
        exit /b 1
    )
)

echo ✅ PostgreSQL работает
echo.

REM Переход в директорию backend
echo 🏗️  Подготовка backend для продакшена...
cd /d "%~dp0backend"

REM Проверка package.json
if not exist "package.json" (
    echo ❌ Файл package.json не найден в backend!
    pause
    exit /b 1
)

REM Установка зависимостей для продакшена
echo 📦 Установка production зависимостей...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Не удалось установить зависимости backend!
    call npm install
    pause
    exit /b 1
)

REM Сборка backend
echo 🔨 Сборка backend...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки backend!
    call npm run build
    pause
    exit /b 1
)

echo ✅ Backend собран успешно
echo.

REM Выполнение миграций базы данных (опционально)
echo 🗄️  Выполнение миграций базы данных...
call npm run migration:run >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Миграции завершились с предупреждениями (возможно, уже выполнены)
)

REM Запуск backend в продакшене
echo 🚀 Запуск backend в production режиме...
start "Production CRM Backend" cmd /k "npm run start:prod"

REM Ожидание запуска backend
echo ⏰ Ожидание запуска backend...
set backend_ready=0
for /l %%i in (1,1,15) do (
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:3001/api/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Backend запущен и отвечает
        set backend_ready=1
        goto backend_ok
    )
    echo   Ожидание... (%%i/15)
)

:backend_ok
if %backend_ready%==0 (
    echo ❌ Backend не отвечает на http://localhost:3001
    echo Проверьте логи в окне "Production CRM Backend"
    pause
    exit /b 1
)

echo ✅ Backend готов на http://localhost:3001
echo.

REM Переход в директорию frontend
echo 🌐 Подготовка frontend для продакшена...
cd /d "%~dp0frontend"

REM Проверка package.json
if not exist "package.json" (
    echo ❌ Файл package.json не найден в frontend!
    pause
    exit /b 1
)

REM Установка зависимостей frontend
echo 📦 Установка frontend зависимостей...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Не удалось установить зависимости frontend!
    call npm install
    pause
    exit /b 1
)

REM Сборка frontend для продакшена
echo 🔨 Сборка frontend для продакшена...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки frontend!
    call npm run build
    pause
    exit /b 1
)

echo ✅ Frontend собран успешно
echo.

REM Установка и запуск статического сервера
echo 📡 Проверка статического сервера...
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo 📡 Установка serve...
    call npm install -g serve
    if %errorlevel% neq 0 (
        echo ❌ Не удалось установить serve!
        pause
        exit /b 1
    )
)

REM Запуск frontend в продакшене
echo 🚀 Запуск frontend в production режиме...
start "Production CRM Frontend" cmd /k "serve -s build -l 3000"

REM Ожидание запуска frontend
echo ⏰ Ожидание запуска frontend...
set frontend_ready=0
for /l %%i in (1,1,10) do (
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Frontend запущен и отвечает
        set frontend_ready=1
        goto frontend_ok
    )
    echo   Ожидание... (%%i/10)
)

:frontend_ok
if %frontend_ready%==0 (
    echo ❌ Frontend не отвечает на http://localhost:3000
    echo Проверьте логи в окне "Production CRM Frontend"
    pause
    exit /b 1
)

echo ✅ Frontend готов на http://localhost:3000
echo.

REM Финальная проверка системы
echo 🧪 Финальная проверка системы...
echo.

echo 1. Проверка API здоровья...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ API не отвечает
) else (
    echo ✅ API работает
)

echo.
echo 2. Проверка API документации...
curl -s http://localhost:3001/api/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ API документация недоступна
) else (
    echo ✅ API документация доступна
)

echo.
echo 3. Проверка основных endpoints...
curl -s http://localhost:3001/api/machines >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Machines API недоступен
) else (
    echo ✅ Machines API работает
)

curl -s http://localhost:3001/api/orders >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Orders API недоступен
) else (
    echo ✅ Orders API работает
)

echo.
echo ==========================================
echo      🎉 PRODUCTION CRM ЗАПУЩЕН!
echo ==========================================
echo.
echo 🌐 Frontend (Production):  http://localhost:3000
echo 🔌 Backend API:           http://localhost:3001
echo 📖 API Documentation:     http://localhost:3001/api/docs
echo 🏭 Machines:              http://localhost:3001/api/machines
echo 📋 Orders:                http://localhost:3001/api/orders
echo 📅 Calendar:              http://localhost:3001/api/calendar
echo.
echo 💡 Система работает в PRODUCTION режиме
echo 💡 Логи доступны в отдельных окнах
echo 💡 Для остановки используйте STOP-PRODUCTION-CRM.bat
echo.

REM Открытие браузера
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:3001/api/docs

echo 📝 Production deployment завершен успешно!
echo.
pause
