@echo off
echo 🗄️ Создание таблиц для системы истории операций...
echo.

echo 📋 Будут созданы таблицы:
echo ✓ operation_history - история операций
echo ✓ operator_efficiency_stats - статистика операторов  
echo ✓ operation_export_requests - запросы экспорта
echo.

echo ⏳ Подключаемся к базе данных PostgreSQL...

psql -h localhost -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦЫ-ИСТОРИИ-ОПЕРАЦИЙ.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Таблицы созданы успешно!
    echo 🎯 Система истории операций готова к работе.
    echo.
    echo 🚀 Теперь можно:
    echo   1. Запустить исправленный backend
    echo   2. Тестировать функции экспорта
    echo   3. Начать сбор данных об операциях
    echo.
) else (
    echo.
    echo ❌ Ошибка при создании таблиц!
    echo 💡 Проверьте:
    echo   - Запущен ли PostgreSQL
    echo   - Правильные ли учетные данные
    echo   - Существует ли база данных 'thewho'
    echo.
)

pause
