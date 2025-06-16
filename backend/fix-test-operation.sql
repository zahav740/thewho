-- Скрипт для исправления тестовой операции
-- Назначаем тестовую операцию на станок и обновляем смену

-- 1. Назначаем операцию на станок Doosan 3
UPDATE operations 
SET 
    "assignedMachine" = 3, 
    status = 'IN_PROGRESS',
    "assignedAt" = NOW()
WHERE id = 300;

-- 2. Обновляем запись смены - добавляем привязку к станку
UPDATE shift_records 
SET "machineId" = 3
WHERE "operationId" = 300;

-- 3. Проверяем результат
SELECT 
    'Тестовая операция:' as info,
    op.id,
    op."operationNumber", 
    op.status,
    op."assignedMachine",
    o.drawing_number,
    o.quantity as planned_quantity
FROM operations op
JOIN orders o ON op."orderId" = o.id
WHERE op.id = 300;

-- 4. Проверяем смену
SELECT 
    'Тестовая смена:' as info,
    sr.id,
    sr."operationId",
    sr."machineId",
    sr."dayShiftQuantity",
    sr."nightShiftQuantity",
    (sr."dayShiftQuantity" + sr."nightShiftQuantity") as total_quantity,
    sr."drawingnumber"
FROM shift_records sr
WHERE sr."operationId" = 300;

-- 5. Проверяем станок
SELECT 
    'Станок для тестирования:' as info,
    m.id,
    m."machineName",
    m."machineType"
FROM machines m
WHERE m.id = 3;

COMMIT;
