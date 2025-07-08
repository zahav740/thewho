-- ПОЛНОЕ УДАЛЕНИЕ ВСЕХ ТЕСТОВЫХ ДАННЫХ
-- КРИТИЧЕСКАЯ ОЧИСТКА БД ОТ ТЕСТОВЫХ ЗАПИСЕЙ

BEGIN;

-- 1. Удаляем все записи смен с тестовыми данными
DELETE FROM shift_records 
WHERE "drawingnumber" LIKE '%TEST%' 
   OR "drawingNumber" LIKE '%TEST%'
   OR "drawingnumber" = 'C6HP0021A'
   OR "drawingNumber" = 'C6HP0021A';

-- 2. Удаляем все операции с тестовыми характеристиками
DELETE FROM operations 
WHERE "operationType" = 'MILLING' AND "estimatedTime" = 60 AND "operationNumber" = 1
   OR "orderId" IN (
       SELECT id FROM orders 
       WHERE drawing_number LIKE '%TEST%' 
          OR "drawingNumber" LIKE '%TEST%'
          OR drawing_number = 'C6HP0021A'
          OR "drawingNumber" = 'C6HP0021A'
   );

-- 3. Удаляем все заказы с тестовыми номерами чертежей
DELETE FROM orders 
WHERE drawing_number LIKE '%TEST%' 
   OR "drawingNumber" LIKE '%TEST%'
   OR drawing_number = 'C6HP0021A'
   OR "drawingNumber" = 'C6HP0021A'
   OR quantity = 5 AND priority = 1 AND "workType" = 'MILLING';

-- 4. Очищаем связанные данные
DELETE FROM operations 
WHERE "assignedMachine" IS NOT NULL 
  AND "operationType" = 'MILLING' 
  AND "estimatedTime" = 60;

-- 5. Удаляем операции со статусом COMPLETED для тестовых данных
DELETE FROM operations 
WHERE status = 'COMPLETED' 
  AND "operationType" = 'MILLING' 
  AND "estimatedTime" = 60
  AND "operationNumber" = 1;

-- 6. Проверяем результат
SELECT 'После полной очистки:' as status;

SELECT 
    'Операции' as table_name,
    COUNT(*) as remaining_count,
    STRING_AGG(DISTINCT "operationType", ', ') as types,
    STRING_AGG(DISTINCT status, ', ') as statuses
FROM operations;

SELECT 
    'Заказы' as table_name,
    COUNT(*) as remaining_count,
    STRING_AGG(DISTINCT COALESCE(drawing_number, "drawingNumber"), ', ') as drawings
FROM orders;

SELECT 
    'Смены' as table_name,
    COUNT(*) as remaining_count,
    STRING_AGG(DISTINCT COALESCE("drawingnumber", "drawingNumber"), ', ') as drawings
FROM shift_records;

-- 7. Показываем что осталось для проверки
SELECT 'Оставшиеся операции:' as info;
SELECT id, "operationNumber", "operationType", "estimatedTime", "assignedMachine", status
FROM operations 
ORDER BY id;

SELECT 'Оставшиеся заказы:' as info;
SELECT id, COALESCE(drawing_number, "drawingNumber") as drawing, quantity, priority
FROM orders 
ORDER BY id;

COMMIT;