@echo off
chcp 65001 >nul
echo ========================================
echo 📊 СОЗДАНИЕ РЕАЛЬНЫХ ПРОИЗВОДСТВЕННЫХ ДАННЫХ
echo ========================================
echo.

echo 💡 Этот скрипт создаст реальные заказы и операции вместо тестовых:
echo    - PART-2025-001 (30 шт, фрезерная)
echo    - PART-2025-002 (50 шт, токарная) 
echo    - PART-2025-003 (25 шт, комплексная)
echo.

set /p answer="Создать реальные данные? (y/n): "
if /i not "%answer%"=="y" (
    echo ❌ Операция отменена.
    pause
    exit /b
)

echo.
echo 📊 Создаем реальные производственные данные...
psql -h localhost -U postgres -d thewho -f backend\CREATE-REAL-DATA.sql

echo.
echo ✅ Реальные данные созданы!
echo.

echo 🔍 Проверяем результат:
echo.
echo "Новые заказы:"
psql -h localhost -U postgres -d thewho -c "SELECT \"drawingNumber\", quantity, priority FROM orders WHERE \"drawingNumber\" LIKE 'PART-2025-%';"
echo.
echo "Новые операции:"
psql -h localhost -U postgres -d thewho -c "SELECT op.\"operationNumber\", op.\"operationType\", ord.\"drawingNumber\", op.status FROM operations op JOIN orders ord ON op.\"orderId\" = ord.id WHERE ord.\"drawingNumber\" LIKE 'PART-2025-%';"
echo.

echo 🧪 Тестируем API:
echo "Станок 1:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/1" | jq .
echo.
echo "Станок 2:"
curl -s "http://localhost:5100/api/operations/assigned-to-machine/2" | jq .
echo.

echo ========================================
echo ✅ ГОТОВО!
echo 💡 Теперь в модальном окне должны отображаться реальные данные:
echo    - PART-2025-001 на станке 1
echo    - PART-2025-002 на станке 2  
echo    - Нет тестовых данных C6HP0021A-TEST
echo ========================================

pause