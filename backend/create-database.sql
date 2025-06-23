-- Создание базы данных thewho для CRM системы
-- Выполните этот скрипт в pgAdmin или psql

-- 1. Создание базы данных (если не существует)
-- ВАЖНО: Этот запрос нужно выполнить подключившись к базе postgres
SELECT 'CREATE DATABASE thewho'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'thewho')\gexec

-- 2. Подключитесь к базе данных thewho и выполните следующие команды:

-- Создание расширений (если нужны)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Проверка подключения
SELECT 'База данных thewho готова к использованию!' as status,
       current_database() as database_name,
       current_user as user_name,
       version() as postgresql_version;

-- Информация о базе данных
SELECT 
    pg_database.datname as database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database 
WHERE datname = 'thewho';

COMMENT ON DATABASE thewho IS 'Production CRM Database - База данных для системы управления производством';
