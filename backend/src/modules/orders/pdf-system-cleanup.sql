-- ================================================
-- PDF СИСТЕМА - ОЧИСТКА И ПОДГОТОВКА К НОВОЙ АРХИТЕКТУРЕ
-- ================================================
-- Этот скрипт очищает старые PDF данные и подготавливает БД к новой системе
-- с организацией файлов по папкам номера чертежа
-- ================================================

-- 1. Очистить старые пути к PDF файлам в заказах
UPDATE orders 
SET pdf_path = NULL 
WHERE pdf_path IS NOT NULL 
  AND (
    pdf_path NOT LIKE '%/%' OR                          -- Старый формат без папок
    pdf_path LIKE '%.tmp' OR                            -- Временные файлы
    pdf_path LIKE '%temp%' OR                           -- Временные файлы
    LENGTH(pdf_path) < 5                                -- Слишком короткие пути
  );

-- 2. Очистить таблицу file_hashes от старых записей
DELETE FROM file_hashes 
WHERE file_path IS NULL 
   OR file_path = '' 
   OR file_path NOT LIKE '%/%'                          -- Только новый формат drawingNumber/filename
   OR LENGTH(file_path) < 10;                           -- Минимальная длина пути

-- 3. Очистить таблицу pdf_revisions от старых записей  
DELETE FROM pdf_revisions 
WHERE file_path IS NULL 
   OR file_path = ''
   OR file_path NOT LIKE '%/%'                          -- Только новый формат
   OR LENGTH(file_path) < 10;

-- 4. Проверить и исправить связи между таблицами
-- Удалить записи file_hashes без связанных заказов
DELETE FROM file_hashes 
WHERE order_id NOT IN (SELECT id FROM orders);

-- Удалить записи pdf_revisions без связанных заказов
DELETE FROM pdf_revisions 
WHERE order_id NOT IN (SELECT id FROM orders);

-- 5. Очистить заказы, у которых есть pdf_path, но нет записи в file_hashes
UPDATE orders 
SET pdf_path = NULL 
WHERE pdf_path IS NOT NULL 
  AND id NOT IN (
    SELECT DISTINCT order_id 
    FROM file_hashes 
    WHERE order_id IS NOT NULL
  );

-- 6. Добавить индексы для улучшения производительности (если их нет)
CREATE INDEX IF NOT EXISTS idx_file_hashes_drawing_number ON file_hashes(drawing_number);
CREATE INDEX IF NOT EXISTS idx_file_hashes_file_hash ON file_hashes(file_hash);
CREATE INDEX IF NOT EXISTS idx_file_hashes_order_id ON file_hashes(order_id);
CREATE INDEX IF NOT EXISTS idx_pdf_revisions_order_id ON pdf_revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_pdf_path ON orders(pdf_path);
CREATE INDEX IF NOT EXISTS idx_orders_drawing_number ON orders(drawing_number);

-- 7. Проверить и исправить типы данных
-- Убедиться, что file_size имеет правильный тип
ALTER TABLE file_hashes ALTER COLUMN file_size TYPE BIGINT;
ALTER TABLE pdf_revisions ALTER COLUMN file_size TYPE BIGINT;

-- 8. Добавить ограничения для обеспечения целостности данных (если их нет)
-- Убедиться, что drawing_number не пустой в file_hashes
ALTER TABLE file_hashes ADD CONSTRAINT chk_drawing_number_not_empty 
CHECK (drawing_number IS NOT NULL AND LENGTH(TRIM(drawing_number)) > 0);

-- Убедиться, что file_hash не пустой
ALTER TABLE file_hashes ADD CONSTRAINT chk_file_hash_not_empty 
CHECK (file_hash IS NOT NULL AND LENGTH(TRIM(file_hash)) = 32);

-- Убедиться, что file_path имеет правильный формат (drawingNumber/filename)
ALTER TABLE file_hashes ADD CONSTRAINT chk_file_path_format 
CHECK (file_path IS NOT NULL AND file_path LIKE '%/%' AND LENGTH(file_path) > 5);

