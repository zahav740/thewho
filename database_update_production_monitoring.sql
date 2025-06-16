-- =============================================================================
-- ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ ДЛЯ МОНИТОРИНГА ПРОИЗВОДСТВА
-- Дата: 2025-06-12
-- Описание: Добавление полей и индексов для корректной работы системы завершения операций
-- =============================================================================

-- 1. ДОБАВЛЕНИЕ НОВЫХ ПОЛЕЙ В ТАБЛИЦУ OPERATIONS
-- =============================================================================

-- Поле для отслеживания уведомлений о завершении
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS completion_notified BOOLEAN DEFAULT FALSE;

-- Поле для отслеживания последней проверки завершения
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS last_completion_check TIMESTAMP;

-- Комментарий к операции при завершении
ALTER TABLE operations 
ADD COLUMN IF NOT EXISTS completion_comment TEXT;

-- 2. ДОБАВЛЕНИЕ НОВЫХ ПОЛЕЙ В ТАБЛИЦУ SHIFT_RECORDS
-- =============================================================================

-- Поле для отслеживания проверки завершения
ALTER TABLE shift_records 
ADD COLUMN IF NOT EXISTS completion_checked_at TIMESTAMP;

-- Поле для отметки автоматически созданных записей
ALTER TABLE shift_records 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- 3. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- =============================================================================

-- Индекс для быстрого поиска активных смен
CREATE INDEX IF NOT EXISTS idx_shift_records_active 
ON shift_records("operationId", "machineId", archived) 
WHERE archived = false;

-- Индекс для поиска операций требующих проверки завершения
CREATE INDEX IF NOT EXISTS idx_operations_completion_check 
ON operations(status, completion_notified, "assignedMachine") 
WHERE status IN ('IN_PROGRESS', 'ASSIGNED');

-- Составной индекс для запросов прогресса операций
CREATE INDEX IF NOT EXISTS idx_shift_records_progress 
ON shift_records("operationId", "machineId", date, archived);

-- 4. СОЗДАНИЕ ПРЕДСТАВЛЕНИЯ ДЛЯ МОНИТОРИНГА ОПЕРАЦИЙ
-- =============================================================================

-- Представление с агрегированными данными по прогрессу операций
CREATE OR REPLACE VIEW operation_progress_summary AS
SELECT 
    op.id as operation_id,
    op."operationNumber",
    op.operationtype,
    op.status,
    op."assignedMachine" as machine_id,
    m.code as machine_name,
    ord.drawing_number,
    ord.quantity as target_quantity,
    op."actualQuantity" as operation_actual_quantity,
    COALESCE(
        (SELECT SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0))
         FROM shift_records sr 
         WHERE sr."operationId" = op.id 
           AND sr."machineId" = op."assignedMachine" 
           AND sr.archived = false), 
        0
    ) as shift_total_produced,
    COALESCE(
        (SELECT MAX(date)
         FROM shift_records sr 
         WHERE sr."operationId" = op.id 
           AND sr."machineId" = op."assignedMachine" 
           AND sr.archived = false), 
        NULL
    ) as last_shift_date,
    CASE 
        WHEN ord.quantity > 0 AND COALESCE(
            (SELECT SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0))
             FROM shift_records sr 
             WHERE sr."operationId" = op.id 
               AND sr."machineId" = op."assignedMachine" 
               AND sr.archived = false), 
            0
        ) >= ord.quantity THEN true
        ELSE false
    END as is_completed_by_shifts,
    CASE 
        WHEN ord.quantity > 0 THEN 
            ROUND(
                (COALESCE(
                    (SELECT SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0))
                     FROM shift_records sr 
                     WHERE sr."operationId" = op.id 
                       AND sr."machineId" = op."assignedMachine" 
                       AND sr.archived = false), 
                    0
                ) * 100.0 / ord.quantity), 2
            )
        ELSE 0
    END as completion_percentage,
    op."assignedAt",
    op."completedAt",
    op.completion_notified,
    op.last_completion_check
