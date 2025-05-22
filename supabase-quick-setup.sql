-- ===============================================
-- БЫСТРАЯ УСТАНОВКА СХЕМЫ ДЛЯ НОВОГО ПРОЕКТА
-- ===============================================

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ТАБЛИЦА ЗАКАЗОВ
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200),
    client_name VARCHAR(200),
    drawing_number VARCHAR(100) UNIQUE NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 3,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT orders_quantity_positive CHECK (quantity > 0),
    CONSTRAINT orders_priority_valid CHECK (priority BETWEEN 1 AND 5)
);

-- 2. ТАБЛИЦА ОПЕРАЦИЙ
CREATE TABLE IF NOT EXISTS operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    machine VARCHAR(50),
    operation_type VARCHAR(20) NOT NULL,
    estimated_time INTEGER NOT NULL,
    completed_units INTEGER DEFAULT 0,
    actual_time INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    operators JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT operations_sequence_positive CHECK (sequence_number > 0),
    CONSTRAINT operations_estimated_time_positive CHECK (estimated_time > 0),
    CONSTRAINT operations_completed_units_non_negative CHECK (completed_units >= 0),
    CONSTRAINT operations_operation_type_valid CHECK (operation_type IN ('3-axis', '4-axis', 'turning', 'milling')),
    CONSTRAINT operations_status_valid CHECK (status IN ('pending', 'in-progress', 'completed')),
    
    UNIQUE(order_id, sequence_number)
);

-- 3. ТАБЛИЦА ПЛАНИРОВАНИЯ
CREATE TABLE IF NOT EXISTS planning_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    machine VARCHAR(50) NOT NULL,
    planned_start_date TIMESTAMPTZ NOT NULL,
    planned_end_date TIMESTAMPTZ NOT NULL,
    quantity_assigned INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    expected_time_minutes INTEGER NOT NULL,
    setup_time_minutes INTEGER NOT NULL,
    buffer_time_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'planned',
    last_rescheduled_at TIMESTAMPTZ,
    rescheduled_reason VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
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

-- 4. ТАБЛИЦА СМЕН
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    machine VARCHAR(50) NOT NULL,
    is_night BOOLEAN NOT NULL DEFAULT false,
    operators JSONB DEFAULT '[]'::jsonb,
    operations JSONB DEFAULT '[]'::jsonb,
    setups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, machine, is_night)
);

-- 5. ТАБЛИЦА НАЛАДОК
CREATE TABLE IF NOT EXISTS setups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drawing_number VARCHAR(100) NOT NULL,
    setup_type VARCHAR(100) NOT NULL,
    operation_number INTEGER NOT NULL,
    time_spent INTEGER NOT NULL,
    operator VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    date DATE NOT NULL,
    machine VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT setups_time_positive CHECK (time_spent > 0),
    CONSTRAINT setups_operation_positive CHECK (operation_number > 0)
);

-- 6. СПРАВОЧНИК СТАНКОВ
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    supports_3_axis BOOLEAN DEFAULT false,
    supports_4_axis BOOLEAN DEFAULT false,
    supports_turning BOOLEAN DEFAULT false,
    supports_milling BOOLEAN DEFAULT false,
    efficiency_factor DECIMAL(3,2) DEFAULT 1.0,
    downtime_probability DECIMAL(3,2) DEFAULT 0.1,
    working_hours_per_day INTEGER DEFAULT 960,
    is_active BOOLEAN DEFAULT true,
    current_setup_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT machines_type_valid CHECK (type IN ('milling', 'turning')),
    CONSTRAINT machines_efficiency_positive CHECK (efficiency_factor > 0),
    CONSTRAINT machines_downtime_valid CHECK (downtime_probability BETWEEN 0 AND 1),
    CONSTRAINT machines_hours_positive CHECK (working_hours_per_day > 0)
);

-- 7. ТАБЛИЦА АЛЕРТОВ
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    affected_entity_type VARCHAR(20),
    affected_entity_id UUID,
    status VARCHAR(20) DEFAULT 'new',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT alerts_type_valid CHECK (type IN (
        'deadline_risk', 'performance_deviation', 'force_majeure',
        'resource_shortage', 'queue_overload', 'system_warning'
    )),
    CONSTRAINT alerts_severity_valid CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT alerts_entity_type_valid CHECK (affected_entity_type IN ('order', 'operation', 'machine', 'system')),
    CONSTRAINT alerts_status_valid CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'ignored'))
);

-- ЗАПОЛНЕНИЕ СПРАВОЧНЫХ ДАННЫХ
INSERT INTO machines (name, type, supports_3_axis, supports_4_axis, supports_turning, supports_milling, efficiency_factor, downtime_probability) VALUES
('Doosan Yashana', 'milling', true, true, false, true, 1.0, 0.08),
('Doosan Hadasha', 'milling', true, true, false, true, 1.1, 0.05),
('Doosan 3', 'milling', true, false, false, true, 0.9, 0.12),
('Pinnacle Gdola', 'milling', true, true, false, true, 1.2, 0.06),
('Mitsubishi', 'milling', true, false, false, true, 0.8, 0.15),
('Okuma', 'turning', false, false, true, false, 1.0, 0.07),
('JonFord', 'turning', false, false, true, false, 0.85, 0.10)
ON CONFLICT (name) DO NOTHING;

-- СОЗДАНИЕ ИНДЕКСОВ
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_operations_order_id ON operations(order_id);
CREATE INDEX IF NOT EXISTS idx_operations_sequence ON operations(order_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_planning_order_id ON planning_results(order_id);
CREATE INDEX IF NOT EXISTS idx_planning_machine ON planning_results(machine);
CREATE INDEX IF NOT EXISTS idx_planning_start_date ON planning_results(planned_start_date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_machine ON shifts(machine);

-- ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
DO $$
BEGIN
    -- Добавляем триггеры только если они не существуют
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at
            BEFORE UPDATE ON orders
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_operations_updated_at') THEN
        CREATE TRIGGER update_operations_updated_at
            BEFORE UPDATE ON operations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_planning_results_updated_at') THEN
        CREATE TRIGGER update_planning_results_updated_at
            BEFORE UPDATE ON planning_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shifts_updated_at') THEN
        CREATE TRIGGER update_shifts_updated_at
            BEFORE UPDATE ON shifts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_setups_updated_at') THEN
        CREATE TRIGGER update_setups_updated_at
            BEFORE UPDATE ON setups
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_machines_updated_at') THEN
        CREATE TRIGGER update_machines_updated_at
            BEFORE UPDATE ON machines
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_alerts_updated_at') THEN
        CREATE TRIGGER update_alerts_updated_at
            BEFORE UPDATE ON alerts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- НАСТРОЙКА ROW LEVEL SECURITY (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ПОЛИТИКИ ДЛЯ АНОНИМНЫХ ПОЛЬЗОВАТЕЛЕЙ (для разработки)
DO $$
BEGIN
    -- Создаем политики только если они не существуют
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON orders FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'operations' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON operations FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planning_results' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON planning_results FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON shifts FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'setups' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON setups FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'machines' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON machines FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Anonymous users full access') THEN
        CREATE POLICY "Anonymous users full access" ON alerts FOR ALL USING (true);
    END IF;
END $$;

-- ПРОВЕРКА СОЗДАНИЯ ТАБЛИЦ
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('orders', 'operations', 'planning_results', 'shifts', 'setups', 'machines', 'alerts')
ORDER BY tablename;

-- ПРОВЕРКА СТАНКОВ
SELECT name, type, is_active FROM machines ORDER BY name;
