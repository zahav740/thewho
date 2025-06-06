-- ПРОСТОЕ ИСПРАВЛЕНИЕ БЕЗ ПЕРЕИМЕНОВАНИЙ
-- Работаем с существующими полями БД как есть

\echo '=== Проверяем существующие операции ===';
SELECT 
    o.drawing_number as order_name,
    op.id as operation_id,
    op."operationNumber",
    op.operationtype,
    op."estimatedTime",
    op."orderId",
    op.status
FROM orders o 
LEFT JOIN operations op ON o.id = op."orderId"
ORDER BY o.drawing_number, op."operationNumber";

\echo '=== Связываем операции с заказами ===';

-- Связываем операцию 10 с заказом C6HP0021A
UPDATE operations 
SET "orderId" = (SELECT id FROM orders WHERE drawing_number = 'C6HP0021A' LIMIT 1)
WHERE "operationNumber" = 10 AND ("orderId" IS NULL OR "orderId" = 0);

-- Связываем операции 10,20 с заказом TH1K4108A  
UPDATE operations 
SET "orderId" = (SELECT id FROM orders WHERE drawing_number = 'TH1K4108A' LIMIT 1)
WHERE "operationNumber" IN (10, 20) AND ("orderId" IS NULL OR "orderId" = 0);

-- Связываем операции 30,40 с заказом G63828A
UPDATE operations 
SET "orderId" = (SELECT id FROM orders WHERE drawing_number = 'G63828A' LIMIT 1)
WHERE "operationNumber" IN (30, 40) AND ("orderId" IS NULL OR "orderId" = 0);

\echo '=== Добавляем операции для C6HP0021A ===';

-- Добавляем операции 20 и 30 для C6HP0021A
DO $$
DECLARE
    order_id_var INTEGER;
BEGIN
    SELECT id INTO order_id_var FROM orders WHERE drawing_number = 'C6HP0021A';
    
    IF order_id_var IS NOT NULL THEN
        -- Операция 20
        INSERT INTO operations (
            "operationNumber",
            operationtype,
            "estimatedTime",
            machineaxes,
            status,
            "orderId",
            "createdAt",
            "updatedAt"
        ) 
        SELECT 20, 'TURNING', 75, 4, 'PENDING', order_id_var, NOW(), NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM operations 
            WHERE "orderId" = order_id_var AND "operationNumber" = 20
        );
        
        -- Операция 30
        INSERT INTO operations (
            "operationNumber",
            operationtype,
            "estimatedTime",
            machineaxes,
            status,
            "orderId",
            "createdAt",
            "updatedAt"
        ) 
        SELECT 30, 'DRILLING', 60, 3, 'PENDING', order_id_var, NOW(), NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM operations 
            WHERE "orderId" = order_id_var AND "operationNumber" = 30
        );
        
        RAISE NOTICE 'Операции для C6HP0021A добавлены';
    END IF;
END $$;

\echo '=== Финальная проверка ===';

SELECT 
    o.drawing_number as order_name,
    COUNT(op.id) as operations_count
FROM orders o 
LEFT JOIN operations op ON o.id = op."orderId"
GROUP BY o.id, o.drawing_number
ORDER BY o.drawing_number;

SELECT 
    o.drawing_number,
    op."operationNumber",
    op.operationtype,
    op."estimatedTime"
FROM orders o 
LEFT JOIN operations op ON o.id = op."orderId"
WHERE o.drawing_number = 'C6HP0021A'
ORDER BY op."operationNumber";

\echo 'Готово!';
