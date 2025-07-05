-- Тестовые данные для проверки аналитики KPI/OEE
-- Сначала добавим записи смен с корректными данными

INSERT INTO shift_records (
  "date", 
  "shiftType", 
  "dayShiftQuantity", 
  "nightShiftQuantity", 
  "dayShiftTimePerUnit", 
  "nightShiftTimePerUnit", 
  "dayShiftOperator", 
  "nightShiftOperator", 
  "setupTime", 
  "drawingnumber",
  "setupOperator"
) VALUES 
-- Смена Кирилла: сложная наладка 5 часов, но хорошее производство
(
  '2025-06-30', 
  'DAY', 
  6,      -- произвел 6 деталей
  0, 
  25.0,   -- 25 минут на деталь = 150 минут производства
  0, 
  'Кирилл', 
  NULL, 
  300,    -- 5 часов наладки (сложная операция)
  'DWG-001',
  'Кирилл'
),
-- Смена Дениса: быстрая наладка, больше производства
(
  '2025-06-30', 
  'DAY', 
  13,     -- произвел 13 деталей 
  0, 
  20.0,   -- 20 минут на деталь = 260 минут производства
  0, 
  'Денис', 
  NULL, 
  120,    -- 2 часа наладки (стандартная)
  'DWG-002',
  'Денис'
),
-- Смена Даниэля: средняя наладка
(
  '2025-06-30', 
  'DAY', 
  10,     -- произвел 10 деталей
  0, 
  24.0,   -- 24 минуты на деталь = 240 минут производства
  0, 
  'Даниэль', 
  NULL, 
  180,    -- 3 часа наладки (с ОТК)
  'DWG-003',
  'Даниэль'
),
-- Предыдущий день - Кирилл
(
  '2025-06-29', 
  'DAY', 
  8,      -- произвел 8 деталей
  0, 
  30.0,   -- 30 минут на деталь = 240 минут производства
  0, 
  'Кирилл', 
  NULL, 
  240,    -- 4 часа наладки
  'DWG-004',
  'Кирилл'
),
-- Предыдущий день - Денис
(
  '2025-06-29', 
  'DAY', 
  15,     -- произвел 15 деталей
  0, 
  18.0,   -- 18 минут на деталь = 270 минут производства
  0, 
  'Денис', 
  NULL, 
  90,     -- 1.5 часа наладки (быстрая)
  'DWG-005',
  'Денис'
);

-- Проверим что записи добавились
SELECT 
  id,
  date,
  "dayShiftOperator" as operator,
  "dayShiftQuantity" as quantity,
  "dayShiftTimePerUnit" as time_per_unit,
  "setupTime" as setup_time,
  ("dayShiftQuantity" * "dayShiftTimePerUnit") as production_time,
  ("setupTime" + ("dayShiftQuantity" * "dayShiftTimePerUnit")) as total_active_time,
  ROUND((("setupTime" + ("dayShiftQuantity" * "dayShiftTimePerUnit")) / 480.0) * 100, 2) as oee_percent
FROM shift_records 
ORDER BY date DESC, "dayShiftOperator";
