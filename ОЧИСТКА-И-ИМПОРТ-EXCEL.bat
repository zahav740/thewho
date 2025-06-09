@echo off
setlocal enabledelayedexpansion

echo ====================================
echo ОЧИСТКА И ИМПОРТ EXCEL ДАННЫХ
echo ====================================
echo VERSION: ПРОДАКШЕН
echo DATE: %date% %time%
echo.

echo 🔍 ТЕКУЩЕЕ СОСТОЯНИЕ БАЗЫ ДАННЫХ:
echo.

REM Проверяем текущее состояние
echo 1. Проверяем существующие заказы...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT id, drawing_number, quantity, deadline FROM orders ORDER BY id;"

echo.
echo ⚠️  ВНИМАНИЕ: Сейчас в базе есть следующие данные:
echo - TH1K4108A (110 шт.)
echo - C6HP0021A (30 шт.)  
echo - G63828A (20 шт.)
echo.

set /p confirm="❓ Хотите УДАЛИТЬ все существующие заказы? (y/N): "
if /i "!confirm!" neq "y" (
    echo ❌ Операция отменена пользователем
    pause
    exit /b 0
)

echo.
echo 🗑️  ОЧИСТКА БАЗЫ ДАННЫХ...
echo.

REM Удаляем все заказы и операции
echo 2. Удаляем все операции...
psql -h localhost -p 5432 -U postgres -d thewho -c "DELETE FROM operations;"

echo 3. Удаляем все заказы...
psql -h localhost -p 5432 -U postgres -d thewho -c "DELETE FROM orders;"

echo 4. Сбрасываем счетчики ID...
psql -h localhost -p 5432 -U postgres -d thewho -c "ALTER SEQUENCE orders_id_seq RESTART WITH 1;"
psql -h localhost -p 5432 -U postgres -d thewho -c "ALTER SEQUENCE operations_id_seq RESTART WITH 1;"

echo ✅ База данных очищена!
echo.

echo 📋 ИНСТРУКЦИИ ДЛЯ ИМПОРТА:
echo.
echo 1. Откройте браузер: http://localhost:5101
echo 2. Перейдите в раздел "База данных"
echo 3. Нажмите "Импорт Excel"
echo 4. Выберите РЕАЛЬНЫЙ Excel файл с заказами
echo 5. Дождитесь завершения импорта
echo.

echo 📝 ФОРМАТ EXCEL ФАЙЛА:
echo Столбцы должны быть в таком порядке:
echo A: Номер чертежа (например: DWG-12345)
echo B: Количество (число)
echo C: Срок (дата в формате DD.MM.YYYY)
echo D: Приоритет (1-высокий, 2-средний, 3-низкий)
echo E: Тип работы (текст)
echo F+: Операции (номер, тип, оси, время)
echo.

echo 🔗 ПОЛЕЗНЫЕ ССЫЛКИ:
echo - Главная страница: http://localhost:5101
echo - База данных: http://localhost:5101/database
echo - API документация: http://localhost:5100/api/docs
echo - Проверка API: http://localhost:5100/api/health
echo.

echo 🎯 ПРОВЕРКА РЕЗУЛЬТАТА:
echo После импорта обновите страницу в браузере (F5)
echo и убедитесь, что отображаются ВАШИ данные из Excel файла.
echo.

pause

echo 🔍 ФИНАЛЬНАЯ ПРОВЕРКА БАЗЫ:
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total_orders FROM orders;"
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total_operations FROM operations;"

echo.
echo ✅ ГОТОВО! Теперь можете импортировать РЕАЛЬНЫЙ Excel файл.
pause