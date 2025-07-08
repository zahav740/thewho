-- Создание таблицы users для системы аутентификации
-- Выполните этот скрипт в вашей базе данных

-- Удаляем таблицу если существует (осторожно!)
-- DROP TABLE IF EXISTS users;

-- Создаем таблицу users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users("isActive");

-- Функция для автоматического обновления updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updatedAt
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Вставляем тестовых пользователей (пароли захэшированы bcrypt с 10 раундами)
-- Пароли: kasuf123, admin123, user123
INSERT INTO users (username, password, role) VALUES 
('kasuf', '$2a$10$YourHashedPasswordHere1', 'admin'),
('admin', '$2a$10$YourHashedPasswordHere2', 'admin'),
('user', '$2a$10$YourHashedPasswordHere3', 'user')
ON CONFLICT (username) DO NOTHING;

-- Проверяем что таблица создана
SELECT 'Users table created successfully' AS result;
SELECT COUNT(*) as user_count FROM users;
