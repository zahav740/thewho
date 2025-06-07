-- Создание таблицы для истории операций по чертежам
-- @file: create_operation_history_table.sql
-- @description: Таблица для хранения истории выполнения операций
-- @created: 2025-06-07

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
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Индексы для быстрого поиска
    INDEX idx_drawing_number (drawing_number),
    INDEX idx_operation_id (operation_id),
    INDEX idx_machine_id (machine_id),
    INDEX idx_date_completed (date_completed),
    INDEX idx_operator_name (operator_name),
    
    -- Составной индекс для фильтрации по чертежу и дате
    INDEX idx_drawing_date (drawing_number, date_completed),
    
    -- Внешние ключи
    FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

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
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Индексы
    INDEX idx_operator_stats (operator_name, calculation_date),
    INDEX idx_drawing_operator_stats (drawing_number, operator_name),
    
    -- Уникальность записи на дату
    UNIQUE KEY unique_operator_drawing_date (operator_name, drawing_number, calculation_date)
);

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
    completed_at TIMESTAMP NULL,
    
    INDEX idx_export_status (status),
    INDEX idx_export_drawing (drawing_number)
);
