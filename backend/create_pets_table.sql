-- Migration для создания таблицы pets (FindThePuppy)
-- Дата: 2025-05-30
-- Описание: Создание таблицы для объявлений о животных

-- Создание enum типов
CREATE TYPE pet_type AS ENUM ('lost', 'found');
CREATE TYPE pet_status AS ENUM ('active', 'resolved', 'closed');
CREATE TYPE animal_size AS ENUM ('small', 'medium', 'large');

-- Создание таблицы pets
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type pet_type NOT NULL DEFAULT 'lost',
    status pet_status NOT NULL DEFAULT 'active',
    
    -- Информация о животном
    "animalType" VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(50),
    age INTEGER,
    size animal_size,
    
    -- Геолокация
    "lastSeenLatitude" DECIMAL(10,8),
    "lastSeenLongitude" DECIMAL(11,8),
    "lastSeenAddress" TEXT,
    
    -- Контактная информация
    "contactPhone" VARCHAR(20),
    "contactEmail" VARCHAR(100),
    "preferredContact" VARCHAR(10) DEFAULT 'both',
    
    -- Изображения (массив строк)
    images TEXT[] DEFAULT '{}',
    
    -- Вознаграждение
    reward DECIMAL(10,2),
    
    -- Пользователь
    "userId" VARCHAR(100) NOT NULL,
    "userName" VARCHAR(100) NOT NULL,
    
    -- Временные метки
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Создание индексов для оптимизации поиска
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_animal_type ON pets("animalType");
CREATE INDEX idx_pets_created_at ON pets("createdAt");
CREATE INDEX idx_pets_user_id ON pets("userId");

-- Индекс для геопоиска
CREATE INDEX idx_pets_location ON pets("lastSeenLatitude", "lastSeenLongitude");

-- Создание триггера для автоматического обновления updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pets_updated_at 
    BEFORE UPDATE ON pets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление тестовых данных
INSERT INTO pets (title, description, type, "animalType", breed, color, age, size, "lastSeenLatitude", "lastSeenLongitude", "lastSeenAddress", "contactPhone", "contactEmail", "userId", "userName", reward) VALUES
('Пропала собака Лаки', 'Потерялась рыжая собака породы золотистый ретривер. Очень дружелюбная, откликается на кличку Лаки. Была в синем ошейнике.', 'lost', 'собака', 'Золотистый ретривер', 'рыжий', 3, 'large', 55.7558, 37.6176, 'Москва, район Сокольники', '+7-900-123-4567', 'owner@example.com', 'user1', 'Анна Иванова', 5000.00),

('Найден кот', 'Найден серый кот с белыми лапками возле метро Чистые пруды. Ухоженный, видимо домашний. Ищем хозяев.', 'found', 'кот', 'Британская короткошёрстная', 'серый с белым', 2, 'medium', 55.7658, 37.6386, 'Москва, Чистые пруды', '+7-900-765-4321', 'finder@example.com', 'user2', 'Петр Сидоров', NULL),

('Пропал попугай Кеша', 'Вчера вечером вылетел из окна попугай корелла. Серый с желтым хохолком, говорит несколько слов.', 'lost', 'птица', 'Корелла', 'серый с желтым', 1, 'small', 55.7387, 37.6032, 'Москва, Арбат', '+7-900-111-2233', 'parrot@example.com', 'user3', 'Мария Петрова', 2000.00),

('Найдена кошка', 'Найдена молодая кошка трехцветного окраса. Очень ласковая и игривая. Найдена в парке Сокольники.', 'found', 'кот', 'Беспородная', 'трехцветный', 1, 'small', 55.7917, 37.6756, 'Москва, Сокольники', '+7-900-444-5566', 'cat@example.com', 'user4', 'Игорь Козлов', NULL),

('Пропала собака Белка', 'Потерялась маленькая собачка породы джек-рассел-терьер. Белая с коричневыми пятнами. Очень активная.', 'lost', 'собака', 'Джек-рассел-терьер', 'белый с коричневым', 2, 'small', 55.7160, 37.5360, 'Москва, Фили', '+7-900-777-8899', 'dog@example.com', 'user5', 'Елена Смирнова', 3000.00);

-- Комментарий о миграции
COMMENT ON TABLE pets IS 'Таблица объявлений о пропавших и найденных домашних животных для сервиса FindThePuppy';
