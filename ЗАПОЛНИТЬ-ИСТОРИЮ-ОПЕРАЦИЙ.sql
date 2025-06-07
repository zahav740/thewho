-- Перенос реальных данных из shift_records в operation_history
-- Дата: 2025-06-07
-- Цель: Заполнить таблицу operation_history реальными данными из смен

-- Очистим таблицу operation_history на всякий случай
TRUNCATE TABLE operation_history RESTART IDENTITY;

-- Вставляем дневные смены
INSERT INTO operation_history (
  drawing_number, 
  operation_id, 
  operation_number, 
  operation_type,
  machine_id, 
  machine_name, 
  operator_name, 
  shift_type,
  quantity_produced, 
  time_per_unit, 
  setup_time, 
  total_time, 
  efficiency_rating,
  date_completed
)
SELECT 
  sr.drawingnumber,
  sr."operationId",
  1, -- операция номер (по умолчанию)
  'Токарная обработка', -- тип операции
  sr."machineId",
  m.code,
  sr."dayShiftOperator",
  'DAY',
  sr."dayShiftQuantity",
  sr."dayShiftTimePerUnit"::DECIMAL(10,2),
  COALESCE(sr."setupTime", 0),
  (sr."dayShiftQuantity" * sr."dayShiftTimePerUnit"::DECIMAL(10,2))::INTEGER, -- общее время
  CASE 
    WHEN sr."dayShiftTimePerUnit"::DECIMAL <= 15 THEN 95.0
    WHEN sr."dayShiftTimePerUnit"::DECIMAL <= 25 THEN 85.0
    WHEN sr."dayShiftTimePerUnit"::DECIMAL <= 50 THEN 80.0
    ELSE 75.0
  END, -- эффективность на основе времени
  sr.date
FROM shift_records sr
LEFT JOIN machines m ON sr."machineId" = m.id
WHERE sr."dayShiftOperator" IS NOT NULL 
  AND sr."dayShiftQuantity" IS NOT NULL
  AND sr."dayShiftQuantity" > 0
  AND sr."dayShiftTimePerUnit" IS NOT NULL;

-- Вставляем ночные смены  
INSERT INTO operation_history (
  drawing_number, 
  operation_id, 
  operation_number, 
  operation_type,
  machine_id, 
  machine_name, 
  operator_name, 
  shift_type,
  quantity_produced, 
  time_per_unit, 
  setup_time, 
  total_time, 
  efficiency_rating,
  date_completed
)
SELECT 
  sr.drawingnumber,
  sr."operationId",
  1, -- операция номер
  'Токарная обработка',
  sr."machineId",
  m.code,
  sr."nightShiftOperator",
  'NIGHT',
  sr."nightShiftQuantity",
  sr."nightShiftTimePerUnit"::DECIMAL(10,2),
  0, -- наладка только в дневной смене
  (sr."nightShiftQuantity" * sr."nightShiftTimePerUnit"::DECIMAL(10,2))::INTEGER,
  CASE 
    WHEN sr."nightShiftTimePerUnit"::DECIMAL <= 15 THEN 90.0
    WHEN sr."nightShiftTimePerUnit"::DECIMAL <= 25 THEN 80.0
    WHEN sr."nightShiftTimePerUnit"::DECIMAL <= 50 THEN 75.0
    ELSE 70.0
  END,
  sr.date
FROM shift_records sr
LEFT JOIN machines m ON sr."machineId" = m.id
WHERE sr."nightShiftOperator" IS NOT NULL 
  AND sr."nightShiftQuantity" IS NOT NULL
  AND sr."nightShiftQuantity" > 0
  AND sr."nightShiftTimePerUnit" IS NOT NULL;

-- Проверяем результат
SELECT 
  'Записей в operation_history:' as info,
  COUNT(*) as count
FROM operation_history

UNION ALL

SELECT 
  'Уникальных чертежей:' as info,
  COUNT(DISTINCT drawing_number) as count
FROM operation_history

UNION ALL

SELECT 
  'Уникальных операторов:' as info,
  COUNT(DISTINCT operator_name) as count
FROM operation_history;

-- Показываем примеры данных
SELECT 
  drawing_number,
  operation_number,
  machine_name,
  operator_name,
  shift_type,
  quantity_produced,
  time_per_unit,
  efficiency_rating,
  date_completed
FROM operation_history
ORDER BY date_completed DESC, drawing_number;
