-- ===============================================
-- НОВАЯ СХЕМА БАЗЫ ДАННЫХ SUPABASE ДЛЯ THEWHO
-- Создана на основе анализа TypeScript интерфейсов
-- ===============================================

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 1. ТАБЛИЦА ЗАКАЗОВ (ORDERS)
-- ===============================================
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200),                    -- Имя заказа
    client_name VARCHAR(200),             -- Имя клиента
    drawing_number VARCHAR(100) UNIQUE NOT NULL, -- Номер чертежа (уникальный)
    deadline TIMESTAMPTZ NOT NULL,       -- Дедлайн с учетом временной зоны
    quantity INTEGER NOT NULL DEFAULT 1,  -- Количество изделий
    priority INTEGER NOT NULL DEFAULT 3,  -- Приоритет (1 = высший, 3 = низший)
    pdf_url TEXT,                         -- URL PDF файла
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT orders_quantity_positive CHECK (quantity > 0),
    CONSTRAINT orders_priority_valid CHECK (priority BETWEEN 1 AND 5)
);

-- Индексы для заказов
CREATE INDEX idx_orders_deadline ON orders(deadline);
CREATE INDEX idx_orders_priority ON orders(priority);
CREATE INDEX idx_orders_drawing_number ON orders(drawing_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ===============================================
-- 2. ТАБЛИЦА ОПЕРАЦИЙ (OPERATIONS)
-- ===============================================
DROP TABLE IF EXISTS operations CASCADE;
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,     -- Номер операции в последовательности
    machine VARCHAR(50),                  -- Предпочтительный станок
    operation_type VARCHAR(20) NOT NULL,  -- Тип операции
    estimated_time INTEGER NOT NULL,      -- Оценочное время выполнения (в минутах на единицу)
    completed_units INTEGER DEFAULT 0,    -- Выполненное количество
    actual_time INTEGER,                  -- Фактическое время на единицу
    status VARCHAR(20) DEFAULT 'pending', -- Статус операции
    operators JSONB DEFAULT '[]'::jsonb,  -- Массив операторов
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT operations_sequence_positive CHECK (sequence_number > 0),
    CONSTRAINT operations_estimated_time_positive CHECK (estimated_time > 0),
    CONSTRAINT operations_completed_units_non_negative CHECK (completed_units >= 0),
    CONSTRAINT operations_operation_type_valid CHECK (operation_type IN ('3-axis', '4-axis', 'turning', 'milling')),
    CONSTRAINT operations_status_valid CHECK (status IN ('pending', 'in-progress', 'completed')),
    
    -- Уникальность номера операции в рамках заказа
    UNIQUE(order_id, sequence_number)
);

-- Индексы для операций
CREATE INDEX idx_operations_order_id ON operations(order_id);
CREATE INDEX idx_operations_sequence ON operations(order_id, sequence_number);
CREATE INDEX idx_operations_machine ON operations(machine);
CREATE INDEX idx_operations_status ON operations(status);
CREATE INDEX idx_operations_type ON operations(operation_type);

-- ===============================================
-- 3. ТАБЛИЦА РЕЗУЛЬТАТОВ ПЛАНИРОВАНИЯ (PLANNING_RESULTS)
-- ===============================================
DROP TABLE IF EXISTS planning_results CASCADE;
CREATE TABLE planning_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    machine VARCHAR(50) NOT NULL,         -- Назначенный станок
    planned_start_date TIMESTAMPTZ NOT NULL, -- Плановая дата начала
    planned_end_date TIMESTAMPTZ NOT NULL,   -- Плановая дата окончания
    quantity_assigned INTEGER NOT NULL,      -- Назначенное количество
    remaining_quantity INTEGER NOT NULL,     -- Оставшееся количество
    expected_time_minutes INTEGER NOT NULL,  -- Ожидаемое время выполнения (мин)
    setup_time_minutes INTEGER NOT NULL,     -- Время наладки (мин)
    buffer_time_minutes INTEGER NOT NULL,    -- Буферное время (мин)
    status VARCHAR(20) DEFAULT 'planned',    -- Статус планирования
    last_rescheduled_at TIMESTAMPTZ,         -- Последнее перепланирование
    rescheduled_reason VARCHAR(200),         -- Причина перепланирования
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT planning_quantity_positive CHECK (quantity_assigned > 0),
    CONSTRAINT planning_remaining_non_negative CHECK (remaining_quantity >= 0),
    CONSTRAINT planning_times_positive CHECK (
        expected_time_minutes > 0 AND 
        setup_time_minutes >= 0 AND 
        buffer_time_minutes >= 0
    ),
    CONSTRAINT planning_dates_logical CHECK (planned_end_date > planned_start_date),
    CONSTRAINT planning_status_valid CHECK (status IN ('planned', 'in-progress', 'completed', 'rescheduled'))
);

