-- 🔧 Создание тестовых пользователей с правильными хешами паролей

-- Примечание: Эти хеши созданы для паролей:
-- "password123" -> $2a$10$rKJHZ0XqpzQs2nrSsChI8O8u/zJLYrQqf1VKpGJBo6Vj5YmDhJfNG
-- "admin123" -> $2a$10$kBhZJC1oL9P8bXq7dQF9k.F9L5cVzA8sG7pM3kF2nY5xH8dB9mW4O
-- "user123" -> $2a$10$yA5fKL9pN2mQ3rR8sG6hO.L7dX8cM9qP5wN4kJ7mF3yB2aZ9vT6s

-- 1. Создать несколько тестовых пользователей для полного тестирования
INSERT INTO users (username, password, role, "isActive") VALUES
-- Обычные пользователи
('testuser1', '$2a$10$rKJHZ0XqpzQs2nrSsChI8O8u/zJLYrQqf1VKpGJBo6Vj5YmDhJfNG', 'user', true),
('testuser2', '$2a$10$rKJHZ0XqpzQs2nrSsChI8O8u/zJLYrQqf1VKpGJBo6Vj5YmDhJfNG', 'user', true),
('demouser', '$2a$10$yA5fKL9pN2mQ3rR8sG6hO.L7dX8cM9qP5wN4kJ7mF3yB2aZ9vT6s', 'user', true),

-- Админы
('testadmin', '$2a$10$kBhZJC1oL9P8bXq7dQF9k.F9L5cVzA8sG7pM3kF2nY5xH8dB9mW4O', 'admin', true),
('demoadmin', '$2a$10$kBhZJC1oL9P8bXq7dQF9k.F9L5cVzA8sG7pM3kF2nY5xH8dB9mW4O', 'admin', true),

-- Неактивный пользователь для тестирования
('inactiveuser', '$2a$10$rKJHZ0XqpzQs2nrSsChI8O8u/zJLYrQqf1VKpGJBo6Vj5YmDhJfNG', 'user', false);

-- 2. Показать созданных пользователей
SELECT 
  id, 
  username, 
  role, 
  "isActive",
  "createdAt",
  CASE 
    WHEN username LIKE 'test%' OR username LIKE 'demo%' THEN 'Тестовый пользователь'
    WHEN username = 'kasuf' THEN 'Главный админ'
    ELSE 'Обычный пользователь'
  END as user_type
FROM users 
ORDER BY "createdAt" DESC;

-- 3. Создать представление для удобного просмотра пользователей
CREATE OR REPLACE VIEW users_summary AS
SELECT 
  id,
  username,
  role,
  "isActive" as active,
  DATE("createdAt") as created_date,
  AGE(NOW(), "createdAt") as account_age
FROM users
ORDER BY "createdAt" DESC;

-- Теперь можно использовать: SELECT * FROM users_summary;

-- 4. Функция для проверки правильности паролей (только для разработки)
-- Не выполняйте в продакшене!
-- 
-- SELECT username, 
--        CASE 
--          WHEN password = '$2a$10$rKJHZ0XqpzQs2nrSsChI8O8u/zJLYrQqf1VKpGJBo6Vj5YmDhJfNG' 
--          THEN 'password123'
--          WHEN password = '$2a$10$kBhZJC1oL9P8bXq7dQF9k.F9L5cVzA8sG7pM3kF2nY5xH8dB9mW4O' 
--          THEN 'admin123'
--          WHEN password = '$2a$10$yA5fKL9pN2mQ3rR8sG6hO.L7dX8cM9qP5wN4kJ7mF3yB2aZ9vT6s' 
--          THEN 'user123'
--          ELSE 'unknown'
--        END as probable_password
-- FROM users;

-- 5. Очистить тестовых пользователей (когда тестирование закончено)
-- DELETE FROM users WHERE username LIKE 'test%' OR username LIKE 'demo%' OR username = 'inactiveuser';
