-- 🧪 SQL запросы для тестирования системы регистрации

-- 1. Проверить существующих пользователей
SELECT id, username, role, "isActive", "createdAt" 
FROM users 
ORDER BY "createdAt" DESC;

-- 2. Проверить, есть ли админ пользователь kasuf
SELECT * FROM users WHERE username = 'kasuf' AND role = 'admin';

-- 3. Удалить тестового пользователя (если нужно протестировать повторно)
DELETE FROM users WHERE username = 'testuser';

-- 4. Создать тестового пользователя вручную (с хешированным паролем)
-- Примечание: Пароль 'password123' захеширован через bcrypt
INSERT INTO users (username, password, role, "isActive") 
VALUES ('manualuser', '$2a$10$example.hash.here', 'user', true);

-- 5. Проверить количество пользователей по ролям
SELECT role, COUNT(*) as count 
FROM users 
WHERE "isActive" = true 
GROUP BY role;

-- 6. Найти пользователей, созданных за последний час
SELECT id, username, role, "createdAt" 
FROM users 
WHERE "createdAt" > NOW() - INTERVAL '1 hour' 
ORDER BY "createdAt" DESC;

-- 7. Проверить, что username уникален (должно вернуть true)
SELECT CASE 
    WHEN COUNT(DISTINCT username) = COUNT(*) 
    THEN 'Все usernames уникальны'
    ELSE 'Найдены дубликаты!'
END as uniqueness_check
FROM users;

-- 8. Найти неактивных пользователей
SELECT id, username, role, "createdAt" 
FROM users 
WHERE "isActive" = false;

-- 9. Показать самых новых пользователей (топ 5)
SELECT id, username, role, "createdAt" 
FROM users 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- 10. Проверить структуру таблицы users
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 11. Очистить всех тестовых пользователей (ОСТОРОЖНО!)
-- DELETE FROM users WHERE username LIKE 'test%' OR username LIKE 'new%';

-- 12. Создать дополнительных тестовых пользователей
INSERT INTO users (username, password, role, "isActive") VALUES 
('testuser1', '$2a$10$examplehash1', 'user', true),
('testuser2', '$2a$10$examplehash2', 'user', true),
('testadmin1', '$2a$10$examplehash3', 'admin', true);

-- 13. Показать статистику по пользователям
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_users,
    COUNT(CASE WHEN "isActive" = false THEN 1 END) as inactive_users,
    MIN("createdAt") as first_user_created,
    MAX("createdAt") as latest_user_created
FROM users;

-- 14. Обновить роль пользователя (например, сделать пользователя админом)
-- UPDATE users SET role = 'admin' WHERE username = 'testuser';

-- 15. Деактивировать пользователя
-- UPDATE users SET "isActive" = false WHERE username = 'testuser';

-- 16. Реактивировать пользователя
-- UPDATE users SET "isActive" = true WHERE username = 'testuser';
