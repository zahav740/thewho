-- =====================================================
-- Enhanced Calendar Database Setup
-- @file: enhanced_calendar_setup.sql
-- @description: Создание и настройка таблиц для улучшенного календаря
-- @created: 2025-06-11
-- =====================================================

-- Создание таблицы настроек рабочих дней
CREATE TABLE IF NOT EXISTS working_days_settings (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    working_days_pattern TEXT NOT NULL DEFAULT '0111110', -- 0=выходной, 1=рабочий (Вс,Пн,Вт,Ср,Чт,Пт,Сб)
    holidays TEXT[] DEFAULT '{}', -- Массив дат праздников в формате YYYY-MM-DD
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(year)
);

-- Создание таблицы шаблонов рабочего времени
CREATE TABLE IF NOT EXISTS working_time_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hours_per_day DECIMAL(4,2) NOT NULL DEFAULT 16.00, -- Часов в рабочий день (2 смены по 8ч)
    day_shift_start TIME DEFAULT '08:00',
    day_shift_end TIME DEFAULT '16:00',
    night_shift_start TIME DEFAULT '20:00',
    night_shift_end TIME DEFAULT '04:00',
    break_time_minutes INTEGER DEFAULT 60, -- Перерывы и простои
    setup_time_coefficient DECIMAL(3,2) DEFAULT 1.2, -- Коэффициент времени наладки
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создание расширенной таблицы для планирования операций
CREATE TABLE IF NOT EXISTS operation_planning (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER NOT NULL REFERENCES operations(id),
    machine_id INTEGER NOT NULL REFERENCES machines(id),
    
    -- Плановые даты
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    estimated_duration_days INTEGER NOT NULL,
    
    -- Времени и количества
    estimated_time_per_part DECIMAL(8,2) NOT NULL, -- минут на деталь
    planned_quantity INTEGER NOT NULL,
    setup_time_minutes INTEGER DEFAULT 0,
    
    -- Статус планирования
    planning_status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    priority_level INTEGER DEFAULT 3, -- 1=критичный, 2=высокий, 3=средний, 4=низкий
    
    -- Зависимости
    depends_on_operation_id INTEGER REFERENCES operations(id),
    parallel_operations INTEGER[] DEFAULT '{}', -- Массив ID параллельных операций
    
    -- Метаданные
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Создание индексов для operation_planning
CREATE INDEX IF NOT EXISTS idx_operation_planning_dates ON operation_planning (planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_operation_planning_machine ON operation_planning (machine_id, planned_start_date);
CREATE INDEX IF NOT EXISTS idx_operation_planning_status ON operation_planning (planning_status);

-- Создание таблицы календарных событий
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'maintenance', 'holiday', 'setup', 'inspection'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Связи
    machine_id INTEGER REFERENCES machines(id), -- NULL для общих событий
    operation_id INTEGER REFERENCES operations(id),
    
    -- Свойства
    is_blocking BOOLEAN DEFAULT TRUE, -- Блокирует ли событие производство
    color VARCHAR(7) DEFAULT '#ff4d4f', -- Цвет события в календаре
    priority INTEGER DEFAULT 3,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создание представления для удобного получения данных календаря
CREATE OR REPLACE VIEW enhanced_calendar_view AS
SELECT 
    m.id as machine_id,
    m.code as machine_name,
    m.type as machine_type,
    
    -- Данные операций
    o.id as operation_id,
    o.operation_number,
    o.estimated_time,
    o.status as operation_status,
    ord.drawing_number,
    ord.quantity as order_quantity,
    ord.deadline as order_deadline,
    
    -- Данные планирования
    op.planned_start_date,
    op.planned_end_date,
    op.estimated_duration_days,
    op.estimated_time_per_part,
    op.setup_time_minutes,
    op.planning_status,
    
    -- Данные смен
    sr.date as shift_date,
    sr.day_shift_operator,
    sr.night_shift_operator,
    sr.day_shift_quantity,
    sr.night_shift_quantity,
    sr.day_shift_time_per_unit,
    sr.night_shift_time_per_unit,
    sr.setup_time as actual_setup_time,
    
    -- События календаря
    ce.event_type,
    ce.title as event_title,
    ce.start_date as event_start,
    ce.end_date as event_end
    
FROM machines m
LEFT JOIN operations o ON m.id = o.machine_id
LEFT JOIN orders ord ON o.order_id = ord.id
LEFT JOIN operation_planning op ON o.id = op.operation_id
LEFT JOIN shift_records sr ON o.id = sr.operation_id
LEFT JOIN calendar_events ce ON m.id = ce.machine_id
WHERE m.is_active = true;

-- Функция для расчета рабочих дней
CREATE OR REPLACE FUNCTION calculate_working_days(
    start_date DATE,
    end_date DATE,
    year_pattern INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    current_date DATE := start_date;
    working_days INTEGER := 0;
    day_of_week INTEGER;
    pattern TEXT;
    holidays TEXT[];
BEGIN
    -- Получаем настройки для года
    SELECT working_days_pattern, COALESCE(holidays, '{}')
    INTO pattern, holidays
    FROM working_days_settings 
    WHERE year = EXTRACT(YEAR FROM start_date)
    LIMIT 1;
    
    -- Используем стандартный паттерн если настройки не найдены
    IF pattern IS NULL THEN
        pattern := '0111110'; -- Вс,Пн,Вт,Ср,Чт,Пт,Сб -> Пт,Сб выходные
    END IF;
    
    -- Подсчитываем рабочие дни
    WHILE current_date <= end_date LOOP
        day_of_week := EXTRACT(dow FROM current_date); -- 0=воскресенье, 6=суббота
        
        -- Проверяем, рабочий ли день по паттерну
        IF SUBSTRING(pattern FROM day_of_week + 1 FOR 1) = '1' THEN
            -- Проверяем, не праздник ли
            IF NOT (current_date::TEXT = ANY(holidays)) THEN
                working_days := working_days + 1;
            END IF;
        END IF;
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN working_days;
END;
$$ LANGUAGE plpgsql;

-- Функция для расчета продолжительности операции
CREATE OR REPLACE FUNCTION calculate_operation_duration(
    time_per_part DECIMAL,
    quantity INTEGER,
    setup_time INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    total_minutes INTEGER;
    minutes_per_day INTEGER;
    duration_days INTEGER;
BEGIN
    -- Общее время операции
    total_minutes := (time_per_part * quantity) + COALESCE(setup_time, 0);
    
    -- Минут в рабочий день (2 смены по 8 часов минус перерывы)
    minutes_per_day := 16 * 60 - 60; -- 16 часов минус 1 час перерывов
    
    -- Количество дней (округляем вверх)
    duration_days := CEIL(total_minutes::DECIMAL / minutes_per_day);
    
    -- Минимум 1 день
    RETURN GREATEST(1, duration_days);
END;
$$ LANGUAGE plpgsql;

-- Функция для получения следующего рабочего дня
CREATE OR REPLACE FUNCTION get_next_working_day(
    input_date DATE,
    days_to_add INTEGER DEFAULT 1
) RETURNS DATE AS $$
DECLARE
    current_date DATE := input_date;
    days_added INTEGER := 0;
    day_of_week INTEGER;
    pattern TEXT;
    holidays TEXT[];
BEGIN
    -- Получаем настройки
    SELECT working_days_pattern, COALESCE(holidays, '{}')
    INTO pattern, holidays
    FROM working_days_settings 
    WHERE year = EXTRACT(YEAR FROM input_date)
    LIMIT 1;
    
    IF pattern IS NULL THEN
        pattern := '0111110';
    END IF;
    
    -- Ищем нужное количество рабочих дней
    WHILE days_added < days_to_add LOOP
        current_date := current_date + INTERVAL '1 day';
        day_of_week := EXTRACT(dow FROM current_date);
        
        -- Проверяем, рабочий ли день
        IF SUBSTRING(pattern FROM day_of_week + 1 FOR 1) = '1' 
           AND NOT (current_date::TEXT = ANY(holidays)) THEN
            days_added := days_added + 1;
        END IF;
    END LOOP;
    
    RETURN current_date;
END;
$$ LANGUAGE plpgsql;

-- Заполнение базовых настроек
INSERT INTO working_days_settings (year, working_days_pattern, holidays) VALUES 
(2025, '0111110', ARRAY['2025-01-01', '2025-05-01', '2025-12-25']) -- Новый год, День труда, Рождество
ON CONFLICT (year) DO UPDATE SET
    working_days_pattern = EXCLUDED.working_days_pattern,
    holidays = EXCLUDED.holidays,
    updated_at = NOW();

-- Заполнение шаблона рабочего времени
INSERT INTO working_time_templates (name, hours_per_day, is_default) VALUES
('Стандартный (2 смены)', 16.00, true),
('Одна смена', 8.00, false),
('Непрерывное производство', 24.00, false)
ON CONFLICT DO NOTHING;

-- Создание тестовых записей планирования операций
INSERT INTO operation_planning (
    operation_id, machine_id, planned_start_date, planned_end_date,
    estimated_duration_days, estimated_time_per_part, planned_quantity,
    setup_time_minutes, planning_status, priority_level
)
SELECT 
    o.id,
    o.machine_id,
    CURRENT_DATE + (RANDOM() * 14)::INTEGER,
    CURRENT_DATE + (RANDOM() * 14)::INTEGER + (RANDOM() * 7)::INTEGER + 1,
    calculate_operation_duration(o.estimated_time, COALESCE(ord.quantity, 20), 120),
    o.estimated_time,
    COALESCE(ord.quantity, 20),
    CASE WHEN RANDOM() > 0.6 THEN 120 ELSE 0 END,
    'planned',
    (RANDOM() * 3 + 1)::INTEGER
FROM operations o
LEFT JOIN orders ord ON o.order_id = ord.id
WHERE o.machine_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM operation_planning op2 WHERE op2.operation_id = o.id
  )
LIMIT 20;

-- Создание тестовых календарных событий
INSERT INTO calendar_events (event_type, title, start_date, end_date, machine_id, is_blocking, color)
VALUES 
('maintenance', 'Плановое ТО станка Doosan 3', CURRENT_DATE + 7, CURRENT_DATE + 7, 1, true, '#ff7875'),
('maintenance', 'Замена инструмента', CURRENT_DATE + 3, CURRENT_DATE + 3, 2, true, '#ffa940'),
('inspection', 'Проверка качества', CURRENT_DATE + 10, CURRENT_DATE + 10, NULL, false, '#40a9ff'),
('holiday', 'Корпоративный день', CURRENT_DATE + 14, CURRENT_DATE + 14, NULL, true, '#95de64');

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_machine ON calendar_events (machine_id, start_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_calendar_machine_date ON operation_planning (machine_id, planned_start_date);

-- Комментарии к таблицам
COMMENT ON TABLE working_days_settings IS 'Настройки рабочих дней и праздников по годам';
COMMENT ON TABLE working_time_templates IS 'Шаблоны рабочего времени и смен';
COMMENT ON TABLE operation_planning IS 'Расширенное планирование операций с учетом календаря';
COMMENT ON TABLE calendar_events IS 'События календаря (ТО, праздники, простои)';
COMMENT ON VIEW enhanced_calendar_view IS 'Объединенное представление для календаря';

-- Функция для очистки старых записей планирования
CREATE OR REPLACE FUNCTION cleanup_old_planning_records() RETURNS void AS $$
BEGIN
    DELETE FROM operation_planning 
    WHERE planned_end_date < CURRENT_DATE - INTERVAL '30 days'
      AND planning_status = 'completed';
      
    DELETE FROM calendar_events 
    WHERE end_date < CURRENT_DATE - INTERVAL '90 days'
      AND event_type NOT IN ('holiday');
END;
$$ LANGUAGE plpgsql;

-- Добавление тестовых данных в shift_records для демонстрации
INSERT INTO shift_records (
    machine_id, operation_id, date, day_shift_operator, night_shift_operator,
    day_shift_quantity, night_shift_quantity, day_shift_time_per_unit, 
    night_shift_time_per_unit, setup_time
)
SELECT 
    (RANDOM() * 4 + 1)::INTEGER as machine_id,
    o.id as operation_id,
    CURRENT_DATE - (RANDOM() * 14)::INTEGER as date,
    CASE WHEN RANDOM() > 0.5 THEN 
        (ARRAY['Кирилл', 'Аркадий', 'Denis', 'Андрей'])[ceil(random()*4)] 
        ELSE NULL END as day_shift_operator,
    CASE WHEN RANDOM() > 0.6 THEN 
        (ARRAY['Кирилл', 'Аркадий', 'Denis', 'Андрей'])[ceil(random()*4)] 
        ELSE NULL END as night_shift_operator,
    CASE WHEN RANDOM() > 0.4 THEN (RANDOM() * 20 + 5)::INTEGER ELSE 0 END as day_shift_quantity,
    CASE WHEN RANDOM() > 0.7 THEN (RANDOM() * 15 + 3)::INTEGER ELSE 0 END as night_shift_quantity,
    (RANDOM() * 10 + 15)::INTEGER as day_shift_time_per_unit,
    (RANDOM() * 8 + 18)::INTEGER as night_shift_time_per_unit,
    CASE WHEN RANDOM() > 0.7 THEN (RANDOM() * 60 + 60)::INTEGER ELSE 0 END as setup_time
FROM operations o
WHERE o.machine_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM shift_records sr WHERE sr.operation_id = o.id
  )
LIMIT 30;

-- Создание задачи для автоматической очистки (опционально)
-- SELECT cron.schedule('cleanup-planning', '0 2 * * 0', 'SELECT cleanup_old_planning_records();');

COMMIT;

-- Информационное сообщение
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Calendar Database Setup завершен!';
    RAISE NOTICE 'Созданы таблицы:';
    RAISE NOTICE '- working_days_settings (настройки рабочих дней)';
    RAISE NOTICE '- working_time_templates (шаблоны рабочего времени)';
    RAISE NOTICE '- operation_planning (планирование операций)';
    RAISE NOTICE '- calendar_events (события календаря)';
    RAISE NOTICE 'Созданы функции:';
    RAISE NOTICE '- calculate_working_days() (расчет рабочих дней)';
    RAISE NOTICE '- calculate_operation_duration() (расчет продолжительности)';
    RAISE NOTICE '- get_next_working_day() (следующий рабочий день)';
    RAISE NOTICE 'Добавлены тестовые данные для демонстрации';
END $$;
