-- Создание таблицы заказов
CREATE TABLE "orders" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Создание таблицы операций
CREATE TABLE "operations" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES "orders"(id) ON DELETE CASCADE,
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

-- Создание таблицы смен
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

-- Создание таблицы наладок
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

-- Создание таблицы для результатов планирования
CREATE TABLE "planning_results" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES "orders"(id) ON DELETE CASCADE,
    operation_id UUID REFERENCES "operations"(id) ON DELETE CASCADE,
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

-- Автоматическое обновление timestamp при изменении записей
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

-- Создание политик доступа для аутентифицированных пользователей
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "operations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "setups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planning_results" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read orders"
    ON "orders" FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders"
    ON "orders" FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders"
    ON "orders" FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders"
    ON "orders" FOR DELETE
    USING (auth.role() = 'authenticated');

-- Аналогичные политики для других таблиц
-- operations
CREATE POLICY "Authenticated users can read operations"
    ON "operations" FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert operations"
    ON "operations" FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update operations"
    ON "operations" FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete operations"
    ON "operations" FOR DELETE
    USING (auth.role() = 'authenticated');

-- shifts
CREATE POLICY "Authenticated users can read shifts"
    ON "shifts" FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert shifts"
    ON "shifts" FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update shifts"
    ON "shifts" FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete shifts"
    ON "shifts" FOR DELETE
    USING (auth.role() = 'authenticated');

-- setups
CREATE POLICY "Authenticated users can read setups"
    ON "setups" FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert setups"
    ON "setups" FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update setups"
    ON "setups" FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete setups"
    ON "setups" FOR DELETE
    USING (auth.role() = 'authenticated');

-- planning_results
CREATE POLICY "Authenticated users can read planning_results"
    ON "planning_results" FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert planning_results"
    ON "planning_results" FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update planning_results"
    ON "planning_results" FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete planning_results"
    ON "planning_results" FOR DELETE
    USING (auth.role() = 'authenticated');
