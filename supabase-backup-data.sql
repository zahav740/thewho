-- ===============================================
-- СКРИПТ РЕЗЕРВНОГО КОПИРОВАНИЯ ДАННЫХ
-- ===============================================
-- Выполните этот скрипт ПЕРЕД очисткой базы данных
-- ===============================================

-- Проверяем существующие таблицы
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY live_rows DESC;

-- ===============================================
-- ЭКСПОРТ ДАННЫХ В JSON FORMAT
-- ===============================================

-- Экспорт заказов
SELECT json_agg(
    json_build_object(
        'id', id,
        'name', name,
        'client_name', client_name,
        'drawing_number', drawing_number,
        'deadline', deadline,
        'quantity', quantity,
        'priority', priority,
        'pdf_url', pdf_url,
        'created_at', created_at,
        'updated_at', updated_at
    )
) as orders_backup
FROM orders;

-- Экспорт операций
SELECT json_agg(
    json_build_object(
        'id', id,
        'order_id', order_id,
        'sequence_number', sequence_number,
        'machine', machine,
        'operation_type', operation_type,
        'estimated_time', estimated_time,
        'completed_units', completed_units,
        'actual_time', actual_time,
        'status', status,
        'operators', operators,
        'created_at', created_at,
        'updated_at', updated_at
    )
) as operations_backup
FROM operations;

-- Экспорт планирования (старая таблица)
SELECT json_agg(
    json_build_object(
        'id', id,
        'order_id', order_id,
        'operation_id', operation_id,
        'machine', machine,
        'planned_start_date', planned_start_date,
        'planned_end_date', planned_end_date,
        'quantity_assigned', quantity_assigned,
        'remaining_quantity', remaining_quantity,
        'expected_time_minutes', expected_time_minutes,
        'setup_time_minutes', setup_time_minutes,
        'buffer_time_minutes', buffer_time_minutes,
        'status', status,
        'last_rescheduled_at', last_rescheduled_at,
        'rescheduled_reason', rescheduled_reason
    )
) as planning_backup
FROM planning_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planning_result');

-- Экспорт планирования (новая таблица)
SELECT json_agg(
    json_build_object(
        'id', id,
        'order_id', order_id,
        'operation_id', operation_id,
        'machine', machine,
        'planned_start_date', planned_start_date,
        'planned_end_date', planned_end_date,
        'quantity_assigned', quantity_assigned,
        'remaining_quantity', remaining_quantity,
        'expected_time_minutes', expected_time_minutes,
        'setup_time_minutes', setup_time_minutes,
        'buffer_time_minutes', buffer_time_minutes,
        'status', status,
        'last_rescheduled_at', last_rescheduled_at,
        'rescheduled_reason', rescheduled_reason
    )
) as planning_results_backup
FROM planning_results
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planning_results');

-- Экспорт смен
SELECT json_agg(
    json_build_object(
        'id', id,
        'date', date,
        'machine', machine,
        'is_night', is_night,
        'operators', operators,
        'operations', operations,
        'setups', setups,
        'created_at', created_at,
        'updated_at', updated_at
    )
) as shifts_backup
FROM shifts
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts');

-- Экспорт наладок
SELECT json_agg(
    json_build_object(
        'id', id,
        'drawing_number', drawing_number,
        'setup_type', setup_type,
        'operation_number', operation_number,
        'time_spent', time_spent,
        'operator', operator,
        'start_time', start_time,
        'date', date,
        'machine', machine,
        'created_at', created_at,
        'updated_at', updated_at
    )
) as setups_backup
FROM setups
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'setups');

-- ===============================================
-- СВОДНАЯ СТАТИСТИКА ДАННЫХ
-- ===============================================

SELECT 
    'СТАТИСТИКА ДАННЫХ ДЛЯ РЕЗЕРВНОГО КОПИРОВАНИЯ' as summary,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM operations) as operations_count,
    (CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planning_result') 
        THEN (SELECT COUNT(*) FROM planning_result)
        ELSE 0 
    END) as planning_result_count,
    (CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planning_results') 
        THEN (SELECT COUNT(*) FROM planning_results)
        ELSE 0 
    END) as planning_results_count,
    (CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts') 
        THEN (SELECT COUNT(*) FROM shifts)
        ELSE 0 
    END) as shifts_count,
    (CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'setups') 
        THEN (SELECT COUNT(*) FROM setups)
        ELSE 0 
    END) as setups_count;

-- ===============================================
-- ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ
-- ===============================================

-- Проверка связей между заказами и операциями
SELECT 
    'Проверка связей заказы-операции' as check_type,
    COUNT(*) as total_operations,
    COUNT(DISTINCT order_id) as unique_orders,
    COUNT(*) - COUNT(order_id) as null_order_ids
FROM operations;

-- Проверка связей планирования с заказами и операциями
SELECT 
    'Проверка связей планирование-заказы-операции' as check_type,
    COUNT(*) as total_planning,
    COUNT(DISTINCT order_id) as unique_orders_in_planning,
    COUNT(DISTINCT operation_id) as unique_operations_in_planning,
    COUNT(*) - COUNT(order_id) as null_order_ids,
    COUNT(*) - COUNT(operation_id) as null_operation_ids
FROM planning_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planning_result')
UNION ALL
SELECT 
    'Проверка связей планирование-заказы-операции (новая)' as check_type,
    COUNT(*) as total_planning,
    COUNT(DISTINCT order_id) as unique_orders_in_planning,
    COUNT(DISTINCT operation_id) as unique_operations_in_planning,
    COUNT(*) - COUNT(order_id) as null_order_ids,
    COUNT(*) - COUNT(operation_id) as null_operation_ids
FROM planning_results
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planning_results');

-- ===============================================
-- ИНСТРУКЦИИ ПО СОХРАНЕНИЮ
-- ===============================================

SELECT 
'ИНСТРУКЦИИ ПО РЕЗЕРВНОМУ КОПИРОВАНИЮ:

1. Скопируйте результаты каждого запроса выше в отдельные файлы:
   - orders_backup.json
   - operations_backup.json
   - planning_backup.json (или planning_results_backup.json)
   - shifts_backup.json
   - setups_backup.json

2. Или выполните в консоли браузера:
   ```javascript
   // Автоматическое сохранение
   import { loadFromSupabase } from "./src/utils/supabaseClient";
   const backup = await loadFromSupabase();
   const blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"});
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = `theWho-backup-${new Date().toISOString().split("T")[0]}.json`;
   a.click();
   ```

3. После сохранения можно выполнять supabase-clean-database.sql

4. После очистки выполните supabase-new-schema.sql

5. Восстановите данные через syncWithSupabase()

ВАЖНО: Сохраните эти данные в безопасном месте!' as instructions;