-- Индексы для планирования
CREATE INDEX idx_planning_order_id ON planning_results(order_id);
CREATE INDEX idx_planning_operation_id ON planning_results(operation_id);
CREATE INDEX idx_planning_machine ON planning_results(machine);
CREATE INDEX idx_planning_start_date ON planning_results(planned_start_date);
CREATE INDEX idx_planning_status ON planning_results(status);
CREATE INDEX idx_planning_machine_date ON planning_results(machine, planned_start_date);

-- ===============================================
-- 4. ТАБЛИЦА СМЕН (SHIFTS)
-- ===============================================
DROP TABLE IF EXISTS shifts CASCADE;
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,                   -- Дата смены
    machine VARCHAR(50) NOT NULL,         -- Станок
    is_night BOOLEAN NOT NULL DEFAULT false, -- Ночная смена
    operators JSONB DEFAULT '[]'::jsonb,  -- Массив операторов
    operations JSONB DEFAULT '[]'::jsonb, -- Массив выполненных операций
    setups JSONB DEFAULT '[]'::jsonb,     -- Массив наладок
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Уникальность смены по дате, станку и типу смены
    UNIQUE(date, machine, is_night)
);

-- Индексы для смен
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_machine ON shifts(machine);
CREATE INDEX idx_shifts_date_machine ON shifts(date, machine);
CREATE INDEX idx_shifts_is_night ON shifts(is_night);

-- ===============================================
-- 5. ТАБЛИЦА НАЛАДОК (SETUPS)
-- ===============================================
DROP TABLE IF EXISTS setups CASCADE;
CREATE TABLE setups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drawing_number VARCHAR(100) NOT NULL, -- Номер чертежа
    setup_type VARCHAR(100) NOT NULL,     -- Тип наладки
    operation_number INTEGER NOT NULL,    -- Номер операции
    time_spent INTEGER NOT NULL,          -- Затраченное время (минуты)
    operator VARCHAR(100) NOT NULL,       -- Оператор
    start_time TIME NOT NULL,             -- Время начала
    date DATE NOT NULL,                   -- Дата
    machine VARCHAR(50) NOT NULL,         -- Станок
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT setups_time_positive CHECK (time_spent > 0),
    CONSTRAINT setups_operation_positive CHECK (operation_number > 0)
);

-- Индексы для наладок
CREATE INDEX idx_setups_drawing_number ON setups(drawing_number);
CREATE INDEX idx_setups_date ON setups(date);
CREATE INDEX idx_setups_machine ON setups(machine);
CREATE INDEX idx_setups_operator ON setups(operator);
CREATE INDEX idx_setups_date_machine ON setups(date, machine);

-- ===============================================
-- 6. СПРАВОЧНАЯ ТАБЛИЦА СТАНКОВ (MACHINES)
-- ===============================================
DROP TABLE IF EXISTS machines CASCADE;
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,     -- Название станка
    type VARCHAR(20) NOT NULL,            -- Тип (milling/turning)
    supports_3_axis BOOLEAN DEFAULT false,
    supports_4_axis BOOLEAN DEFAULT false,
    supports_turning BOOLEAN DEFAULT false,
    supports_milling BOOLEAN DEFAULT false,
    efficiency_factor DECIMAL(3,2) DEFAULT 1.0, -- Коэффициент эффективности
    downtime_probability DECIMAL(3,2) DEFAULT 0.1, -- Вероятность простоя
    working_hours_per_day INTEGER DEFAULT 960, -- Рабочих минут в день
    is_active BOOLEAN DEFAULT true,       -- Активен ли станок
    current_setup_type VARCHAR(100),      -- Текущий тип наладки
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT machines_type_valid CHECK (type IN ('milling', 'turning')),
    CONSTRAINT machines_efficiency_positive CHECK (efficiency_factor > 0),
    CONSTRAINT machines_downtime_valid CHECK (downtime_probability BETWEEN 0 AND 1),
    CONSTRAINT machines_hours_positive CHECK (working_hours_per_day > 0)
);

