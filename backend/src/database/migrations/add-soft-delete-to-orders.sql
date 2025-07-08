-- Миграция для добавления полей soft delete в таблицу orders
-- Дата создания: 2025-07-08
-- Описание: Добавляет поля isDeleted, deletedAt, deletedBy для мягкого удаления заказов

-- Проверяем существование таблицы orders
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE EXCEPTION 'Таблица orders не существует. Сначала создайте основную структуру БД.';
    END IF;
END $;

-- Добавляем поле isDeleted (по умолчанию false) - безопасно
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'isDeleted') THEN
        ALTER TABLE orders ADD COLUMN "isDeleted" boolean NOT NULL DEFAULT false;
        RAISE NOTICE 'Добавлено поле isDeleted';
    ELSE
        RAISE NOTICE 'Поле isDeleted уже существует';
    END IF;
END $;

-- Добавляем поле deletedAt (может быть NULL) - безопасно
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deletedAt') THEN
        ALTER TABLE orders ADD COLUMN "deletedAt" timestamp NULL;
        RAISE NOTICE 'Добавлено поле deletedAt';
    ELSE
        RAISE NOTICE 'Поле deletedAt уже существует';
    END IF;
END $;

-- Добавляем поле deletedBy (может быть NULL) - безопасно  
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deletedBy') THEN
        ALTER TABLE orders ADD COLUMN "deletedBy" varchar(100) NULL;
        RAISE NOTICE 'Добавлено поле deletedBy';
    ELSE
        RAISE NOTICE 'Поле deletedBy уже существует';
    END IF;
END $;

-- Создаем индекс для быстрого поиска активных заказов - безопасно
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_not_deleted') THEN
        CREATE INDEX idx_orders_not_deleted ON orders ("isDeleted") WHERE "isDeleted" = false;
        RAISE NOTICE 'Создан индекс idx_orders_not_deleted';
    ELSE
        RAISE NOTICE 'Индекс idx_orders_not_deleted уже существует';
    END IF;
END $;

-- Создаем индекс для поиска по номеру чертежа включая удаленные - безопасно
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_drawing_number_all') THEN
        CREATE INDEX idx_orders_drawing_number_all ON orders ("drawingNumber");
        RAISE NOTICE 'Создан индекс idx_orders_drawing_number_all';
    ELSE
        RAISE NOTICE 'Индекс idx_orders_drawing_number_all уже существует';
    END IF;
END $;

-- Добавляем комментарии к полям
COMMENT ON COLUMN orders."isDeleted" IS 'Флаг мягкого удаления заказа (false = активный, true = удален)';
COMMENT ON COLUMN orders."deletedAt" IS 'Дата и время мягкого удаления заказа';
COMMENT ON COLUMN orders."deletedBy" IS 'Пользователь, который выполнил мягкое удаление заказа';

-- Показываем результат
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('isDeleted', 'deletedAt', 'deletedBy')
ORDER BY column_name;

-- Показываем количество активных и удаленных заказов
DO $
DECLARE
    active_count INT;
    deleted_count INT;
BEGIN
    SELECT COUNT(*) INTO active_count FROM orders WHERE "isDeleted" = false;
    SELECT COUNT(*) INTO deleted_count FROM orders WHERE "isDeleted" = true;
    
    RAISE NOTICE 'Статистика заказов:';
    RAISE NOTICE '  Активных заказов: %', active_count;
    RAISE NOTICE '  Удаленных заказов: %', deleted_count;
    RAISE NOTICE '  Всего заказов: %', active_count + deleted_count;
END $;
