@echo off
title Production CRM - Полная инициализация и запуск
color 0A

echo.
echo ================================================================
echo                  PRODUCTION CRM - ИНИЦИАЛИЗАЦИЯ
echo ================================================================
echo.

set PROJECT_ROOT=C:\Users\Alexey\Downloads\TheWho\production-crm

echo 🔄 Шаг 1: Проверка PostgreSQL...
echo.

REM Проверяем, запущен ли PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL не запущен или недоступен
    echo.
    echo Запустите PostgreSQL и повторите попытку
    echo Или измените настройки подключения в backend/.env
    pause
    exit /b 1
)
echo ✅ PostgreSQL доступен

echo.
echo 🔄 Шаг 2: Создание базы данных (если не существует)...
echo.

REM Создаем базу данных, если она не существует
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'production_crm'" | findstr -q 1
if %ERRORLEVEL% NEQ 0 (
    echo Создание базы данных production_crm...
    psql -U postgres -c "CREATE DATABASE production_crm;"
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Ошибка создания базы данных
        pause
        exit /b 1
    )
    echo ✅ База данных создана
) else (
    echo ✅ База данных уже существует
)

echo.
echo 🔄 Шаг 3: Запуск миграций...
echo.

cd /d "%PROJECT_ROOT%\backend"
call npm run migration:run

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка выполнения миграций
    pause
    exit /b 1
)
echo ✅ Миграции выполнены успешно

echo.
echo 🔄 Шаг 4: Установка зависимостей frontend (если необходимо)...
echo.

cd /d "%PROJECT_ROOT%\frontend"
if not exist "node_modules" (
    echo Установка зависимостей frontend...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Ошибка установки зависимостей frontend
        pause
        exit /b 1
    )
)
echo ✅ Зависимости frontend готовы

echo.
echo 🔄 Шаг 5: Установка зависимостей backend (если необходимо)...
echo.

cd /d "%PROJECT_ROOT%\backend"
if not exist "node_modules" (
    echo Установка зависимостей backend...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Ошибка установки зависимостей backend
        pause
        exit /b 1
    )
)
echo ✅ Зависимости backend готовы

echo.
echo ================================================================
echo                     ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА
echo ================================================================
echo.
echo ✅ База данных создана и настроена
echo ✅ Миграции выполнены
echo ✅ Все зависимости установлены
echo.
echo Теперь можно запустить приложение:
echo - Backend:  cd backend ^&^& npm run start:dev
echo - Frontend: cd frontend ^&^& npm start
echo.
echo Или используйте start-all.bat для запуска обеих частей
echo.
pause
