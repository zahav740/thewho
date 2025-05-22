-- Заказы
CREATE TABLE "orders" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    client_name VARCHAR(100),
    drawing_number VARCHAR(50) UNIQUE,
    deadline TIMESTAMP,
    quantity INTEGER,
    remaining_quantity INTEGER,
    priority INTEGER,
    status VARCHAR(20) DEFAULT 'planned',
    completion_percentage FLOAT DEFAULT 0,
    forecasted_completion_date TIMESTAMP,
    is_on_schedule BOOLEAN DEFAULT TRUE,
    last_recalculation_at TIMESTAMP,
    pdf_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Операции
CREATE TABLE "operations" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    sequence_number INTEGER,
    machine VARCHAR(50),
    operation_type VARCHAR(10) CHECK (operation_type IN ('3-axis', '4-axis', 'turning', 'milling')),
    estimated_time INTEGER,
    completed_units INTEGER DEFAULT 0,
    actual_time INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    operators JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Смены
CREATE TABLE "shifts" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP,
    machine VARCHAR(50),
    is_night BOOLEAN,
    operators JSONB,
    operations JSONB,
    setups JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Наладки
CREATE TABLE "setups" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drawing_number VARCHAR(50),
    setup_type VARCHAR(50),
    operation_number INTEGER,
    time_spent INTEGER,
    operator VARCHAR(50),
    start_time VARCHAR(5),
    date TIMESTAMP,
    machine VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Результаты планирования
CREATE TABLE "planning_results" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
    machine VARCHAR(50),
    planned_start_date TIMESTAMP,
    planned_end_date TIMESTAMP,
    quantity_assigned INTEGER,
    remaining_quantity INTEGER,
    expected_time_minutes INTEGER,
    setup_time_minutes INTEGER,
    buffer_time_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'planned',
    last_rescheduled_at TIMESTAMP,
    rescheduled_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at
    BEFORE UPDATE ON operations
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

CREATE TRIGGER update_planning_results_updated_at
    BEFORE UPDATE ON planning_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Настройка row level security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_results ENABLE ROW LEVEL SECURITY;

-- Создание политик доступа для аутентифицированных пользователей
CREATE POLICY "Allow full access for authenticated users" ON orders
    USING (auth.role() = 'authenticated');
    
CREATE POLICY "Allow full access for authenticated users" ON operations
    USING (auth.role() = 'authenticated');
    
CREATE POLICY "Allow full access for authenticated users" ON shifts
    USING (auth.role() = 'authenticated');
    
CREATE POLICY "Allow full access for authenticated users" ON setups
    USING (auth.role() = 'authenticated');
    
CREATE POLICY "Allow full access for authenticated users" ON planning_results
    USING (auth.role() = 'authenticated');

-- Публичный доступ для анонимных пользователей (для разработки, в продакшене можно убрать)
CREATE POLICY "Allow full access for anonymous users" ON orders
    USING (true);
    
CREATE POLICY "Allow full access for anonymous users" ON operations
    USING (true);
    
CREATE POLICY "Allow full access for anonymous users" ON shifts
    USING (true);
    
CREATE POLICY "Allow full access for anonymous users" ON setups
    USING (true);
    
CREATE POLICY "Allow full access for anonymous users" ON planning_results
    USING (true);
