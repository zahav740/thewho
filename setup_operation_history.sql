-- Выполнение создания таблиц истории операций
-- @file: setup_operation_history.sql
-- @description: Создание всех таблиц для системы истории операций
-- @created: 2025-06-07

-- Создание таблицы для истории операций по чертежам
CREATE TABLE IF NOT EXISTS operation_history (
    id SERIAL PRIMARY KEY,
    drawing_number VARCHAR(255) NOT NULL,
    operation_id INTEGER NOT NULL,
    operation_number INTEGER NOT NULL,
    operation_type VARCHAR(100) NOT NULL,
    machine_id INTEGER NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    operator_name VARCHAR(100),
    shift_type VARCHAR(20) NOT NULL, -- DAY, NIGHT
    quantity_produced INTEGER NOT NULL DEFAULT 0,
    time_per_unit DECIMAL(10,2),
    setup_time INTEGER DEFAULT 0,
    total_time DECIMAL(10,2),
    efficiency_rating DECIMAL(5,2), -- рейтинг эффективности 0-100
    date_completed DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Создание индексов для operation_history
CREATE INDEX IF NOT EXISTS idx_drawing_number ON operation_history (drawing_number);
CREATE INDEX IF NOT EXISTS idx_operation_id ON operation_history (operation_id);
CREATE INDEX IF NOT EXISTS idx_machine_id ON operation_history (machine_id);
CREATE INDEX IF NOT EXISTS idx_date_completed ON operation_history (date_completed);
CREATE INDEX IF NOT EXISTS idx_operator_name ON operation_history (operator_name);
CREATE INDEX IF NOT EXISTS idx_drawing_date ON operation_history (drawing_number, date_completed);

-- Создание таблицы для хранения статистики операторов
CREATE TABLE IF NOT EXISTS operator_efficiency_stats (
    id SERIAL PRIMARY KEY,
    operator_name VARCHAR(100) NOT NULL,
    drawing_number VARCHAR(255) NOT NULL,
    operation_type VARCHAR(100) NOT NULL,
    calculation_date DATE NOT NULL,
    
    -- Метрики производительности
    parts_per_hour DECIMAL(10,2) DEFAULT 0,
    plan_vs_fact_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Метрики качества
    average_time_per_part DECIMAL(10,2) DEFAULT 0,
    time_deviation_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Метрики стабильности
    consistency_rating DECIMAL(5,2) DEFAULT 0,
    
    -- Метрики использования
    working_time_minutes INTEGER DEFAULT 0,
    idle_time_minutes INTEGER DEFAULT 0,
    utilization_efficiency DECIMAL(5,2) DEFAULT 0,
    
    -- Общий рейтинг
    overall_rating DECIMAL(3,1) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Создание индексов для operator_efficiency_stats
CREATE INDEX IF NOT EXISTS idx_operator_stats ON operator_efficiency_stats (operator_name, calculation_date);
CREATE INDEX IF NOT EXISTS idx_drawing_operator_stats ON operator_efficiency_stats (drawing_number, operator_name);

-- Создание уникального ключа для operator_efficiency_stats
CREATE UNIQUE INDEX IF NOT EXISTS unique_operator_drawing_date 
ON operator_efficiency_stats (operator_name, drawing_number, calculation_date);

-- Создание таблицы для экспорта данных
CREATE TABLE IF NOT EXISTS operation_export_requests (
    id SERIAL PRIMARY KEY,
    drawing_number VARCHAR(255) NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    export_type VARCHAR(50) NOT NULL, -- 'excel', 'pdf', 'csv'
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    requested_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP NULL
);

-- Создание индексов для operation_export_requests
CREATE INDEX IF NOT EXISTS idx_export_status ON operation_export_requests (status);
CREATE INDEX IF NOT EXISTS idx_export_drawing ON operation_export_requests (drawing_number);

-- Добавление комментариев к таблицам
COMMENT ON TABLE operation_history IS 'История выполнения операций по чертежам';
COMMENT ON TABLE operator_efficiency_stats IS 'Статистика эффективности операторов';
COMMENT ON TABLE operation_export_requests IS 'Запросы на экспорт данных';

-- Вставка тестовых данных (опционально)
INSERT INTO operation_history (
    drawing_number, operation_id, operation_number, operation_type,
    machine_id, machine_name, operator_name, shift_type,
    quantity_produced, time_per_unit, setup_time, total_time,
    efficiency_rating, date_completed
) VALUES 
('TH1K4108A', 24, 1, 'MILLING', 1, 'Doosan 3', 'Кирилл', 'DAY', 5, 20.0, 120, 100.0, 75.0, '2025-06-06'),
('TH1K4108A', 24, 1, 'MILLING', 1, 'Doosan 3', 'Аркадий', 'NIGHT', 20, 25.0, 0, 500.0, 60.0, '2025-06-06'),
('C6HP0021A', 25, 1, 'MILLING', 2, 'Mitsubishi', 'Кирилл', 'DAY', 5, 20.0, 120, 100.0, 75.0, '2025-06-07'),
('C6HP0021A', 25, 1, 'MILLING', 2, 'Mitsubishi', 'Аркадий', 'NIGHT', 4, 25.0, 0, 100.0, 60.0, '2025-06-07')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE operation_history IS 'История выполнения операций по чертежам - для анализа эффективности и экспорта данных';
