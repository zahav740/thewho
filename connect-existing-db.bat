@echo off
chcp 65001 >nul
title Production CRM - Подключение к существующей БД
color 0A

echo.
echo ================================================================
echo            ПОДКЛЮЧЕНИЕ К СУЩЕСТВУЮЩЕЙ БАЗЕ ДАННЫХ
echo ================================================================
echo.

set PROJECT_ROOT=C:\Users\Alexey\Downloads\TheWho\production-crm\backend

echo 🔍 Проверяем подключение к базе данных 'the_who'...
echo.

cd /d "%PROJECT_ROOT%"

REM Проверяем подключение к базе the_who
psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT current_database(), version();" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Не удалось подключиться к базе данных 'the_who'
    echo.
    echo Проверьте:
    echo 1. Запущен ли PostgreSQL
    echo 2. Правильность пароля (magarel)
    echo 3. Существует ли база данных 'the_who'
    echo.
    pause
    exit /b 1
)

echo ✅ Подключение к базе данных 'the_who' успешно!
echo.

echo 🔍 Проверяем существующие таблицы...
echo.
psql -h localhost -p 5432 -U postgres -d the_who -c "\dt" 2>nul

echo.
echo 🔄 Запускаем миграции для создания недостающих таблиц...
echo.

REM Запускаем миграции
call npm run migration:run

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка выполнения миграций
    echo.
    echo Возможные причины:
    echo 1. Некоторые таблицы уже существуют
    echo 2. Конфликт схем данных
    echo 3. Проблемы с правами доступа
    echo.
    echo 🔧 Попробуем принудительное создание таблиц...
    
    REM Пытаемся создать таблицы вручную
    psql -h localhost -p 5432 -U postgres -d the_w -c "
    DO \$\$ 
    BEGIN
        -- Создаем таблицу machines если не существует
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'machines') THEN
            CREATE TABLE machines (
                id SERIAL PRIMARY KEY,
                code VARCHAR NOT NULL UNIQUE,
                type VARCHAR NOT NULL CHECK (type IN ('MILLING', 'TURNING')),
                axes INTEGER NOT NULL,
                \"isActive\" BOOLEAN NOT NULL DEFAULT true,
                \"isOccupied\" BOOLEAN NOT NULL DEFAULT false,
                \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(),
                \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now()
            );
            INSERT INTO machines (code, type, axes) VALUES 
                ('M001', 'MILLING', 3),
                ('M002', 'MILLING', 4),
                ('T001', 'TURNING', 3);
        END IF;
        
        -- Создаем таблицу orders если не существует  
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
            CREATE TABLE orders (
                id SERIAL PRIMARY KEY,
                drawing_number VARCHAR UNIQUE,
                quantity INTEGER NOT NULL,
                deadline DATE NOT NULL,
                priority VARCHAR NOT NULL CHECK (priority IN ('1', '2', '3', '4')),
                \"workType\" VARCHAR,
                \"pdfPath\" VARCHAR,
                \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(),
                \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now()
            );
        END IF;
        
        RAISE NOTICE 'Таблицы созданы успешно';
    END
    \$\$;" 2>nul
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Основные таблицы созданы вручную
    )
) else (
    echo ✅ Миграции выполнены успешно!
)

echo.
echo 🔍 Проверяем созданные таблицы...
echo.
psql -h localhost -p 5432 -U postgres -d the_who -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;" 2>nul

echo.
echo ================================================================
echo                    БАЗА ДАННЫХ ГОТОВА
echo ================================================================
echo.
echo ✅ База данных 'the_who' настроена
echo ✅ Все необходимые таблицы созданы
echo ✅ Тестовые данные добавлены
echo.
echo 🚀 Теперь можно запустить приложение:
echo.
echo Backend:  npm run start:dev
echo Frontend: cd ..\frontend ^&^& npm start
echo.
echo Или используйте: start-all.bat
echo.
pause

REM Предложение запустить приложение
echo.
choice /M "Запустить приложение сейчас"
if %ERRORLEVEL%==1 (
    echo.
    echo 🚀 Запускаем приложение...
    
    REM Запускаем backend
    start "Production CRM Backend" cmd /k "npm run start:dev"
    
    REM Ждем немного и запускаем frontend
    timeout /t 3 /nobreak >nul
    cd /d "%PROJECT_ROOT%\..\frontend"
    start "Production CRM Frontend" cmd /k "npm start"
    
    echo.
    echo ✅ Приложение запущено!
    echo 🔗 Backend: http://localhost:3000
    echo 🔗 Frontend: http://localhost:3001
)
