-- Скрипт для создания тестовых данных для проверки автозавершения операций
-- Выполнить в PostgreSQL

-- 1. Создаем тестовый заказ
INSERT INTO orders (
    "drawingNumber", 
    quantity, 
    deadline, 
    priority, 
    "workType",
    "createdAt",
    "updatedAt"
) VALUES (
    'C6HP0021A-TEST',
    5,  -- Маленькое количество для быстрого тестирования
    '2025-06-20',
    1,
    'MILLING',
    NOW(),
    NOW()
) ON CONFLICT ("drawingNumber") DO NOTHING;

-- 2. Получаем ID созданного заказа и создаем операции
DO $$
DECLARE
    order_id INTEGER;
BEGIN
    -- Находим ID заказа
    SELECT id INTO order_id FROM orders WHERE "drawingNumber" = 'C6HP0021A-TEST' LIMIT 1;
    
    IF order_id IS NOT NULL THEN
        -- Создаем операцию 1
        INSERT INTO operations (
            "operationNumber",
            "operationType", 
            "estimatedTime",
            "machineaxes",
            status,
            "orderId",
            "createdAt",
            "updatedAt"
        ) VALUES (
            1,
            'MILLING',
            60,  -- 60 минут
            3,
            'ASSIGNED',  -- Готова к выполнению
            order_id,
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Создаем операцию 2
        INSERT INTO operations (
            "operationNumber",
            "operationType", 
            "estimatedTime", 
            "machineaxes",
            status,
            "orderId",
            "createdAt",
            "updatedAt"
        ) VALUES (
            2,
            'TURNING',
            45,  -- 45 минут
            2,
            'PENDING',
            order_id,
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Тестовый заказ и операции созданы для заказа ID: %', order_id;
    ELSE
        RAISE NOTICE 'Не удалось найти тестовый заказ';
    END IF;
END $$;

-- 3. Создаем тестовые записи смен с прогрессом
-- Эти записи будут имитировать накопление деталей до планового количества
DO $$
DECLARE
    operation_id INTEGER;
BEGIN
    -- Находим первую операцию тестового заказа
    SELECT o.id INTO operation_id 
    FROM operations o 
    JOIN orders ord ON o."orderId" = ord.id 
    WHERE ord."drawingNumber" = 'C6HP0021A-TEST' 
    AND o."operationNumber" = 1 
    LIMIT 1;
    
    IF operation_id IS NOT NULL THEN
        -- Создаем запись смены с частичным прогрессом
        INSERT INTO shift_records (
            date,
            "shiftType",
            "dayShiftQuantity",
            "nightShiftQuantity", 
            "operationId",
            "drawingnumber",
            archived,
            "createdAt",
            "updatedAt"
        ) VALUES (
            CURRENT_DATE,
            'DAY',
            3,  -- 3 детали в дневную смену
            2,  -- 2 детали в ночную смену
            operation_id,
            'C6HP0021A-TEST',
            false,
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Тестовые смены созданы для операции ID: %', operation_id;
        RAISE NOTICE 'Общее количество: 5 деталей (достигнуто плановое количество!)';
    ELSE
        RAISE NOTICE 'Не удалось найти тестовую операцию';
    END IF;
END $$;

-- 4. Проверяем результат
SELECT 
    o."drawingNumber",
    op.id as operation_id,
    op."operationNumber",
    op."operationType",
    op.status,
    o.quantity as planned_quantity,
    COALESCE(sr."dayShiftQuantity", 0) + COALESCE(sr."nightShiftQuantity", 0) as current_quantity,
    CASE 
        WHEN (COALESCE(sr."dayShiftQuantity", 0) + COALESCE(sr."nightShiftQuantity", 0)) >= o.quantity 
        THEN '🎉 ГОТОВО К ЗАВЕРШЕНИЮ!'
        ELSE '⏳ В процессе'
    END as completion_status
FROM orders o
JOIN operations op ON o.id = op."orderId"
LEFT JOIN shift_records sr ON op.id = sr."operationId" AND sr.archived = false
WHERE o."drawingNumber" = 'C6HP0021A-TEST'
ORDER BY op."operationNumber";

-- 5. Тестовый запрос для проверки API
SELECT 
    'API Test Query:' as info,
    'GET /api/operations/completion/check/' || op.id as test_endpoint
FROM orders o
JOIN operations op ON o.id = op."orderId" 
WHERE o."drawingNumber" = 'C6HP0021A-TEST'
AND op."operationNumber" = 1;

COMMIT;
