@echo off
echo ========================================
echo НАСТРОЙКА СИСТЕМЫ ИСТОРИИ ОПЕРАЦИЙ
echo ========================================
echo.

echo Создание таблиц для истории операций...
psql -h localhost -U postgres -d thewho -f setup_operation_history.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ УСПЕШНО: Таблицы истории операций созданы
    echo.
    echo Созданные таблицы:
    echo - operation_history (история выполнения операций)
    echo - operator_efficiency_stats (статистика операторов)
    echo - operation_export_requests (запросы экспорта)
    echo.
    echo 📊 Теперь доступны функции:
    echo - Фильтрация производства по текущей операции
    echo - Экспорт истории операций в Excel
    echo - Детальная статистика эффективности операторов
    echo - Модальные окна с отчетами
    echo.
) else (
    echo.
    echo ❌ ОШИБКА: Не удалось создать таблицы
    echo.
    echo Проверьте:
    echo - Запущен ли PostgreSQL
    echo - Правильные ли учетные данные
    echo - Существует ли база данных thewho
    echo.
)

echo Нажмите любую клавишу для продолжения...
pause >nul
