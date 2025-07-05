-- ====================================
-- ПРОВЕРКА СОСТОЯНИЯ EXCEL IMPORT БД
-- ====================================

-- Проверяем общее состояние таблиц
SELECT 'excel_imports' as table_name, COUNT(*) as total_records FROM excel_imports
UNION ALL
SELECT 'excel_data' as table_name, COUNT(*) as total_records FROM excel_data
UNION ALL  
SELECT 'import_filters' as table_name, COUNT(*) as total_records FROM import_filters
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as total_records FROM orders;

-- Последние импорты
SELECT 
    id,
    original_filename,
    status,
    rows_count,
    headers_count,
    imported_to_orders,
    created_at,
    error_message
FROM excel_imports 
ORDER BY created_at DESC 
LIMIT 5;

-- Детали последнего импорта
WITH last_import AS (
    SELECT id FROM excel_imports ORDER BY created_at DESC LIMIT 1
)
SELECT 
    'Информация о последнем импорте' as info,
    ei.original_filename,
    ei.status,
    ei.rows_count,
    ei.headers_count,
    COUNT(ed.id) as total_cells_saved
FROM excel_imports ei
LEFT JOIN excel_data ed ON ei.id = ed.excel_import_id
WHERE ei.id = (SELECT id FROM last_import)
GROUP BY ei.id, ei.original_filename, ei.status, ei.rows_count, ei.headers_count;

-- Превью данных последнего импорта
WITH last_import AS (
    SELECT id FROM excel_imports ORDER BY created_at DESC LIMIT 1
)
SELECT 
    row_number,
    column_name,
    cell_value,
    data_type
FROM excel_data ed
WHERE ed.excel_import_id = (SELECT id FROM last_import)
AND ed.row_number <= 3
ORDER BY ed.row_number, ed.column_name;

-- Заказы, созданные из Excel импорта (по времени)
SELECT 
    'Недавно созданные заказы' as info,
    id,
    "drawingNumber",
    quantity,
    deadline,
    priority,
    "workType",
    status,
    "createdAt"
FROM orders 
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Статистика по фильтрам
SELECT 
    name,
    target_table,
    is_active,
    created_at
FROM import_filters
ORDER BY created_at DESC;

-- Проверка файлов на диске (через функцию если есть)
SELECT 
    id,
    filename,
    file_path,
    file_size,
    CASE 
        WHEN file_path IS NOT NULL AND LENGTH(file_path) > 0 
        THEN 'Путь указан' 
        ELSE 'Путь отсутствует' 
    END as file_status
FROM excel_imports
ORDER BY created_at DESC;
