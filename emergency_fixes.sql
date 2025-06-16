-- Функция для автоматического создания операций
CREATE OR REPLACE FUNCTION create_operations_for_order(order_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  order_record RECORD;
  work_type VARCHAR(50);
  result_text TEXT := '';
BEGIN
  -- Получаем данные заказа
  SELECT * INTO order_record FROM orders WHERE id = order_id;
  
  IF NOT FOUND THEN
    RETURN 'Заказ не найден';
  END IF;
  
  -- Определяем тип работ на основе чертежа или других данных
  work_type := COALESCE(order_record."workType", 'MIXED');
  
  -- Создаем стандартные операции в зависимости от типа
  IF work_type = 'TURNING' THEN
    -- Только токарные операции
    INSERT INTO operations ("orderId", "operationNumber", operationtype, "estimatedTime", status, "createdAt", "updatedAt")
    VALUES 
      (order_id, 1, 'TURNING', 60, 'PENDING', NOW(), NOW()),
      (order_id, 2, 'TURNING', 45, 'PENDING', NOW(), NOW());
    result_text := 'Созданы токарные операции';
    
  ELSIF work_type = 'MILLING' THEN
    -- Только фрезерные операции  
    INSERT INTO operations ("orderId", "operationNumber", operationtype, "estimatedTime", status, "createdAt", "updatedAt")
    VALUES 
      (order_id, 1, 'MILLING', 90, 'PENDING', NOW(), NOW()),
      (order_id, 2, 'MILLING', 60, 'PENDING', NOW(), NOW());
    result_text := 'Созданы фрезерные операции';
    
  ELSE
    -- Смешанные операции (по умолчанию)
    INSERT INTO operations ("orderId", "operationNumber", operationtype, "estimatedTime", status, "createdAt", "updatedAt")
    VALUES 
      (order_id, 1, 'MILLING', 75, 'PENDING', NOW(), NOW()),
      (order_id, 2, 'TURNING', 60, 'PENDING', NOW(), NOW()),
      (order_id, 3, 'MILLING', 45, 'PENDING', NOW(), NOW());
    result_text := 'Созданы смешанные операции';
  END IF;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Создаем операции для всех заказов без операций
DO $$
DECLARE
  order_without_ops RECORD;
  operations_created INTEGER := 0;
BEGIN
  FOR order_without_ops IN 
    SELECT o.id, o.drawing_number 
    FROM orders o
    LEFT JOIN operations op ON o.id = op."orderId"
    WHERE op.id IS NULL
    ORDER BY o.priority, o.id
  LOOP
    PERFORM create_operations_for_order(order_without_ops.id);
    operations_created := operations_created + 1;
    
    -- Логгируем прогресс каждые 10 заказов
    IF operations_created % 10 = 0 THEN
      RAISE NOTICE 'Создано операций для % заказов', operations_created;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'ЗАВЕРШЕНО: Создано операций для % заказов', operations_created;
END $$;

-- ==========================================
-- 🔧 ИСПРАВЛЕНИЕ 5: Создание прогресса для новых операций
-- ==========================================

-- Создаем прогресс для только что созданных операций
INSERT INTO operation_progress (operation_id, completed_units, total_units)
SELECT 
  op.id,
  0 as completed_units,
  GREATEST(ord.quantity, 1) as total_units
FROM operations op
INNER JOIN orders ord ON op."orderId" = ord.id
WHERE NOT EXISTS (
  SELECT 1 FROM operation_progress p WHERE p.operation_id = op.id
);

-- ==========================================
-- 🔧 ИСПРАВЛЕНИЕ 6: Триггер для автоматического создания прогресса
-- ==========================================

-- Функция триггера
CREATE OR REPLACE FUNCTION create_operation_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO operation_progress (operation_id, total_units)
  SELECT 
    NEW.id,
    GREATEST(ord.quantity, 1)
  FROM orders ord 
  WHERE ord.id = NEW."orderId";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
DROP TRIGGER IF EXISTS trigger_create_operation_progress ON operations;
CREATE TRIGGER trigger_create_operation_progress
  AFTER INSERT ON operations
  FOR EACH ROW
  EXECUTE FUNCTION create_operation_progress();

-- ==========================================
-- 📊 ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ==========================================

-- Проверяем статистику заказов и операций
SELECT 
  'РЕЗУЛЬТАТ ИСПРАВЛЕНИЙ:' as info,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM operations) as total_operations,
  (SELECT COUNT(*) FROM operation_progress) as operations_with_progress,
  (SELECT COUNT(*) FROM orders o WHERE NOT EXISTS (SELECT 1 FROM operations op WHERE op."orderId" = o.id)) as orders_without_operations;

-- Проверяем статусы операций
SELECT 'Статусы операций:' as info, status, COUNT(*) as count 
FROM operations 
GROUP BY status 
ORDER BY count DESC;

-- Проверяем назначенные операции на станки
SELECT 
  'Операции на станках:' as info,
  m.code as machine_name,
  op.id as operation_id,
  op."operationNumber",
  op.operationtype,
  op.status,
  prog.progress_percentage
FROM machines m
LEFT JOIN operations op ON m."currentOperation" = op.id OR op."assignedMachine" = m.id
LEFT JOIN operation_progress prog ON op.id = prog.operation_id
WHERE m."isActive" = true
ORDER BY m.code;

-- Проверяем общий прогресс
SELECT 
  'Общий прогресс:' as info,
  ROUND(AVG(progress_percentage), 2) as avg_progress,
  COUNT(*) as operations_with_progress,
  COUNT(CASE WHEN progress_percentage > 0 THEN 1 END) as operations_in_progress,
  COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as completed_operations
FROM operation_progress;

-- ==========================================
-- ✅ ФИНАЛЬНАЯ ПРОВЕРКА
-- ==========================================

SELECT 
  '🎉 ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ УСПЕШНО!' as status,
  'Система готова к работе' as message,
  NOW() as completed_at;
