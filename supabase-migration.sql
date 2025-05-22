-- Скрипт для обновления структуры таблиц в существующей базе данных

-- Добавляем недостающие поля в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);

-- Обновляем существующие записи, если поля пустые
UPDATE orders 
SET name = drawing_number 
WHERE name IS NULL;

UPDATE orders 
SET client_name = drawing_number 
WHERE client_name IS NULL;
