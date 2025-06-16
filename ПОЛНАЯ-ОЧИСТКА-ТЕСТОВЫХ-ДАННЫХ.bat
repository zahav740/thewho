@echo off
chcp 65001 >nul
echo ========================================
echo 🧹 ПОЛНАЯ ОЧИСТКА ТЕСТОВЫХ ДАННЫХ C6HP0021A-TEST
echo ========================================
echo.

echo ⚠️ ВНИМАНИЕ: Этот скрипт удалит ВСЕ тестовые данные из базы!
echo    - Удалит заказ C6HP0021A-TEST
echo    - Удалит все связанные операции  
echo    - Удалит все записи смен с тестовыми данными
echo.

set /p answer="Вы уверены? Продолжить очистку? (y/n): "
if /i not "%answer%"=="y" (
    echo ❌ Операция отменена.
    pause
    exit /b
)

echo.
echo 🗑️ Выполняем полную очистку тестовых данных...
psql -h localhost -U postgres -d thewho -f backend\DELETE-ALL-TEST-DATA.sql

echo.
echo ✅ Очистка завершена!
echo.

echo 📊 Проверяем что осталось в базе:
echo.
echo "Все заказы:"
psql -h localhost -U postgres -d thewho -c "SELECT id, \"drawingNumber\", quantity FROM orders ORDER BY \"createdAt\" DESC LIMIT 5;"
echo.
echo "Все операции:"
psql -h localhost -U postgres -d thewho -c "SELECT id, \"operationNumber\", \"operationType\", \"orderId\" FROM operations ORDER BY \"createdAt\" DESC LIMIT 5;"
echo.
echo "Записи смен за сегодня:"
psql -h localhost -U postgres -d thewho -c "SELECT id, \"drawingnumber\", \"dayShiftQuantity\", \"nightShiftQuantity\" FROM shift_records WHERE date = CURRENT_DATE LIMIT 5;"
echo.

echo ========================================
echo 💡 СЛЕДУЮЩИЕ ШАГИ:
echo    1. Перезапустите backend: ЗАПУСК-BACKEND.bat
echo    2. Перезапустите frontend: npm start 
echo    3. Очистите кэш браузера (Ctrl+Shift+Del)
echo    4. Проверьте модальное окно записи смены
echo ========================================

pause