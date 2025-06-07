@echo off
echo 🗄️ ЗАПОЛНЕНИЕ ИСТОРИИ ОПЕРАЦИЙ РЕАЛЬНЫМИ ДАННЫМИ
echo.
echo 📋 Что будет сделано:
echo   ✓ Перенос данных из shift_records в operation_history
echo   ✓ Создание записей для дневных и ночных смен
echo   ✓ Расчет эффективности на основе времени обработки
echo   ✓ Привязка к реальным чертежам и операторам
echo.

set /p confirm="Продолжить заполнение таблицы operation_history? (y/n): "
if /i "%confirm%"=="y" (
    echo.
    echo ⏳ Выполняем SQL скрипт...
    
    psql -h localhost -U postgres -d thewho -f "ЗАПОЛНИТЬ-ИСТОРИЮ-ОПЕРАЦИЙ.sql"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ ДАННЫЕ УСПЕШНО ПЕРЕНЕСЕНЫ!
        echo.
        echo 📊 Теперь в системе есть:
        echo   • Реальные данные операций из смен
        echo   • Записи по чертежам: TH1K4108A, C6HP0021A
        echo   • Данные операторов: Кирилл, Аркадий, Денис
        echo   • Статистика эффективности
        echo.
        echo 🚀 Теперь можно тестировать страницу "История операций":
        echo    http://localhost:5101/operation-history
        echo.
    ) else (
        echo.
        echo ❌ Ошибка при выполнении SQL скрипта!
        echo 💡 Проверьте:
        echo   - Запущен ли PostgreSQL
        echo   - Правильные ли параметры подключения
        echo   - Существуют ли таблицы operation_history и shift_records
        echo.
    )
) else (
    echo Операция отменена.
)

echo.
pause
