-- ИСПРАВЛЕНИЕ СТРУКТУРЫ БД ДЛЯ PRODUCTION CRM
-- Этот скрипт приводит структуру БД в соответствие с реальными entity

-- 1. Сначала проверим текущую структуру
\echo 'Проверяем текущую структуру таблиц...'
SELECT table_name, column_name, data_type FROM information_schema.columns 
WHERE table_name IN ('orders', 'operations', 'machines') 
ORDER BY table_name, ordinal_position;

\echo 'Проверяем заказ C6HP0021A...'
-- Ищем этот заказ
SELECT * FROM orders WHERE drawing_number = 'C6HP0021A';

\echo 'Проверяем операции для C6HP0021A...'
-- Ищем операции (пробуем разные возможные имена полей)
SELECT * FROM operations WHERE order_id IS NOT NULL LIMIT 5;

-- 2. Исправляем структуру если нужно
\echo 'Исправляем структуру operations если нужно...'

-- Если в operations нет поля order_id, создаем его
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'order_id') THEN
        ALTER TABLE operations ADD COLUMN order_id INTEGER;
        ALTER TABLE operations ADD FOREIGN KEY (order_id) REFERENCES orders(id);
        RAISE NOTICE 'Добавлено поле order_id в таблицу operations';
    END IF;
END $$;

-- Если в operations нет поля sequence_number, создаем его или переименовываем
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'sequence_number') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operationNumber') THEN
            ALTER TABLE operations RENAME COLUMN "operationNumber" TO sequence_number;
            RAISE NOTICE 'Переименовано operationNumber в sequence_number';
        ELSE
            ALTER TABLE operations ADD COLUMN sequence_number INTEGER DEFAULT 1;
            RAISE NOTICE 'Добавлено поле sequence_number';
        END IF;
    END IF;
END $$;

-- Если в operations нет поля operation_type, создаем его или переименовываем
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operation_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operationType') THEN
            ALTER TABLE operations RENAME COLUMN "operationType" TO operation_type;
            RAISE NOTICE 'Переименовано operationType в operation_type';
        ELSE
            ALTER TABLE operations ADD COLUMN operation_type VARCHAR DEFAULT 'MILLING';
            RAISE NOTICE 'Добавлено поле operation_type';
        END IF;
    END IF;
END $$;

-- Если в operations нет поля estimated_time, создаем его или переименовываем
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'estimated_time') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'estimatedTime') THEN
            ALTER TABLE operations RENAME COLUMN "estimatedTime" TO estimated_time;
            RAISE NOTICE 'Переименовано estimatedTime в estimated_time';
        ELSE
            ALTER TABLE operations ADD COLUMN estimated_time INTEGER DEFAULT 60;
            RAISE NOTICE 'Добавлено поле estimated_time';
        END IF;
    END IF;
END $$;

-- 3. Создаем тестовые данные для заказа C6HP0021A
\echo 'Создаем тестовые данные для C6HP0021A...'

-- Создаем заказ если его нет
INSERT INTO orders (drawing_number, quantity, deadline, priority, "workType")
VALUES ('C6HP0021A', 5, '2025-07-15', 2, 'Комплексная механическая обработка')
ON CONFLICT (drawing_number) DO NOTHING;

-- Получаем ID заказа
DO $$
DECLARE
    order_id_var INTEGER;
BEGIN
    SELECT id INTO order_id_var FROM orders WHERE drawing_number = 'C6HP0021A';
    
    IF order_id_var IS NOT NULL THEN
        -- Удаляем старые операции для этого заказа
        DELETE FROM operations WHERE order_id = order_id_var;
        
        -- Создаем 3 операции для заказа C6HP0021A
        INSERT INTO operations (sequence_number, operation_type, estimated_time, order_id, machine, status) VALUES
        (1, 'MILLING', 120, order_id_var, 'F1', 'PENDING'),
        (2, 'TURNING', 90, order_id_var, 'T1', 'PENDING'), 
        (3, 'DRILLING', 60, order_id_var, 'F2', 'PENDING');
        
        RAISE NOTICE 'Создано 3 операции для заказа C6HP0021A (ID: %)', order_id_var;
    ELSE
        RAISE NOTICE 'Заказ C6HP0021A не найден!';
    END IF;
END $$;

-- 4. Проверяем результат
\echo 'Проверяем результат...'

SELECT 
    o.drawing_number as "Номер чертежа",
    o.quantity as "Количество", 
    o.priority as "Приоритет",
    op.sequence_number as "№ операции",
    op.operation_type as "Тип операции",
    op.machine as "Станок",
    op.estimated_time as "Время (мин)",
    op.status as "Статус"
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
WHERE o.drawing_number = 'C6HP0021A'
ORDER BY op.sequence_number;

\echo 'Общая статистика...'

SELECT 
    'Всего заказов' as "Тип",
    COUNT(*) as "Количество"
FROM orders
UNION ALL
SELECT 
    'Всего операций',
    COUNT(*)
FROM operations
UNION ALL
SELECT 
    'Операций для C6HP0021A',
    COUNT(*)
FROM operations op
JOIN orders o ON o.id = op.order_id
WHERE o.drawing_number = 'C6HP0021A';

\echo 'Готово! Структура БД исправлена.'
