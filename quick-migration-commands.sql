-- Быстрое применение миграции вручную
-- Скопируйте эти команды и выполните в psql

-- Подключитесь к базе данных:
-- psql -h localhost -p 5432 -U postgres -d thewho

-- Добавляем поля для soft delete:
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "deletedAt" timestamp NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "deletedBy" varchar(100) NULL;

-- Создаем индексы:
CREATE INDEX IF NOT EXISTS idx_orders_not_deleted 
ON orders ("isDeleted") 
WHERE "isDeleted" = false;

CREATE INDEX IF NOT EXISTS idx_orders_drawing_number_all 
ON orders ("drawingNumber");

-- Комментарии:
COMMENT ON COLUMN orders."isDeleted" IS 'Флаг мягкого удаления заказа';
COMMENT ON COLUMN orders."deletedAt" IS 'Дата и время удаления заказа';
COMMENT ON COLUMN orders."deletedBy" IS 'Пользователь, который удалил заказ';

-- Проверяем результат:
\d orders

-- Готово! Теперь перезапустите backend
