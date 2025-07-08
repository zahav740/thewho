@echo off
echo 🔧 Применение миграции для soft delete...

REM Проверяем наличие psql
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL не установлен. Установите PostgreSQL для продолжения.
    pause
    exit /b 1
)

REM Переменные окружения (настройте под свою базу данных)
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=thewho_db
if "%DB_USER%"=="" set DB_USER=postgres

echo 📋 Параметры подключения:
echo   Хост: %DB_HOST%
echo   Порт: %DB_PORT%
echo   База: %DB_NAME%
echo   Пользователь: %DB_USER%

REM Путь к файлу миграции
set MIGRATION_FILE=backend\src\database\migrations\add-soft-delete-to-orders.sql

if not exist "%MIGRATION_FILE%" (
    echo ❌ Файл миграции не найден: %MIGRATION_FILE%
    pause
    exit /b 1
)

echo 📁 Найден файл миграции: %MIGRATION_FILE%

REM Применяем миграцию
echo 🚀 Применение миграции...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%MIGRATION_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Миграция успешно применена!
    echo.
    echo 📊 Проверяем результат:
    
    REM Показываем структуру таблицы
    echo.
    echo 📋 Структура таблицы orders:
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\d orders"
    
    echo.
    echo 🎉 Миграция завершена!
    echo Теперь система поддерживает мягкое удаление заказов.
) else (
    echo ❌ Ошибка при применении миграции. Проверьте подключение к базе данных.
)

echo.
echo Нажмите любую клавишу для закрытия...
pause >nul
