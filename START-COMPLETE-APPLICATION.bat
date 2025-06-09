-- 🚨 СКРИПТ ОЧИСТКИ ДЛЯ ПРОДАКШЕН СИСТЕМЫ 🚨
-- Удаляет все автоматически созданные данные, оставляя только реальные

-- ВАЖНО: Этот скрипт удалит все данные, созданные при сегодняшнем исправлении
-- и вернет систему к состоянию с чистыми реальными данными

BEGIN;

-- 1. Удаляем всю историю операций (созданную при конвертации смен)
DELETE FROM operation_history;

-- 2. Удаляем всю статистику операторов (созданную при конвертации)
DELETE FROM operator_efficiency_stats;

-- 3. Сбрасываем статусы операций обратно на первоначальные
UPDATE operations 
SET status = 'PENDING', "updatedAt" = NOW() 
WHERE status = 'in_progress';

-- Восстанавливаем статус "assigned" для операций с назначенными станками
UPDATE operations
SET status = 'assigned', "updatedAt" = NOW()
WHERE "assignedMachine" IS NOT NULL AND status = 'PENDING';

-- 4. Проверяем результат очистки
SELECT 'РЕЗУЛЬТАТ ОЧИСТКИ' as status;

SELECT 'shift_records' as table_name, COUNT(*) as count FROM shift_records
UNION ALL
SELECT 'operation_history', COUNT(*) FROM operation_history  
UNION ALL
SELECT 'operator_efficiency_stats', COUNT(*) FROM operator_efficiency_stats
UNION ALL
SELECT 'operations_pending', COUNT(*) FROM operations WHERE status = 'PENDING'
UNION ALL
SELECT 'operations_assigned', COUNT(*) FROM operations WHERE status = 'assigned'
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'machines', COUNT(*) FROM machines;

COMMIT;

-- Проверяем оставшиеся реальные данные
SELECT 'ОСТАВШИЕСЯ РЕАЛЬНЫЕ ДАННЫЕ' as info;

-- Смены (реальные данные производства)
SELECT 'СМЕНЫ:' as type, sr.date, sr."shiftType", sr.drawingnumber, 
       sr."dayShiftOperator", sr."nightShiftOperator",
       COALESCE(sr."dayShiftQuantity", 0) + COALESCE(sr."nightShiftQuantity", 0) as total_produced
FROM shift_records sr
ORDER BY sr.date DESC;

-- Заказы (реальные чертежи)
SELECT 'ЗАКАЗЫ:' as type, ord.drawing_number, ord.quantity, ord.deadline, ord.priority, ''::text, 0::int
FROM orders ord
ORDER BY ord.drawing_number;

-- Операции (связанные с реальными заказами)
SELECT 'ОПЕРАЦИИ:' as type, op."operationNumber"::text, op.operationtype, op.status, ord.drawing_number, op."estimatedTime"
FROM operations op
LEFT JOIN orders ord ON op."orderId" = ord.id
ORDER BY ord.drawing_number, op."operationNumber";

-- Станки (реальное оборудование)
SELECT 'СТАНКИ:' as type, m.code, m.type, 
       CASE WHEN m."isOccupied" THEN 'ЗАНЯТ' ELSE 'СВОБОДЕН' END, '', 0
FROM machines m
WHERE m."isActive" = true
ORDER BY m.code;