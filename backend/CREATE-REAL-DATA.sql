-- Скрипт для создания реальных производственных данных
-- Заменяет тестовые данные на реальные

BEGIN;

-- 1. Создаем реальные заказы
INSERT INTO orders (
    "drawingNumber", 
    quantity, 
    deadline, 
    priority, 
    "workType",
    "createdAt",
    "updatedAt"
) VALUES 
(
    'PART-2025-001',
    30,
    '2025-07-15',
    2,
    'Фрезерная обработка',
    NOW(),
    NOW()
),
(
    'PART-2025-002', 
    50,
    '2025-07-20',
    1,
    'Токарная обработка',
    NOW(),
    NOW()
),
(
    'PART-2025-003',
    25,
    '2025-07-10', 
    3,
    'Комплексная обработка',
    NOW(),
    NOW()
) ON CONFLICT ("drawingNumber") DO NOTHING;

-- 2. Создаем реальные операции
DO $$
DECLARE
    order_id INTEGER;
BEGIN
    -- Операции для заказа PART-2025-001
    SELECT id INTO order_id FROM orders WHERE "drawingNumber" = 'PART-2025-001' LIMIT 1;
    IF order_id IS NOT NULL THEN
        INSERT INTO operations (
            "operationNumber",
            "operationType", 
            "estimatedTime",
            "machineaxes",
            status,
            "orderId",
            "assignedMachine",
            "createdAt",
            "updatedAt"
        ) VALUES 
        (
            101,
            'MILLING',
            45,
            3,
            'IN_PROGRESS',
            order_id,
            1, -- Назначено на станок 1
            NOW(),
            NOW()
        ),
        (
            102,
            'TURNING', 
            35,
            2,
            'PENDING',
            order_id,
            NULL,
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Операции для заказа PART-2025-002
    SELECT id INTO order_id FROM orders WHERE "drawingNumber" = 'PART-2025-002' LIMIT 1;
    IF order_id IS NOT NULL THEN
        INSERT INTO operations (
            "operationNumber",
            "operationType",
            "estimatedTime", 
            "machineaxes",
            status,
            "orderId",
            "assignedMachine",
            "createdAt",
            "updatedAt"
        ) VALUES 
        (
            201,
            'TURNING',
            40,
            2, 
            'ASSIGNED',
            order_id,
            2, -- Назначено на станок 2
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. Проверяем созданные данные
SELECT 
    'Созданные заказы:' as info,
    "drawingNumber",
    quantity,
    priority,
    "workType"
FROM orders 
WHERE "drawingNumber" LIKE 'PART-2025-%'
ORDER BY "drawingNumber";

SELECT 
    'Созданные операции:' as info,
    op."operationNumber",
    op."operationType",
    op.status,
    ord."drawingNumber",
    op."assignedMachine"
FROM operations op
JOIN orders ord ON op."orderId" = ord.id
WHERE ord."drawingNumber" LIKE 'PART-2025-%'
ORDER BY ord."drawingNumber", op."operationNumber";

COMMIT;