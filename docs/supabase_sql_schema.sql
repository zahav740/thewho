-- Таблица заказов
CREATE TABLE public.orders (
    id uuid PRIMARY KEY,
    drawing_number text NOT NULL,
    deadline timestamp with time zone NOT NULL,
    quantity integer NOT NULL,
    priority integer NOT NULL,
    pdf_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Индексы для заказов
CREATE INDEX idx_orders_drawing_number ON public.orders USING btree (drawing_number);
CREATE INDEX idx_orders_deadline ON public.orders USING btree (deadline);

-- Таблица операций
CREATE TABLE public.operations (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sequence_number integer NOT NULL,
    machine text,
    operation_type text NOT NULL,
    estimated_time numeric NOT NULL,
    completed_units integer,
    actual_time numeric,
    status text NOT NULL,
    operators text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Индексы для операций
CREATE INDEX idx_operations_order_id ON public.operations USING btree (order_id);
CREATE INDEX idx_operations_machine ON public.operations USING btree (machine);
CREATE INDEX idx_operations_status ON public.operations USING btree (status);

-- Таблица планирования
CREATE TABLE public.planning (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    machine text NOT NULL,
    planned_start_date timestamp with time zone NOT NULL,
    planned_end_date timestamp with time zone NOT NULL,
    quantity_assigned integer NOT NULL,
    remaining_quantity integer NOT NULL,
    expected_time_minutes numeric NOT NULL,
    setup_time_minutes numeric NOT NULL,
    buffer_time_minutes numeric NOT NULL,
    status text NOT NULL,
    last_rescheduled_at timestamp with time zone,
    rescheduled_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Индексы для планирования
CREATE INDEX idx_planning_order_id ON public.planning USING btree (order_id);
CREATE INDEX idx_planning_operation_id ON public.planning USING btree (operation_id);
CREATE INDEX idx_planning_machine ON public.planning USING btree (machine);
CREATE INDEX idx_planning_planned_start_date ON public.planning USING btree (planned_start_date);
CREATE INDEX idx_planning_planned_end_date ON public.planning USING btree (planned_end_date);
CREATE INDEX idx_planning_status ON public.planning USING btree (status);

-- Триггеры для обновления updated_at

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для заказов
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Триггер для операций
CREATE TRIGGER update_operations_updated_at
BEFORE UPDATE ON public.operations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Триггер для планирования
CREATE TRIGGER update_planning_updated_at
BEFORE UPDATE ON public.planning
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Разрешения для Storage
-- Создаем бакет для PDF-файлов
-- ПРИМЕЧАНИЕ: Эту часть нужно выполнить через интерфейс Supabase
/* 
В интерфейсе Supabase:
1. Перейдите в раздел Storage
2. Создайте новый бакет "pdf_files"
3. Настройте разрешения:
   - Policy для uploads: только авторизованные пользователи
   - Policy для downloads: публичное чтение
*/

-- Разрешения на таблицы для авторизованных пользователей
-- ПРИМЕЧАНИЕ: Эту часть также нужно выполнить через интерфейс Supabase
/*
В интерфейсе Supabase:
1. Перейдите в раздел Authentication -> Policies
2. Для каждой таблицы (orders, operations, planning) создайте политики:
   - INSERT: для авторизованных пользователей
   - SELECT: для авторизованных пользователей
   - UPDATE: для авторизованных пользователей
   - DELETE: для авторизованных пользователей
*/
