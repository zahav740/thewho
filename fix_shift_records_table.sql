-- Проверяем существующую структуру таблицы shift_records
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shift_records'
ORDER BY ordinal_position;

-- Добавляем недостающие колонки если их нет
DO $$
BEGIN
    -- Добавляем operationId если не существует
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shift_records' AND column_name = 'operationId'
    ) THEN
        ALTER TABLE shift_records ADD COLUMN "operationId" INTEGER;
    END IF;

    -- Добавляем machineId если не существует
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shift_records' AND column_name = 'machineId'
    ) THEN
        ALTER TABLE shift_records ADD COLUMN "machineId" INTEGER NOT NULL DEFAULT 1;
    END IF;

    -- Проверяем drawingNumber
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shift_records' AND column_name = 'drawingNumber'
    ) THEN
        ALTER TABLE shift_records ADD COLUMN "drawingNumber" VARCHAR(255);
    END IF;

END $$;

-- Проверяем результат
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shift_records'
ORDER BY ordinal_position;
