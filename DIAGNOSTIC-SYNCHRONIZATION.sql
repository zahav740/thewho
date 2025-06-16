-- ============================================
-- 🎯 ПОЛНЫЙ ТЕСТ СИНХРОНИЗАЦИИ ПРОИЗВОДСТВО ↔ СМЕНЫ
-- ============================================

-- 📊 ТЕКУЩЕЕ СОСТОЯНИЕ СИНХРОНИЗАЦИИ
SELECT 
  '🔍 ДИАГНОСТИКА ТЕКУЩЕГО СОСТОЯНИЯ' as step,
  COUNT(*) as total_operations,
  COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned_ops,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_ops,
  COUNT(CASE WHEN "actualQuantity" > 0 THEN 1 END) as ops_with_data
FROM operations 
WHERE status IN ('ASSIGNED', 'IN_PROGRESS');

-- ✅ ОПЕРАЦИИ С СИНХРОНИЗИРОВАННЫМИ ДАННЫМИ
SELECT 
  '✅ СИНХРОНИЗИРОВАННЫЕ ОПЕРАЦИИ' as step,
  o.id as operation_id,
  o."operationNumber",
  o.status,
  o."actualQuantity",
  ord.drawing_number,
  m.code as machine_code,
  sr."dayShiftQuantity",
  sr."nightShiftQuantity",
  (sr."dayShiftQuantity" + sr."nightShiftQuantity") as total_produced,
  ROUND(((sr."dayShiftQuantity" + sr."nightShiftQuantity") * 100.0 / 30), 1) as progress_percent
FROM operations o
LEFT JOIN orders ord ON o."orderId" = ord.id
LEFT JOIN machines m ON o."assignedMachine" = m.id
LEFT JOIN shift_records sr ON o.id = sr."operationId"
WHERE o.status IN ('ASSIGNED', 'IN_PROGRESS') 
  AND (sr."dayShiftQuantity" > 0 OR sr."nightShiftQuantity" > 0)
ORDER BY o."actualQuantity" DESC;

-- 📋 ВСЕ ЗАПИСИ СМЕН С ОПЕРАЦИЯМИ
SELECT 
  '📋 ЗАПИСИ СМЕН' as step,
  sr.id as shift_id,
  sr."operationId",
  sr."machineId", 
  sr."drawingnumber",
  sr."dayShiftQuantity",
  sr."nightShiftQuantity",
  sr."dayShiftOperator",
  sr."nightShiftOperator",
  sr."setupTime",
  sr."setupOperator",
  o."operationNumber",
  o.status as operation_status,
  m.code as machine_code
FROM shift_records sr
LEFT JOIN operations o ON sr."operationId" = o.id
LEFT JOIN machines m ON sr."machineId" = m.id
ORDER BY sr."updatedAt" DESC;

-- 🎯 СВОДКА ПО СИНХРОНИЗАЦИИ
SELECT 
  '🎯 СВОДКА СИНХРОНИЗАЦИИ' as step,
  COUNT(DISTINCT o.id) as total_assigned_operations,
  COUNT(DISTINCT sr.id) as total_shift_records,
  COUNT(DISTINCT CASE WHEN sr."dayShiftQuantity" > 0 OR sr."nightShiftQuantity" > 0 THEN sr.id END) as active_shift_records,
  ROUND(AVG(sr."dayShiftQuantity" + sr."nightShiftQuantity"), 1) as avg_production_per_shift
FROM operations o
LEFT JOIN shift_records sr ON o.id = sr."operationId"
WHERE o.status IN ('ASSIGNED', 'IN_PROGRESS');