-- ===============================================
-- 7. ТАБЛИЦА ФОРС-МАЖОРНЫХ СИТУАЦИЙ (FORCE_MAJEURE)
-- ===============================================
DROP TABLE IF EXISTS force_majeure CASCADE;
CREATE TABLE force_majeure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL,            -- Тип события
    entity_type VARCHAR(20) NOT NULL,     -- Тип сущности
    entity_id VARCHAR(100) NOT NULL,      -- ID затронутой сущности
    start_time TIMESTAMPTZ NOT NULL,      -- Время начала
    estimated_duration_minutes INTEGER NOT NULL, -- Оценочная продолжительность
    actual_duration_minutes INTEGER,      -- Фактическая продолжительность
    status VARCHAR(20) DEFAULT 'active',  -- Статус
    affected_orders JSONB DEFAULT '[]'::jsonb, -- Затронутые заказы
    affected_operations JSONB DEFAULT '[]'::jsonb, -- Затронутые операции
    description TEXT,                     -- Описание
    resolved_at TIMESTAMPTZ,              -- Время решения
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT force_majeure_type_valid CHECK (type IN (
        'machine_breakdown', 'tool_shortage', 'operator_absence',
        'material_shortage', 'quality_issue', 'power_outage', 'other'
    )),
    CONSTRAINT force_majeure_entity_type_valid CHECK (entity_type IN ('machine', 'operator', 'order')),
    CONSTRAINT force_majeure_status_valid CHECK (status IN ('active', 'resolved', 'partially_resolved')),
    CONSTRAINT force_majeure_duration_positive CHECK (estimated_duration_minutes > 0)
);

-- Индексы для форс-мажора
CREATE INDEX idx_force_majeure_type ON force_majeure(type);
CREATE INDEX idx_force_majeure_entity ON force_majeure(entity_type, entity_id);
CREATE INDEX idx_force_majeure_status ON force_majeure(status);
CREATE INDEX idx_force_majeure_start_time ON force_majeure(start_time);

-- ===============================================
-- 8. ТАБЛИЦА АЛЕРТОВ (ALERTS)
-- ===============================================
DROP TABLE IF EXISTS alerts CASCADE;
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL,            -- Тип алерта
    severity VARCHAR(10) NOT NULL,        -- Серьезность
    title VARCHAR(200) NOT NULL,          -- Заголовок
    description TEXT,                     -- Описание
    affected_entity_type VARCHAR(20),     -- Тип затронутой сущности
    affected_entity_id UUID,              -- ID затронутой сущности
    status VARCHAR(20) DEFAULT 'new',     -- Статус алерта
    resolved_at TIMESTAMPTZ,              -- Время решения
    
    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT alerts_type_valid CHECK (type IN (
        'deadline_risk', 'performance_deviation', 'force_majeure',
        'resource_shortage', 'queue_overload', 'system_warning'
    )),
    CONSTRAINT alerts_severity_valid CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT alerts_entity_type_valid CHECK (affected_entity_type IN ('order', 'operation', 'machine', 'system')),
    CONSTRAINT alerts_status_valid CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'ignored'))
);

-- Индексы для алертов
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_entity ON alerts(affected_entity_type, affected_entity_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- ===============================================
-- ЗАПОЛНЕНИЕ СПРАВОЧНЫХ ДАННЫХ
-- ===============================================

-- Добавляем станки из приложения
INSERT INTO machines (name, type, supports_3_axis, supports_4_axis, supports_turning, supports_milling, efficiency_factor, downtime_probability) VALUES
('Doosan Yashana', 'milling', true, true, false, true, 1.0, 0.08),
('Doosan Hadasha', 'milling', true, true, false, true, 1.1, 0.05),
('Doosan 3', 'milling', true, false, false, true, 0.9, 0.12),
('Pinnacle Gdola', 'milling', true, true, false, true, 1.2, 0.06),
('Mitsubishi', 'milling', true, false, false, true, 0.8, 0.15),
('Okuma', 'turning', false, false, true, false, 1.0, 0.07),
('JonFord', 'turning', false, false, true, false, 0.85, 0.10);

-- ===============================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ===============================================

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Добавляем триггеры для всех таблиц
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at
    BEFORE UPDATE ON operations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_results_updated_at
    BEFORE UPDATE ON planning_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setups_updated_at
    BEFORE UPDATE ON setups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at
    BEFORE UPDATE ON machines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_force_majeure_updated_at
    BEFORE UPDATE ON force_majeure
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- НАСТРОЙКА ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Включаем RLS для всех таблиц
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE force_majeure ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Политики для аутентифицированных пользователей
CREATE POLICY "Authenticated users full access" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON operations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON planning_results
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON shifts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON setups
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON machines
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON force_majeure
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON alerts
    FOR ALL USING (auth.role() = 'authenticated');

-- Политики для анонимных пользователей (для разработки)
-- В продакшене эти политики можно удалить
CREATE POLICY "Anonymous users full access" ON orders
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON operations
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON planning_results
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON shifts
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON setups
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON machines
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON force_majeure
    FOR ALL USING (true);

CREATE POLICY "Anonymous users full access" ON alerts
    FOR ALL USING (true);

-- ===============================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБСТВА РАБОТЫ
-- ===============================================

-- Представление заказов с операциями
CREATE OR REPLACE VIEW orders_with_operations AS
SELECT 
    o.*,
    COALESCE(
        jsonb_agg(
            CASE WHEN op.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', op.id,
                    'orderId', op.order_id,
                    'sequenceNumber', op.sequence_number,
                    'machine', op.machine,
                    'operationType', op.operation_type,
                    'estimatedTime', op.estimated_time,
                    'completedUnits', op.completed_units,
                    'actualTime', op.actual_time,
                    'status', op.status,
                    'operators', op.operators
                )
            ELSE NULL END
            ORDER BY op.sequence_number
        ) FILTER (WHERE op.id IS NOT NULL),
        '[]'::jsonb
    ) as operations
