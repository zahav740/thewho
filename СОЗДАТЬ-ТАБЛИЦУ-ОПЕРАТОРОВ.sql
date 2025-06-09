-- Создание таблицы операторов
CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  "isActive" BOOLEAN DEFAULT true,
  "operatorType" VARCHAR(50) DEFAULT 'BOTH', -- 'SETUP', 'PRODUCTION', 'BOTH'
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Добавляем начальных операторов
INSERT INTO operators (name, "operatorType") VALUES 
('Denis', 'BOTH'),
('Andrey', 'BOTH'),
('Daniel', 'BOTH'),
('Slava', 'BOTH'),
('Kirill', 'BOTH'),
('Аркадий', 'PRODUCTION') -- Специально для ночных смен
ON CONFLICT (name) DO NOTHING;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators ("isActive");
CREATE INDEX IF NOT EXISTS idx_operators_type ON operators ("operatorType");

COMMENT ON TABLE operators IS 'Таблица операторов для смен';
COMMENT ON COLUMN operators."operatorType" IS 'Тип оператора: SETUP (наладка), PRODUCTION (производство), BOTH (все)';
