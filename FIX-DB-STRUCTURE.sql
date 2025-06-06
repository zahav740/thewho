-- ИСПРАВЛЕНИЕ СВЯЗЕЙ ОПЕРАЦИЙ С ЗАКАЗАМИ (ПРАВИЛЬНЫЕ ИМЕНА ПОЛЕЙ)
-- Используем реальные имена полей из БД

-- 1. Проверяем текущую структуру operations (уже видели в выводе)
\echo '=== Текущая структура таблицы operations ===';
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'operations' 
ORDER BY ordinal_position;

-- 2. Проверяем операции без связи с заказами
\echo '=== Операции без связи с заказами ===';
SELECT 
    id,
    "operationNumber",
    operationtype,
    "estimatedTime",
    status,
    "orderId"
FROM operations 
WHERE "orderId" IS NULL;

-- 3. Добавляем order_id если его нет и переименовываем orderId
\echo '=== Исправляем поле связи с заказами ===';
DO $$
BEGIN
    -- Проверяем есть ли уже order_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'order_id') THEN
        -- Если есть orderId, переименовываем его в order_id
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'orderId') THEN
            ALTER TABLE operations RENAME COLUMN "orderId" TO order_id;
            RAISE NOTICE 'Переименовано orderId в order_id';
        ELSE
            -- Если нет ни того ни другого, создаем order_id
            ALTER TABLE operations ADD COLUMN order_id INTEGER;
            ALTER TABLE operations ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
            RAISE NOTICE 'Добавлено поле order_id';
        END IF;
    END IF;
    
    -- Переименовываем operationNumber в operation_number для единообразия
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operationNumber') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operation_number') THEN
            ALTER TABLE operations RENAME COLUMN "operationNumber" TO operation_number;
            RAISE NOTICE 'Переименовано operationNumber в operation_number';
        END IF;
    END IF;
    
    -- Переименовываем operationtype в operation_type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operationtype') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operation_type') THEN
            ALTER TABLE operations RENAME COLUMN operationtype TO operation_type;
            RAISE NOTICE 'Переименовано operationtype в operation_type';
        END IF;
    END IF;
    
    -- Переименовываем estimatedTime в estimated_time
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'estimatedTime') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'estimated_time') THEN
            ALTER TABLE operations RENAME COLUMN "estimatedTime" TO estimated_time;
            RAISE NOTICE 'Переименовано estimatedTime в estimated_time';
        END IF;
    END IF;
    
    -- Переименовываем machineaxes в machine_axes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'machineaxes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'machine_axes') THEN
            ALTER TABLE operations RENAME COLUMN machineaxes TO machine_axes;
            RAISE NOTICE 'Переименовано machineaxes в machine_axes';
        END IF;
    END IF;
    
    -- Переименовываем createdAt в created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'createdAt') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'created_at') THEN
            ALTER TABLE operations RENAME COLUMN "createdAt" TO created_at;
            RAISE NOTICE 'Переименовано createdAt в created_at';
        END IF;
    END IF;
    
    -- Переименовываем updatedAt в updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'updatedAt') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'updated_at') THEN
            ALTER TABLE operations RENAME COLUMN "updatedAt" TO updated_at;
            RAISE NOTICE 'Переименовано updatedAt в updated_at';
        END IF;
    END IF;
END $$;

-- 4. Связываем существующие операции с заказами
\echo '=== Связываем операции с заказами ===';

-- Находим операции и связываем их с заказами по логике
UPDATE operations 
SET order_id = (SELECT id FROM orders WHERE drawing_number = 'C6HP0021A' LIMIT 1)
WHERE operation_number = 10 AND (order_id IS NULL OR order_id = 0);

UPDATE operations 
SET order_id = (SELECT id FROM orders WHERE drawing_number = 'TH1K4108A' LIMIT 1)
WHERE operation_number IN (10, 20) AND (order_id IS NULL OR order_id = 0);

UPDATE operations 
SET order_id = (SELECT id FROM orders WHERE drawing_number = 'G63828A' LIMIT 1)
WHERE operation_number IN (30, 40) AND (order_id IS NULL OR order_id = 0);

-- 5. Добавляем недостающие операции для C6HP0021A
\echo '=== Добавляем операции для C6HP0021A ===';

-- Получаем ID заказа C6HP0021A
DO $$
DECLARE
    order_id_var INTEGER;
BEGIN
    SELECT id INTO order_id_var FROM orders WHERE drawing_number = 'C6HP0021A';
    
    IF order_id_var IS NOT NULL THEN
        -- Добавляем операцию 20 если её нет
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
        SELECT 20, 'TURNING', 75, 4, 'PENDING', order_id_var, NOW(), NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM operations 
            WHERE order_id = order_id_var AND operation_number = 20
        );
        
        -- Добавляем операцию 30 если её нет
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
        SELECT 30, 'DRILLING', 60, 3, 'PENDING', order_id_var, NOW(), NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM operations 
            WHERE order_id = order_id_var AND operation_number = 30
        );
        
        RAISE NOTICE 'Операции для заказа C6HP0021A обработаны (ID: %)', order_id_var;
    ELSE
        RAISE NOTICE 'Заказ C6HP0021A не найден!';
    END IF;
END $$;

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
    op.status
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
ORDER BY o.drawing_number, op.operation_number;

\echo 'Готово! Операции должны быть связаны с заказами.';
