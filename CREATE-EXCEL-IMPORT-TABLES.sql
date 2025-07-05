-- Миграция для создания таблиц Excel импорта
-- Выполните в pgAdmin или через psql

-- 1. Таблица для хранения информации о импортах
CREATE TABLE IF NOT EXISTS excel_imports (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mimetype VARCHAR(100),
    upload_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    processed_date TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(50) DEFAULT 'uploaded',
    error_message TEXT,
    headers_count INTEGER,
    rows_count INTEGER,
    sheets_count INTEGER,
    data_preview JSONB,
    imported_to_orders BOOLEAN DEFAULT FALSE,
    imported_to_operations BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2. Таблица для хранения данных из Excel файлов
CREATE TABLE IF NOT EXISTS excel_data (
    id SERIAL PRIMARY KEY,
    excel_import_id INTEGER REFERENCES excel_imports(id) ON DELETE CASCADE,
    sheet_name VARCHAR(255),
    row_number INTEGER,
    column_name VARCHAR(255),
    cell_value TEXT,
    data_type VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Таблица для настроек фильтров импорта
CREATE TABLE IF NOT EXISTS import_filters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    filter_config JSONB NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    column_mapping JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4. Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_excel_imports_filename ON excel_imports(filename);
CREATE INDEX IF NOT EXISTS idx_excel_imports_status ON excel_imports(status);
CREATE INDEX IF NOT EXISTS idx_excel_imports_upload_date ON excel_imports(upload_date);
CREATE INDEX IF NOT EXISTS idx_excel_data_import_id ON excel_data(excel_import_id);
CREATE INDEX IF NOT EXISTS idx_excel_data_column ON excel_data(column_name);
CREATE INDEX IF NOT EXISTS idx_excel_data_sheet_row ON excel_data(excel_import_id, row_number, sheet_name);

-- 5. Вставка базовых фильтров
INSERT INTO import_filters (name, description, filter_config, target_table, column_mapping, is_active) 
VALUES 
(
    'Orders Import Filter', 
    'Фильтр для импорта заказов из Excel файлов',
    '{
        "required_columns": ["drawing_number", "quantity", "deadline"],
        "optional_columns": ["priority", "workType"],
        "data_validation": {
            "drawing_number": {"type": "string", "required": true, "max_length": 100},
            "quantity": {"type": "integer", "required": true, "min": 1},
            "deadline": {"type": "date", "required": true},
            "priority": {"type": "integer", "min": 1, "max": 10, "default": 5}
        },
        "skip_empty_rows": true,
        "header_row": 1
    }',
    'orders',
    '{
        "drawing_number": "drawing_number",
        "Номер чертежа": "drawing_number",
        "quantity": "quantity", 
        "Количество": "quantity",
        "deadline": "deadline",
        "Срок": "deadline",
        "priority": "priority",
        "Приоритет": "priority",
        "workType": "workType",
        "Тип работы": "workType"
    }',
    true
),
(
    'Operations Import Filter', 
    'Фильтр для импорта операций из Excel файлов',
    '{
        "required_columns": ["order_id", "operation_name", "planned_duration"],
        "optional_columns": ["machine_id", "operator_id", "sequence"],
        "data_validation": {
            "order_id": {"type": "integer", "required": true},
            "operation_name": {"type": "string", "required": true, "max_length": 200},
            "planned_duration": {"type": "integer", "required": true, "min": 1},
            "machine_id": {"type": "integer"},
            "operator_id": {"type": "integer"},
            "sequence": {"type": "integer", "min": 1, "default": 1}
        },
        "skip_empty_rows": true,
        "header_row": 1
    }',
    'operations',
    '{
        "order_id": "order_id",
        "ID заказа": "order_id",
        "operation_name": "operation_name",
        "Название операции": "operation_name",
        "planned_duration": "planned_duration",
        "Плановая длительность": "planned_duration",
        "machine_id": "machine_id",
        "ID станка": "machine_id",
        "operator_id": "operator_id",
        "ID оператора": "operator_id",
        "sequence": "sequence",
        "Последовательность": "sequence"
    }',
    true
)
ON CONFLICT DO NOTHING;

-- 6. Проверка созданных таблиц
SELECT 
    'excel_imports' as table_name,
    COUNT(*) as row_count
FROM excel_imports
UNION ALL
SELECT 
    'excel_data' as table_name,
    COUNT(*) as row_count
FROM excel_data
UNION ALL
SELECT 
    'import_filters' as table_name,
    COUNT(*) as row_count
FROM import_filters;

-- Все готово!
SELECT 'Excel Import tables created successfully!' as status;
