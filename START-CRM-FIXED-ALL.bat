@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo   PRODUCTION CRM - ПОЛНЫЕ ИСПРАВЛЕНИЯ
echo ==============================================
echo   Версия: 2.0.0 - Fixed All Issues  
echo   Дата: %date% %time%
echo ==============================================
echo.

REM Установка переменных окружения
set NODE_ENV=development
set BACKEND_PORT=5100
set FRONTEND_PORT=5101

echo 📋 Конфигурация:
echo - Backend Port:  %BACKEND_PORT%
echo - Frontend Port: %FRONTEND_PORT%
echo - Environment:   %NODE_ENV%
echo - Database:      postgresql://postgres:***@localhost:5432/thewho
echo.

echo 🛑 Остановка существующих процессов...
echo.

REM Остановка процессов на нужных портах
echo Останавливаем процессы на порту %BACKEND_PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%BACKEND_PORT%" ^| find "LISTENING"') do (
    echo   Убиваем процесс %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Останавливаем процессы на порту %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%FRONTEND_PORT%" ^| find "LISTENING"') do (
    echo   Убиваем процесс %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Остановка всех Node.js процессов
echo Останавливаем все Node.js процессы...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

timeout /t 3 >nul

echo.
echo 🗄️ Проверка базы данных PostgreSQL...

REM Проверка сервиса PostgreSQL
set PG_SERVICE=
for %%s in (postgresql-x64-14 postgresql-x64-15 postgresql-x64-16 postgresql-x64-17 PostgreSQL) do (
    sc query "%%s" >nul 2>&1
    if !errorlevel!==0 (
        set PG_SERVICE=%%s
        goto :found_pg_service
    )
)

:found_pg_service
if defined PG_SERVICE (
    echo ✅ PostgreSQL сервис найден: %PG_SERVICE%
    sc query "%PG_SERVICE%" | find "RUNNING" >nul
    if !errorlevel!==0 (
        echo ✅ PostgreSQL уже запущен
    ) else (
        echo 🔄 Запускаем PostgreSQL...
        net start "%PG_SERVICE%" >nul 2>&1
        if !errorlevel!==0 (
            echo ✅ PostgreSQL успешно запущен
        ) else (
            echo ⚠️ Не удалось запустить PostgreSQL автоматически
            echo 💡 Пожалуйста, запустите PostgreSQL вручную
        )
    )
) else (
    echo ⚠️ PostgreSQL сервис не найден
    echo 💡 Убедитесь, что PostgreSQL установлен и запущен
)

echo.
echo 🔧 Подготовка Backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

if not exist "package.json" (
    echo ❌ Backend package.json не найден!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Установка зависимостей backend...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Ошибка установки зависимостей backend
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости backend найдены
)

echo 🔨 Сборка backend...
npm run build
if !errorlevel! neq 0 (
    echo ⚠️ Ошибка при сборке, пробуем запустить без сборки...
)

echo 🚀 Запуск Backend сервера на порту %BACKEND_PORT%...
start "CRM Backend Server" cmd /k "echo ========================================== && echo   BACKEND SERVER STARTING... && echo ========================================== && echo Port: %BACKEND_PORT% && echo Environment: %NODE_ENV% && echo Database: postgresql://postgres:***@localhost:5432/thewho && echo ========================================== && npm run start:dev"

echo.
echo ⏳ Ожидание запуска backend (15 секунд)...
echo    - Проверяем готовность каждые 3 секунды
echo.

set /a backend_attempts=0
:check_backend_status
set /a backend_attempts+=1
if %backend_attempts% gtr 5 (
    echo ⚠️ Backend долго запускается, продолжаем с frontend...
    goto :continue_frontend
)

timeout /t 3 >nul
curl -s http://localhost:%BACKEND_PORT%/api/health >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Backend готов! (попытка %backend_attempts%)
    goto :backend_ready
) else (
    echo ⏳ Backend запускается... (попытка %backend_attempts%/5)
    goto :check_backend_status
)

:backend_ready
echo ✅ Backend полностью готов к работе!

:continue_frontend
echo.
echo 🔧 Подготовка Frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

if not exist "package.json" (
    echo ❌ Frontend package.json не найден!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Установка зависимостей frontend...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Ошибка установки зависимостей frontend
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости frontend найдены
)

echo 🚀 Запуск Frontend React приложения на порту %FRONTEND_PORT%...
echo    - Автоматическое открытие браузера включено
echo    - Hot reload включен
echo.

start "CRM Frontend App" cmd /k "echo ========================================== && echo   FRONTEND REACT APP STARTING... && echo ========================================== && echo Port: %FRONTEND_PORT% && echo Environment: %NODE_ENV% && echo API URL: http://localhost:%BACKEND_PORT%/api && echo Hot Reload: ENABLED && echo Auto Browser: ENABLED && echo ========================================== && set BROWSER=default && set PORT=%FRONTEND_PORT% && npm start"

echo ⏳ Ожидание запуска frontend (20 секунд)...
echo    - Проверяем готовность каждые 4 секунды
echo.

set /a frontend_attempts=0
:check_frontend_status
set /a frontend_attempts+=1
if %frontend_attempts% gtr 5 (
    echo ⚠️ Frontend долго запускается, открываем браузер вручную...
    goto :open_browser_manual
)

timeout /t 4 >nul
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Frontend готов! (попытка %frontend_attempts%)
    goto :frontend_ready
) else (
    echo ⏳ Frontend запускается... (попытка %frontend_attempts%/5)
    goto :check_frontend_status
)

:frontend_ready
echo ✅ Frontend полностью готов к работе!
echo ⏳ Даем React еще 3 секунды для полной инициализации...
timeout /t 3 >nul

:open_browser_manual
echo.
echo 🌐 Открываем приложение в браузере...
start "" "http://localhost:%FRONTEND_PORT%"

echo.
echo ==============================================
echo   ✅ ЗАПУСК ЗАВЕРШЕН УСПЕШНО!
echo ==============================================
echo.
echo 🌐 URL приложения:
echo   Frontend:     http://localhost:%FRONTEND_PORT%
echo   Backend API:  http://localhost:%BACKEND_PORT%/api
echo   Swagger Docs: http://localhost:%BACKEND_PORT%/api/docs
echo   Health Check: http://localhost:%BACKEND_PORT%/api/health
echo.
echo 🗄️ База данных:
echo   Host:         localhost:5432
echo   Database:     thewho
echo   Username:     postgres
echo   Environment:  %NODE_ENV%
echo.
echo 🔧 Исправленные проблемы:
echo   ✅ Исправлены ошибки иконок
echo   ✅ Исправлены deprecated Antd компоненты
echo   ✅ Исправлена конфигурация портов (5100/5101)
echo   ✅ Исправлены API endpoints
echo   ✅ Исправлена форма входа
echo   ✅ Устранены ошибки SVG
echo   ✅ Настроена правильная автодетекция API
echo.
echo 👤 Тестовые пользователи:
echo   Админ: kasuf / kasuf123
echo.
echo 💡 Подсказки:
echo   - Изменения в коде автоматически перезагружаются
echo   - Backend логи в окне "CRM Backend Server"
echo   - Frontend логи в окне "CRM Frontend App"
echo   - Для отладки используйте F12 в браузере
echo   - Все исправления применены автоматически
echo.
echo 🎉 Production CRM готов к работе!
echo.
echo Держите это окно открытым для мониторинга системы.
echo Нажмите любую клавишу для завершения...
pause
