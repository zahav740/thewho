@echo off
chcp 65001 >nul
echo ========================================
echo 🧹 ОЧИСТКА ТЕСТОВЫХ ДАННЫХ ИЗ БД
echo ========================================
echo.

echo ⚠️ ВНИМАНИЕ: Этот скрипт удалит тестовые данные из базы!
echo.
set /p answer="Продолжить очистку тестовых данных? (y/n): "
if /i not "%answer%"=="y" (
    echo Операция отменена.
    pause
    exit /b
)

echo.
echo 1️⃣ Удаляем тестовые операции...
psql -h localhost -U postgres -d thewho -c "DELETE FROM operations WHERE \"operationNumber\" = 1 AND \"operationType\" = 'MILLING';"

echo 2️⃣ Удаляем тестовые заказы...
psql -h localhost -U postgres -d thewho -c "DELETE FROM orders WHERE drawing_number = 'C6HP0021A' AND quantity = 5;"

echo 3️⃣ Удаляем старые смены с тестовыми данными...
psql -h localhost -U postgres -d thewho -c "DELETE FROM shift_records WHERE \"drawingnumber\" = 'C6HP0021A-TEST' OR \"drawingNumber\" = 'C6HP0021A-TEST';"

echo 4️⃣ Проверяем что осталось...
echo "Операции:"
psql -h localhost -U postgres -d thewho -c "SELECT COUNT(*) as operations_count FROM operations;"
echo "Заказы:"
psql -h localhost -U postgres -d thewho -c "SELECT COUNT(*) as orders_count FROM orders;"
echo "Смены:"
psql -h localhost -U postgres -d thewho -c "SELECT COUNT(*) as shifts_count FROM shift_records;"

echo.
echo ✅ Очистка завершена!
echo 💡 Теперь перезапустите frontend для обновления кэша
echo.

pause