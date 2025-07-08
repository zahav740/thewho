@echo off
echo 🔧 Применение миграции для soft delete...

REM Установка переменных окружения для подключения к PostgreSQL
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=thewho
set PGUSER=postgres
set PGPASSWORD=mag111

echo 📋 Параметры подключения:
echo   Хост: %PGHOST%
echo   Порт: %PGPORT%
echo   База: %PGDATABASE%
echo   Пользователь: %PGUSER%

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

psql -f "%MIGRATION_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Миграция успешно применена!
    echo.
    echo 📊 Проверяем результат:
    
    REM Показываем структуру таблицы
    echo.
    echo 📋 Структура таблицы orders:
    psql -c "\d orders"
    
    echo.
    echo 🎉 Миграция завершена!
    echo Теперь система поддерживает мягкое удаление заказов.
    echo.
    echo ⚠️ ВАЖНО: Перезапустите backend для применения изменений!
    echo.
) else (
    echo ❌ Ошибка при применении миграции. Проверьте подключение к базе данных.
    echo.
    echo 💡 Возможные причины:
    echo   - PostgreSQL не запущен
    echo   - Неверные учетные данные 
    echo   - База данных не существует
    echo.
)

echo Нажмите любую клавишу для закрытия...
pause >nul
