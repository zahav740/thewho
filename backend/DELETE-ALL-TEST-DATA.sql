-- Скрипт для полного удаления тестовых данных C6HP0021A-TEST
-- ВНИМАНИЕ: Этот скрипт удаляет ВСЕ тестовые данные!

BEGIN;

-- 1. Удаляем записи смен с тестовыми данными
DELETE FROM shift_records 
WHERE "drawingnumber" = 'C6HP0021A-TEST' 
   OR "drawingNumber" = 'C6HP0021A-TEST';

-- 2. Удаляем тестовые операции
DELETE FROM operations 
WHERE "orderId" IN (
    SELECT id FROM orders WHERE "drawingNumber" = 'C6HP0021A-TEST'
);

-- 3. Удаляем тестовый заказ
DELETE FROM orders WHERE "drawingNumber" = 'C6HP0021A-TEST';

-- 4. Удаляем любые другие тестовые записи
DELETE FROM shift_records WHERE "drawingnumber" LIKE '%TEST%';
DELETE FROM operations WHERE "operationType" = 'MILLING' AND "estimatedTime" = 60 AND "machineaxes" = 3;

-- 5. Проверяем результат
SELECT 'После очистки:' as status;

SELECT COUNT(*) as remaining_test_orders 
FROM orders 
WHERE "drawingNumber" LIKE '%TEST%';

SELECT COUNT(*) as remaining_test_operations 
FROM operations o
JOIN orders ord ON o."orderId" = ord.id
WHERE ord."drawingNumber" LIKE '%TEST%';

SELECT COUNT(*) as remaining_test_shifts 
FROM shift_records 
WHERE "drawingnumber" LIKE '%TEST%' OR "drawingNumber" LIKE '%TEST%';

COMMIT;