FROM operations op
LEFT JOIN orders ord ON op."orderId" = ord.id
LEFT JOIN machines m ON op."assignedMachine" = m.id
WHERE op.status IN ('IN_PROGRESS', 'ASSIGNED', 'COMPLETED');

-- 5. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОЙ ПРОВЕРКИ ЗАВЕРШЕНИЯ ОПЕРАЦИЙ
-- =============================================================================

-- Функция для проверки и обновления статуса завершенных операций
CREATE OR REPLACE FUNCTION check_operation_completion()
RETURNS TABLE(
    operation_id INTEGER,
    machine_name VARCHAR,
    drawing_number VARCHAR,
    completion_percentage NUMERIC,
    is_completed BOOLEAN
) AS $$
BEGIN
    -- Обновляем время последней проверки для всех активных операций
    UPDATE operations 
    SET last_completion_check = NOW()
    WHERE status IN ('IN_PROGRESS', 'ASSIGNED')
      AND "assignedMachine" IS NOT NULL;

    -- Возвращаем операции, готовые к завершению
    RETURN QUERY
    SELECT 
        ops.operation_id::INTEGER,
        ops.machine_name::VARCHAR,
        ops.drawing_number::VARCHAR,
        ops.completion_percentage::NUMERIC,
        ops.is_completed_by_shifts::BOOLEAN
    FROM operation_progress_summary ops
    WHERE ops.is_completed_by_shifts = true
      AND ops.completion_notified = false
      AND ops.status IN ('IN_PROGRESS', 'ASSIGNED');
END;
$$ LANGUAGE plpgsql;

-- 6. ФУНКЦИЯ ДЛЯ ЗАВЕРШЕНИЯ ОПЕРАЦИИ
-- =============================================================================

-- Функция для завершения операции с сохранением в историю
CREATE OR REPLACE FUNCTION complete_operation(
    p_operation_id INTEGER,
    p_action VARCHAR(20) DEFAULT 'complete', -- 'complete', 'continue', 'plan_new'
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_operation_record RECORD;
    v_shift_total INTEGER;
    v_result JSONB;
BEGIN
    -- Получаем данные операции
    SELECT 
        op.*,
        m.code as machine_name,
        ord.drawing_number,
        ord.quantity as target_quantity
    INTO v_operation_record
    FROM operations op
    LEFT JOIN machines m ON op."assignedMachine" = m.id
    LEFT JOIN orders ord ON op."orderId" = ord.id
    WHERE op.id = p_operation_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Operation not found');
    END IF;

    -- Получаем общее количество из смен
    SELECT COALESCE(SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0)), 0)
    INTO v_shift_total
    FROM shift_records 
    WHERE "operationId" = p_operation_id 
      AND "machineId" = v_operation_record."assignedMachine"
      AND archived = false;

    IF p_action = 'complete' THEN
        -- Завершаем операцию
        UPDATE operations 
        SET 
            status = 'COMPLETED',
            "completedAt" = NOW(),
            "actualQuantity" = GREATEST(v_shift_total, COALESCE("actualQuantity", 0)),
            completion_comment = p_comment,
            completion_notified = true
        WHERE id = p_operation_id;

        -- Архивируем записи смен
        UPDATE shift_records 
        SET 
            archived = true,
            "archivedAt" = NOW()
        WHERE "operationId" = p_operation_id 
          AND "machineId" = v_operation_record."assignedMachine"
          AND archived = false;

        -- Освобождаем станок
        UPDATE machines 
        SET 
            "isOccupied" = false,
            "currentOperation" = NULL,
            "assignedAt" = NOW()
        WHERE id = v_operation_record."assignedMachine";

        v_result = jsonb_build_object(
            'success', true,
            'action', 'completed',
            'operation_id', p_operation_id,
            'total_produced', v_shift_total,
            'machine_freed', true
        );

    ELSIF p_action = 'continue' THEN
        -- Продолжаем операцию, просто отмечаем как уведомленную
        UPDATE operations 
        SET 
            completion_notified = true,
            completion_comment = p_comment
        WHERE id = p_operation_id;

        v_result = jsonb_build_object(
            'success', true,
            'action', 'continued',
            'operation_id', p_operation_id,
            'total_produced', v_shift_total,
            'machine_freed', false
        );

    ELSIF p_action = 'plan_new' THEN
        -- Сбрасываем операцию для нового планирования
        UPDATE operations 
        SET 
            status = 'PENDING',
            "assignedMachine" = NULL,
            "assignedAt" = NULL,
            completion_notified = true,
            completion_comment = p_comment
        WHERE id = p_operation_id;

        -- Архивируем текущие смены с отметкой сброса
        UPDATE shift_records 
        SET 
            archived = true,
            "archivedAt" = NOW(),
            "resetAt" = NOW()
        WHERE "operationId" = p_operation_id 
          AND "machineId" = v_operation_record."assignedMachine"
          AND archived = false;

        -- Освобождаем станок
        UPDATE machines 
        SET 
            "isOccupied" = false,
            "currentOperation" = NULL,
            "assignedAt" = NOW()
        WHERE id = v_operation_record."assignedMachine";

        v_result = jsonb_build_object(
            'success', true,
            'action', 'reset_for_planning',
            'operation_id', p_operation_id,
            'total_produced', v_shift_total,
            'machine_freed', true
        );

    ELSE
        v_result = jsonb_build_object('success', false, 'error', 'Invalid action');
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 7. ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ТЕСТОВЫХ ДАННЫХ
-- =============================================================================