FROM orders o
LEFT JOIN operations op ON o.id = op.order_id
GROUP BY o.id, o.name, o.client_name, o.drawing_number, o.deadline, o.quantity, o.priority, o.pdf_url, o.created_at, o.updated_at;

-- Представление планирования с деталями
CREATE OR REPLACE VIEW planning_details AS
SELECT 
    pr.*,
    o.drawing_number,
    o.name as order_name,
    o.client_name,
    o.deadline,
    o.quantity as order_quantity,
    o.priority,
    op.sequence_number,
    op.operation_type,
    op.estimated_time,
    op.status as operation_status,
    m.type as machine_type,
    m.efficiency_factor,
    m.is_active as machine_active
FROM planning_results pr
JOIN orders o ON pr.order_id = o.id
JOIN operations op ON pr.operation_id = op.id
LEFT JOIN machines m ON pr.machine = m.name;

-- ===============================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
-- ===============================================

-- Функция для получения загрузки станка по дням
CREATE OR REPLACE FUNCTION get_machine_load_by_day(machine_name TEXT, start_date DATE, end_date DATE)
RETURNS TABLE(
    date DATE,
    operations_count INTEGER,
    total_time_minutes INTEGER,
    load_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.planned_start_date::DATE as date,
        COUNT(*)::INTEGER as operations_count,
        SUM(pr.expected_time_minutes + pr.setup_time_minutes + pr.buffer_time_minutes)::INTEGER as total_time_minutes,
        ROUND(
            (SUM(pr.expected_time_minutes + pr.setup_time_minutes + pr.buffer_time_minutes) * 100.0 / 960.0),
            2
        ) as load_percentage
    FROM planning_results pr
    WHERE pr.machine = machine_name
        AND pr.planned_start_date::DATE BETWEEN start_date AND end_date
        AND pr.status IN ('planned', 'in-progress')
    GROUP BY pr.planned_start_date::DATE
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Функция для проверки конфликтов планирования
CREATE OR REPLACE FUNCTION check_planning_conflicts(
    machine_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM planning_results pr
    WHERE pr.machine = machine_name
        AND pr.status IN ('planned', 'in-progress')
        AND (exclude_id IS NULL OR pr.id != exclude_id)
        AND (
            (start_time >= pr.planned_start_date AND start_time < pr.planned_end_date) OR
            (end_time > pr.planned_start_date AND end_time <= pr.planned_end_date) OR
            (start_time <= pr.planned_start_date AND end_time >= pr.planned_end_date)
        );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- ===============================================

COMMENT ON TABLE orders IS 'Заказы производства';
COMMENT ON TABLE operations IS 'Операции в рамках заказов';
COMMENT ON TABLE planning_results IS 'Результаты планирования операций';
COMMENT ON TABLE shifts IS 'Смены работы станков';
COMMENT ON TABLE setups IS 'Наладки станков';
COMMENT ON TABLE machines IS 'Справочник станков и их характеристик';
COMMENT ON TABLE force_majeure IS 'Форс-мажорные ситуации';
COMMENT ON TABLE alerts IS 'Системные уведомления и алерты';

-- ===============================================
-- ЗАВЕРШЕНИЕ СОЗДАНИЯ СХЕМЫ
-- ===============================================

-- Обновляем статистику для оптимизатора
ANALYZE;

-- Выводим информацию о созданных таблицах
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('orders', 'operations', 'planning_results', 'shifts', 'setups', 'machines', 'force_majeure', 'alerts')
ORDER BY tablename;
