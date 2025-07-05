@echo off
echo ======================================
echo РУЧНОЕ ТЕСТИРОВАНИЕ EXCEL API
echo ======================================

echo Тестируем доступность Backend...
curl -s http://localhost:5100/api/health
echo.

echo Тестируем Excel Import DB endpoints...
echo.

echo 1. Получение фильтров:
curl -s http://localhost:5100/api/excel-import-db/filters
echo.

echo 2. Получение списка импортов:
curl -s http://localhost:5100/api/excel-import-db/imports?page=1&limit=5
echo.

echo 3. Получение фильтров для заказов:
curl -s "http://localhost:5100/api/excel-import-db/filters?targetTable=orders"
echo.

echo ======================================
echo РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ЗАВЕРШЕНЫ
echo ======================================

pause
