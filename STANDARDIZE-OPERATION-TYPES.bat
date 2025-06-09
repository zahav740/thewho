@echo off
echo ========================================
echo СТАНДАРТИЗАЦИЯ ТИПОВ ОПЕРАЦИЙ
echo ========================================

echo.
echo Этот скрипт приведет типы операций к стандартным значениям:
echo - Все фрезерные операции → 'MILLING'
echo - Все токарные операции → 'TURNING'
echo - Все операции сверления → 'DRILLING'
echo - Все операции шлифования → 'GRINDING'
echo.

set /p confirm="Продолжить? (y/n): "
if /i "%confirm%" neq "y" goto :end

echo.
echo 1. Обновляем фрезерные операции...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"UPDATE operations SET operationtype = 'MILLING' WHERE LOWER(operationtype) LIKE '%%mill%%' OR LOWER(operationtype) LIKE '%%фрез%%'\"}"

echo.
echo 2. Обновляем токарные операции...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"UPDATE operations SET operationtype = 'TURNING' WHERE LOWER(operationtype) LIKE '%%turn%%' OR LOWER(operationtype) LIKE '%%токар%%'\"}"

echo.
echo 3. Обновляем операции сверления...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"UPDATE operations SET operationtype = 'DRILLING' WHERE LOWER(operationtype) LIKE '%%drill%%' OR LOWER(operationtype) LIKE '%%сверл%%'\"}"

echo.
echo 4. Обновляем операции шлифования...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"UPDATE operations SET operationtype = 'GRINDING' WHERE LOWER(operationtype) LIKE '%%grind%%' OR LOWER(operationtype) LIKE '%%шлиф%%'\"}"

echo.
echo 5. Устанавливаем MILLING для неопределенных операций...
curl -X POST "http://localhost:3000/api/test/execute" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"UPDATE operations SET operationtype = 'MILLING' WHERE operationtype IS NULL OR operationtype = '' OR operationtype NOT IN ('MILLING', 'TURNING', 'DRILLING', 'GRINDING')\"}"

echo.
echo 6. Проверяем результат...
curl -X GET "http://localhost:3000/api/test/query" ^
-H "Content-Type: application/json" ^
-d "{\"sql\":\"SELECT operationtype, COUNT(*) as count FROM operations GROUP BY operationtype ORDER BY count DESC\"}"

echo.
echo ========================================
echo СТАНДАРТИЗАЦИЯ ЗАВЕРШЕНА
echo ========================================

:end
pause
