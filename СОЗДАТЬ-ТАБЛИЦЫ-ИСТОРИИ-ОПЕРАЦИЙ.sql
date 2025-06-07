-- Создание таблиц для системы истории операций и анализа эффективности
-- Дата создания: 2025-06-07
-- Описание: Таблицы для хранения истории операций, статистики операторов и запросов экспорта

-- 1. Таблица истории операций
CREATE TABLE IF NOT EXISTS operation_history (
  id SERIAL PRIMARY KEY,
  drawing_number VARCHAR(50) NOT NULL,
  operation_id INTEGER NOT NULL,
  operation_number INTEGER NOT NULL,
  operation_type VARCHAR(100) NOT NULL,
  machine_id INTEGER NOT NULL,
  machine_name VARCHAR(100) NOT NULL,
  operator_name VARCHAR(100),
  shift_type VARCHAR(10) CHECK (shift_type IN ('DAY', 'NIGHT')),
  quantity_produced INTEGER NOT NULL DEFAULT 0,
  time_per_unit DECIMAL(10,2),
  setup_time INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  efficiency_rating DECIMAL(5,2) DEFAULT 0,
  date_completed DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_operation_history_drawing_date ON operation_history(drawing_number, date_completed);
CREATE INDEX IF NOT EXISTS idx_operation_history_machine_date ON operation_history(machine_id, date_completed);
CREATE INDEX IF NOT EXISTS idx_operation_history_operator ON operation_history(operator_name, date_completed);

-- 2. Таблица статистики эффективности операторов
CREATE TABLE IF NOT EXISTS operator_efficiency_stats (
  id SERIAL PRIMARY KEY,
  operator_name VARCHAR(100) NOT NULL,
  drawing_number VARCHAR(50) NOT NULL,
  operation_type VARCHAR(100) NOT NULL,
  calculation_date DATE NOT NULL,
  parts_per_hour DECIMAL(8,2) DEFAULT 0,
  plan_vs_fact_percent DECIMAL(5,2) DEFAULT 0,
  average_time_per_part DECIMAL(8,2) DEFAULT 0,
  time_deviation_percent DECIMAL(5,2) DEFAULT 0,
  consistency_rating DECIMAL(5,2) DEFAULT 0,
  working_time_minutes INTEGER DEFAULT 0,
  idle_time_minutes INTEGER DEFAULT 0,
  utilization_efficiency DECIMAL(5,2) DEFAULT 0,
  overall_rating DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Уникальный индекс для предотвращения дублирования
  CONSTRAINT uk_operator_stats UNIQUE (operator_name, drawing_number, calculation_date)
);

-- Индексы для статистики операторов
CREATE INDEX IF NOT EXISTS idx_operator_stats_date ON operator_efficiency_stats(calculation_date);
CREATE INDEX IF NOT EXISTS idx_operator_stats_rating ON operator_efficiency_stats(overall_rating DESC);

-- 3. Таблица запросов экспорта
CREATE TABLE IF NOT EXISTS operation_export_requests (
  id SERIAL PRIMARY KEY,
  drawing_number VARCHAR(50) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  export_type VARCHAR(10) CHECK (export_type IN ('excel', 'pdf', 'csv')),
  file_path TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_by VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Индекс для запросов экспорта
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON operation_export_requests(status, created_at);

-- 4. Комментарии к таблицам
COMMENT ON TABLE operation_history IS 'История выполненных операций с деталями производительности';
COMMENT ON TABLE operator_efficiency_stats IS 'Статистика эффективности операторов по чертежам и датам';
COMMENT ON TABLE operation_export_requests IS 'Журнал запросов на экспорт данных';

-- 5. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_operation_history_updated_at 
    BEFORE UPDATE ON operation_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_efficiency_stats_updated_at 
    BEFORE UPDATE ON operator_efficiency_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Тестовые данные (опционально)
-- INSERT INTO operation_history (
--     drawing_number, operation_id, operation_number, operation_type,
--     machine_id, machine_name, operator_name, shift_type,
--     quantity_produced, time_per_unit, setup_time, total_time,
--     efficiency_rating, date_completed
-- ) VALUES 
-- ('TH1K4108A', 1, 1, 'Токарная обработка', 1, 'Doosan 3', 'Кирилл', 'DAY', 45, 10.5, 30, 502, 95.2, CURRENT_DATE),
-- ('TH1K4108A', 1, 1, 'Токарная обработка', 2, 'Mitsubishi', 'Аркадий', 'NIGHT', 38, 12.8, 45, 531, 87.4, CURRENT_DATE),
-- ('C6HP0021A', 2, 2, 'Фрезерная обработка', 1, 'Doosan 3', 'Андрей', 'DAY', 32, 15.2, 60, 546, 76.8, CURRENT_DATE);

PRINT 'Таблицы для системы истории операций созданы успешно!';
