@echo off
echo =====================================================
echo  ПРОВЕРКА И ЗАПУСК POSTGRESQL
echo =====================================================
echo.

echo Проверка статуса PostgreSQL...
sc query postgresql-x64-13 >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo PostgreSQL service найден: postgresql-x64-13
    sc query postgresql-x64-13 | find "RUNNING" >nul
    if %ERRORLEVEL% == 0 (
        echo ✅ PostgreSQL уже запущен
    ) else (
        echo ⚠️  PostgreSQL не запущен. Запускаем...
        net start postgresql-x64-13
    )
) else (
    echo Проверяем другие версии PostgreSQL...
    sc query postgresql-x64-14 >nul 2>&1
    if %ERRORLEVEL% == 0 (
        echo PostgreSQL service найден: postgresql-x64-14
        net start postgresql-x64-14
    ) else (
        sc query postgresql-x64-15 >nul 2>&1
        if %ERRORLEVEL% == 0 (
            echo PostgreSQL service найден: postgresql-x64-15
            net start postgresql-x64-15
        ) else (
            echo ❌ PostgreSQL service не найден!
            echo Проверьте что PostgreSQL установлен
        )
    )
)

echo.
echo Проверка подключения к базе данных...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Connection OK' as status;" 2>nul
if %ERRORLEVEL% == 0 (
    echo ✅ Подключение к базе данных успешно
) else (
    echo ❌ Не удается подключиться к базе данных
    echo Проверьте:
    echo 1. PostgreSQL запущен
    echo 2. База данных thewho существует  
    echo 3. Пользователь postgres с паролем magarel
)

echo.
echo Нажмите любую клавишу для продолжения...
pause >nul
