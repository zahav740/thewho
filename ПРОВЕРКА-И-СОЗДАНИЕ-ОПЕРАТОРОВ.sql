-- Проверка и создание таблицы операторов (с обработкой ошибок)

-- Проверяем, существует ли таблица
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operators') THEN
        RAISE NOTICE 'Таблица operators не найдена. Создаем...';
        
        -- Создаем таблицу операторов
        CREATE TABLE operators (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          "isActive" BOOLEAN DEFAULT true,
          "operatorType" VARCHAR(50) DEFAULT 'BOTH',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );

        -- Создаем индексы
        CREATE INDEX idx_operators_active ON operators ("isActive");
        CREATE INDEX idx_operators_type ON operators ("operatorType");

        -- Добавляем комментарии
        COMMENT ON TABLE operators IS 'Таблица операторов для смен';
        COMMENT ON COLUMN operators."operatorType" IS 'Тип оператора: SETUP (наладка), PRODUCTION (производство), BOTH (все)';
        
        RAISE NOTICE 'Таблица operators создана успешно!';
    ELSE
        RAISE NOTICE 'Таблица operators уже существует.';
    END IF;
END $$;

-- Добавляем начальных операторов (если их нет)
INSERT INTO operators (name, "operatorType") VALUES 
('Denis', 'BOTH'),
('Andrey', 'BOTH'),
('Daniel', 'BOTH'),
('Slava', 'BOTH'),
('Kirill', 'BOTH'),
('Аркадий', 'PRODUCTION')
ON CONFLICT (name) DO NOTHING;

-- Проверяем результат
SELECT 
    'Операторы в БД:' as status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_count
FROM operators;

-- Показываем всех операторов
SELECT 
    id,
    name,
    "operatorType",
    "isActive",
    "createdAt"
FROM operators 
ORDER BY name;
