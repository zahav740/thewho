-- ДОБАВЛЕНИЕ ОПЕРАЦИЙ ДЛЯ C6HP0021A (БЕЗ КОДИРОВОЧНЫХ ПРОБЛЕМ)
-- Простое добавление операций 20 и 30

-- Добавляем операцию 20 для C6HP0021A
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
SELECT 20, 'TURNING', 75, 4, 'PENDING', 8, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM operations 
    WHERE "orderId" = 8 AND "operationNumber" = 20
);

-- Добавляем операцию 30 для C6HP0021A
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
SELECT 30, 'DRILLING', 60, 3, 'PENDING', 8, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM operations 
    WHERE "orderId" = 8 AND "operationNumber" = 30
);

-- Проверяем результат
SELECT 
    o.drawing_number,
    COUNT(op.id) as operations_count
FROM orders o 
LEFT JOIN operations op ON o.id = op."orderId"
WHERE o.drawing_number = 'C6HP0021A'
GROUP BY o.id, o.drawing_number;

SELECT 
    op."operationNumber",
    op.operationtype,
    op."estimatedTime"
FROM orders o 
LEFT JOIN operations op ON o.id = op."orderId"
WHERE o.drawing_number = 'C6HP0021A'
ORDER BY op."operationNumber";
