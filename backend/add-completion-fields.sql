-- Скрипт для добавления недостающих полей
-- Выполнить в PostgreSQL

-- Добавляем поля для завершения операций в таблицу operations
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS "completedAt" timestamp,
ADD COLUMN IF NOT EXISTS "actualQuantity" integer;

-- Добавляем поля для архивирования в таблицу shift_records  
ALTER TABLE shift_records
ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "archivedAt" timestamp,
ADD COLUMN IF NOT EXISTS "resetAt" timestamp;

-- Обновляем комментарии
COMMENT ON COLUMN operations."completedAt" IS 'Время завершения операции';
COMMENT ON COLUMN operations."actualQuantity" IS 'Фактическое количество выполненных деталей';
COMMENT ON COLUMN shift_records."archived" IS 'Флаг архивирования записи смены';
COMMENT ON COLUMN shift_records."archivedAt" IS 'Время архивирования';
COMMENT ON COLUMN shift_records."resetAt" IS 'Время сброса данных смены';

-- Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('operations', 'shift_records')
AND column_name IN ('completedAt', 'actualQuantity', 'archived', 'archivedAt', 'resetAt')
ORDER BY table_name, column_name;