-- Функция для создания тестовых данных смен
CREATE OR REPLACE FUNCTION create_test_shift_data()
RETURNS VOID AS $$
DECLARE
    v_operation RECORD;
BEGIN
    -- Находим активные операции без данных смен
    FOR v_operation IN 
        SELECT op.id, op."assignedMachine", ord.drawing_number
        FROM operations op
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op.status IN ('IN_PROGRESS', 'ASSIGNED')
          AND op."assignedMachine" IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM shift_records sr 
              WHERE sr."operationId" = op.id 
                AND sr."machineId" = op."assignedMachine"
                AND sr.archived = false
          )
    LOOP
        -- Создаем тестовые данные смен
        INSERT INTO shift_records (
            date, "shiftType", "dayShiftQuantity", "nightShiftQuantity",
            "operationId", "machineId", drawingnumber, auto_generated
        ) VALUES 
        (CURRENT_DATE - 2, 'DAY', 
         5 + (RANDOM() * 10)::INTEGER, 
         8 + (RANDOM() * 12)::INTEGER,
         v_operation.id, v_operation."assignedMachine", v_operation.drawing_number, true),
        (CURRENT_DATE - 1, 'DAY', 
         6 + (RANDOM() * 8)::INTEGER, 
         10 + (RANDOM() * 10)::INTEGER,
         v_operation.id, v_operation."assignedMachine", v_operation.drawing_number, true),
        (CURRENT_DATE, 'DAY', 
         4 + (RANDOM() * 6)::INTEGER, 
         7 + (RANDOM() * 8)::INTEGER,
         v_operation.id, v_operation."assignedMachine", v_operation.drawing_number, true);
    END LOOP;
    
    RAISE NOTICE 'Тестовые данные смен созданы';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ИНСТРУКЦИИ ПО ПРИМЕНЕНИЮ:
-- =============================================================================

-- 1. Выполните этот скрипт в вашей базе данных PostgreSQL
-- 2. Проверьте создание новых полей: SELECT * FROM information_schema.columns WHERE table_name IN ('operations', 'shift_records');
-- 3. Проверьте представление: SELECT * FROM operation_progress_summary LIMIT 5;
-- 4. Создайте тестовые данные: SELECT create_test_shift_data();
-- 5. Проверьте функцию завершения: SELECT check_operation_completion();

COMMENT ON VIEW operation_progress_summary IS 'Представление для мониторинга прогресса операций с данными из смен';
COMMENT ON FUNCTION check_operation_completion() IS 'Функция для автоматической проверки завершения операций';
COMMENT ON FUNCTION complete_operation(INTEGER, VARCHAR, TEXT) IS 'Функция для завершения операции с выбором действия';