-- 9. Создать функцию для проверки валидности PDF пути
CREATE OR REPLACE FUNCTION is_valid_pdf_path(path TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Проверяем, что путь имеет формат drawingNumber/filename.pdf
  RETURN path IS NOT NULL 
    AND path LIKE '%/%' 
    AND path LIKE '%.pdf' 
    AND LENGTH(path) > 10
    AND array_length(string_to_array(path, '/'), 1) = 2;
END;
$$ LANGUAGE plpgsql;

-- 10. Создать представление для получения информации о PDF файлах
CREATE OR REPLACE VIEW pdf_files_info AS
SELECT 
  o.id as order_id,
  o.drawing_number,
  o.pdf_path,
  fh.file_hash,
  fh.filename,
  fh.original_name,
  fh.file_size,
  fh.created_at as uploaded_at,
  CASE 
    WHEN o.pdf_path IS NOT NULL AND is_valid_pdf_path(o.pdf_path) THEN 'valid'
    WHEN o.pdf_path IS NOT NULL THEN 'invalid_format'
    ELSE 'no_pdf'
  END as pdf_status,
  (SELECT COUNT(*) FROM pdf_revisions pr WHERE pr.order_id = o.id) as revision_count
FROM orders o
LEFT JOIN file_hashes fh ON fh.order_id = o.id
ORDER BY o.id;

-- 11. Создать функцию для очистки устаревших PDF файлов
CREATE OR REPLACE FUNCTION cleanup_orphaned_pdf_records()
RETURNS TABLE(
  deleted_file_hashes INTEGER,
  deleted_pdf_revisions INTEGER,
  cleared_order_paths INTEGER
) AS $$
DECLARE
  deleted_fh INTEGER := 0;
  deleted_pr INTEGER := 0;
  cleared_op INTEGER := 0;
BEGIN
  -- Удаляем записи file_hashes без связанных заказов
  DELETE FROM file_hashes WHERE order_id NOT IN (SELECT id FROM orders);
  GET DIAGNOSTICS deleted_fh = ROW_COUNT;
  
  -- Удаляем записи pdf_revisions без связанных заказов
  DELETE FROM pdf_revisions WHERE order_id NOT IN (SELECT id FROM orders);
  GET DIAGNOSTICS deleted_pr = ROW_COUNT;
  
  -- Очищаем пути в заказах, для которых нет файлов
  UPDATE orders SET pdf_path = NULL 
  WHERE pdf_path IS NOT NULL 
    AND id NOT IN (SELECT DISTINCT order_id FROM file_hashes WHERE order_id IS NOT NULL);
  GET DIAGNOSTICS cleared_op = ROW_COUNT;
  
  RETURN QUERY SELECT deleted_fh, deleted_pr, cleared_op;
END;
$$ LANGUAGE plpgsql;

-- 12. Создать функцию для получения статистики PDF файлов
CREATE OR REPLACE FUNCTION get_pdf_statistics()
RETURNS TABLE(
  total_orders INTEGER,
  orders_with_pdf INTEGER,
  total_pdf_files INTEGER,
  total_pdf_size BIGINT,
  unique_drawing_numbers INTEGER,
  total_revisions INTEGER,
  avg_file_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM orders) as total_orders,
    (SELECT COUNT(*)::INTEGER FROM orders WHERE pdf_path IS NOT NULL) as orders_with_pdf,
    (SELECT COUNT(*)::INTEGER FROM file_hashes) as total_pdf_files,
    (SELECT COALESCE(SUM(file_size), 0) FROM file_hashes) as total_pdf_size,
    (SELECT COUNT(DISTINCT drawing_number)::INTEGER FROM file_hashes) as unique_drawing_numbers,
    (SELECT COUNT(*)::INTEGER FROM pdf_revisions) as total_revisions,
    (SELECT ROUND((COALESCE(AVG(file_size), 0) / 1024.0 / 1024.0)::NUMERIC, 2) FROM file_hashes) as avg_file_size_mb;
END;
$$ LANGUAGE plpgsql;

-- 13. Создать триггер для автоматической очистки связанных записей при удалении заказа
CREATE OR REPLACE FUNCTION cleanup_order_pdf_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Удаляем связанные записи из file_hashes
  DELETE FROM file_hashes WHERE order_id = OLD.id;
  
  -- Удаляем связанные записи из pdf_revisions  
  DELETE FROM pdf_revisions WHERE order_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер (если его еще нет)
DROP TRIGGER IF EXISTS trigger_cleanup_order_pdf_data ON orders;
CREATE TRIGGER trigger_cleanup_order_pdf_data
  BEFORE DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_order_pdf_data();

-- ================================================
-- ВЫПОЛНЕНИЕ ОЧИСТКИ И ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ================================================

-- Выполняем очистку устаревших записей
SELECT * FROM cleanup_orphaned_pdf_records();

-- Получаем статистику после очистки
SELECT * FROM get_pdf_statistics();

-- Проверяем состояние данных
SELECT 
  pdf_status,
  COUNT(*) as count
FROM pdf_files_info 
GROUP BY pdf_status
ORDER BY pdf_status;

-- Показываем заказы с некорректными PDF путями (для ручной проверки)
SELECT 
  id,
  drawing_number,
  pdf_path,
  'Некорректный формат пути' as issue
FROM orders 
WHERE pdf_path IS NOT NULL 
  AND NOT is_valid_pdf_path(pdf_path)
LIMIT 10;

-- ================================================
-- СООБЩЕНИЯ О ЗАВЕРШЕНИИ
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PDF система подготовлена к новой архитектуре';
  RAISE NOTICE '📁 Файлы теперь организованы по папкам: uploads/pdf/{drawingNumber}/{filename}';
  RAISE NOTICE '🔍 Добавлены индексы для улучшения производительности';
  RAISE NOTICE '🛡️ Добавлены ограничения для обеспечения целостности данных';
  RAISE NOTICE '📊 Созданы функции для мониторинга и статистики';
  RAISE NOTICE '🔄 Добавлены триггеры для автоматической очистки';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Для проверки статистики выполните: SELECT * FROM get_pdf_statistics();';
  RAISE NOTICE '🧹 Для очистки устаревших записей выполните: SELECT * FROM cleanup_orphaned_pdf_records();';
  RAISE NOTICE '📈 Для просмотра информации о PDF: SELECT * FROM pdf_files_info LIMIT 10;';
END $$;
