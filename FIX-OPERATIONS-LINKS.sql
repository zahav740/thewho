-- ИСПРАВЛЕНИЕ СВЯЗЕЙ ОПЕРАЦИЙ С ЗАКАЗАМИ
-- Эта проблема критична для отображения операций

-- 1. Проверяем текущую структуру operations
\echo '=== Проверка структуры таблицы operations ===';
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'operations' 
ORDER BY ordinal_position;

-- 2. Проверяем операции без связи с заказами
\echo '=== Операции без связи с заказами ===';
SELECT 
    id,
    operation_number,
    operation_type,
    machine,
    estimated_time,
    status
FROM operations 
WHERE order_id IS NULL OR order_id = 0;

-- 3. Исправляем структуру если нужно
\echo '=== Добавляем поле order_id если его нет ===';
DO $$
BEGIN
    -- Добавляем order_id если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'order_id') THEN
        ALTER TABLE operations ADD COLUMN order_id INTEGER;
        ALTER TABLE operations ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'Добавлено поле order_id';
    END IF;
    
    -- Переименовываем orderId в order_id если нужно
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'orderId') THEN
        ALTER TABLE operations RENAME COLUMN "orderId" TO order_id;
        RAISE NOTICE 'Переименовано orderId в order_id';
    END IF;
END $$;

-- 4. Связываем существующие операции с заказами по логике
\echo '=== Связываем операции с заказами ===';

-- Связываем операцию с operation_number=10 с заказом C6HP0021A
UPDATE operations 
SET order_id = (SELECT id FROM orders WHERE drawing_number = 'C6HP0021A' LIMIT 1)
WHERE operation_number = 10 AND (order_id IS NULL OR order_id = 0);

-- Связываем операции 10,20 с заказом TH1K4108A
UPDATE operations 
SET order_id = (SELECT id FROM orders WHERE drawing_number = 'TH1K4108A' LIMIT 1)
WHERE operation_number IN (10, 20) AND (order_id IS NULL OR order_id = 0);

-- Связываем операции 30,40 с заказом G63828A
UPDATE operations 
SET order_id = (SELECT id FROM orders WHERE drawing_number = 'G63828A' LIMIT 1)
WHERE operation_number IN (30, 40) AND (order_id IS NULL OR order_id = 0);

-- 5. Добавляем недостающие операции для C6HP0021A
\echo '=== Добавляем операции для C6HP0021A ===';

-- Добавляем операции 20 и 30 для заказа C6HP0021A (ID=8)
INSERT INTO operations (
    operation_number,
    operation_type,
    estimated_time,
    machine_axes,
    status,
    order_id,
    created_at,
    updated_at
) 
SELECT 20, 'TURNING', 75, 4, 'pending', 8, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM operations 
    WHERE order_id = 8 AND operation_number = 20
);

INSERT INTO operations (
    operation_number,
    operation_type,
    estimated_time,
    machine_axes,
    status,
    order_id,
    created_at,
    updated_at
) 
SELECT 30, 'DRILLING', 60, 3, 'pending', 8, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM operations 
    WHERE order_id = 8 AND operation_number = 30
);

-- 6. Проверяем результат
\echo '=== Результат исправлений ===';

SELECT 
    'Заказ' as type,
    o.drawing_number as name,
    COUNT(op.id) as operations_count
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
GROUP BY o.id, o.drawing_number
ORDER BY o.drawing_number;

\echo '=== Детализация операций ===';

SELECT 
    o.drawing_number as order_name,
    op.id as operation_id,
    op.operation_number,
    op.operation_type,
    op.estimated_time,
    op.machine,
    op.status
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
ORDER BY o.drawing_number, op.operation_number;

\echo 'Готово! Операции должны быть связаны с заказами.';
