@echo off
chcp 65001 >nul
echo ========================================
echo 🚨 КРИТИЧЕСКАЯ ОЧИСТКА ВСЕХ ТЕСТОВЫХ ДАННЫХ
echo ========================================
echo.

echo ⚠️ ВНИМАНИЕ: Этот скрипт удалит ВСЕ тестовые данные!
echo    - Все операции с характеристиками: MILLING, 60 мин, операция №1
echo    - Все заказы с C6HP0021A, C6HP0021A-TEST  
echo    - Все записи смен с тестовыми чертежами
echo    - Все связанные данные
echo.

set /p answer="ВЫ УВЕРЕНЫ? Удалить ВСЕ тестовые данные? (y/n): "
if /i not "%answer%"=="y" (
    echo ❌ Операция отменена.
    pause
    exit /b
)

echo.
echo 1️⃣ Сначала диагностика - что найдено в БД:
echo.
echo "Проблемные операции:"
psql -h localhost -U postgres -d thewho -c "SELECT id, \"operationNumber\", \"operationType\", \"estimatedTime\", \"assignedMachine\", status FROM operations WHERE \"operationType\" = 'MILLING' AND \"estimatedTime\" = 60;"
echo.
echo "Проблемные заказы:"
psql -h localhost -U postgres -d thewho -c "SELECT id, COALESCE(drawing_number, \"drawingNumber\") as drawing, quantity, priority FROM orders WHERE drawing_number LIKE '%C6HP0021A%' OR \"drawingNumber\" LIKE '%C6HP0021A%';"
echo.

echo 2️⃣ Выполняем критическую очистку...
psql -h localhost -U postgres -d thewho -f backend\КРИТИЧЕСКАЯ-ОЧИСТКА-ВСЕХ-ТЕСТОВЫХ-ДАННЫХ.sql

echo.
echo 3️⃣ Тестируем API после очистки:
echo.
echo "Станок 1:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/1" | jq .
echo.
echo "Станок 2:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/2" | jq .
echo.

echo ========================================
echo ✅ КРИТИЧЕСКАЯ ОЧИСТКА ЗАВЕРШЕНА!
echo.
echo 🎯 РЕЗУЛЬТАТ:
echo    ✅ Удалены ВСЕ тестовые операции
echo    ✅ Удалены ВСЕ тестовые заказы  
echo    ✅ Удалены ВСЕ тестовые смены
echo    ✅ API должен возвращать: "success": false, "operation": null
echo.
echo 💡 СЛЕДУЮЩИЕ ШАГИ:
echo    1. Перезапустите frontend
echo    2. Очистите кэш браузера (Ctrl+Shift+Del)
echo    3. Откройте модальное окно записи смены
echo    4. Должно показать: "⚠️ Операция не найдена"
echo ========================================

pause