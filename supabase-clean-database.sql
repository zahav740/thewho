-- ===============================================
-- СКРИПТ ПОЛНОЙ ОЧИСТКИ БАЗЫ ДАННЫХ SUPABASE
-- ===============================================
-- ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные!
-- Сделайте резервную копию перед выполнением!
-- ===============================================

BEGIN;

-- Отключаем RLS для безопасного удаления
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END
$$;

-- Удаляем все политики RLS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END
$$;

-- Удаляем представления
DROP VIEW IF EXISTS orders_with_operations CASCADE;
DROP VIEW IF EXISTS planning_details CASCADE;

-- Удаляем функции
DROP FUNCTION IF EXISTS get_machine_load_by_day(TEXT, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS check_planning_conflicts(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Удаляем все пользовательские таблицы
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'auth%' 
            AND tablename NOT LIKE 'storage%'
            AND tablename NOT LIKE 'realtime%'
            AND tablename NOT LIKE 'supabase%'
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END
$$;

-- Удаляем storage объекты (если есть)
DELETE FROM storage.objects WHERE bucket_id = 'pdf_files';

-- Удаляем storage политики
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
            AND tablename = 'objects'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END
$$;

-- Очищаем последовательности (sequences)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END
$$;

-- Удаляем пользовательские типы
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'  -- enum types
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END
$$;

-- Обновляем статистику
ANALYZE;

COMMIT;

-- Проверка очистки
SELECT 
    'Таблицы' as type,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'auth%' 
    AND tablename NOT LIKE 'storage%'
    AND tablename NOT LIKE 'realtime%'
    AND tablename NOT LIKE 'supabase%'

UNION ALL

SELECT 
    'Представления' as type,
    COUNT(*) as count
FROM pg_views 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Функции' as type,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'auth%'
    AND routine_name NOT LIKE 'storage%';

-- Сообщение о завершении
SELECT 'База данных полностью очищена! Теперь можно выполнять supabase-new-schema.sql' as status;
