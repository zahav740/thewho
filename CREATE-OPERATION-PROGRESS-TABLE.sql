-- Создание таблицы для отслеживания прогресса операций
CREATE TABLE IF NOT EXISTS operation_progress (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    completed_parts INTEGER DEFAULT 0,
    total_parts INTEGER DEFAULT 100,
    started_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    UNIQUE(operation_id)
);

-- Создание индекса для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_operation_progress_operation_id ON operation_progress(operation_id);

-- Заполнение начальными данными прогресса для существующих операций
INSERT INTO operation_progress (operation_id, completed_parts, total_parts, started_at)
SELECT 
    id,
    CASE 
        WHEN status = 'COMPLETED' THEN 100
        WHEN status = 'IN_PROGRESS' THEN FLOOR(RANDOM() * 60) + 20
        ELSE 0 
    END,
    100,
    COALESCE("assignedAt", "createdAt")
FROM operations 
WHERE id NOT IN (SELECT operation_id FROM operation_progress);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_operation_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления времени
DROP TRIGGER IF EXISTS trigger_update_operation_progress_updated_at ON operation_progress;
CREATE TRIGGER trigger_update_operation_progress_updated_at
    BEFORE UPDATE ON operation_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_operation_progress_updated_at();

-- Проверка созданной структуры
SELECT 
    'operation_progress table created successfully' as message,
    COUNT(*) as records_count
FROM operation_progress;
