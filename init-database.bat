@echo off
title Инициализация базы данных Production CRM
echo.
echo ========================================
echo       ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
echo ========================================
echo.

cd /d "C:\Users\Alexey\Downloads\TheWho\production-crm\backend"

echo Проверка подключения к PostgreSQL...
echo.

echo Запуск миграций TypeORM...
echo.
call npm run migration:run

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Миграции не выполнены!
    echo.
    echo Возможные причины:
    echo - PostgreSQL не запущен
    echo - Неверные настройки подключения к БД
    echo - База данных 'production_crm' не создана
    echo.
    echo Создайте базу данных вручную:
    echo psql -U postgres -c "CREATE DATABASE production_crm;"
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ База данных успешно инициализирована!
echo.
echo Созданы таблицы:
echo - machines (станки)
echo - orders (заказы)
echo - operations (операции)
echo - shift_records (записи смен)
echo.
pause
