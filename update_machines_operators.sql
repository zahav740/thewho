-- Обновление названий станков и операторов для TheWho CRM
-- Выполнить: psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.kukqacmzfmzepdfddppl -d postgres -f update_machines_operators.sql

-- Сначала посмотрим что есть в базе
SELECT 'Текущие станки:' as info;
SELECT id, name, type, axes FROM machines;

SELECT 'Текущие операторы:' as info;
SELECT id, name, type, active FROM operators;

-- Обновляем фрезерные станки
-- 3х-4х осевые фрезерные
UPDATE machines SET 
    name = 'Doosan Yashana',
    type = 'MILLING',
    axes = 4
WHERE id = 1;

UPDATE machines SET 
    name = 'Doosan Hadasha',
    type = 'MILLING', 
    axes = 4
WHERE id = 2;

UPDATE machines SET 
    name = 'Doosan 3',
    type = 'MILLING',
    axes = 3
WHERE id = 3;

UPDATE machines SET 
    name = 'Pinnacle Gdola',
    type = 'MILLING',
    axes = 4
WHERE id = 4;

-- 3х осевой фрезерный
UPDATE machines SET 
    name = 'Mitsubishi',
    type = 'MILLING',
    axes = 3
WHERE id = 5;

-- Если нужно добавить токарные станки (если их нет)
INSERT INTO machines (name, type, axes, available, created_at, updated_at) 
VALUES 
    ('JohnFord', 'TURNING', 2, true, NOW(), NOW()),
    ('Okuma', 'TURNING', 2, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
    type = EXCLUDED.type,
    axes = EXCLUDED.axes,
    updated_at = NOW();

-- Обновляем операторов
-- Сначала очищаем старых операторов
DELETE FROM operators;

-- Добавляем новых операторов
INSERT INTO operators (name, type, active, shift, created_at, updated_at) VALUES
    ('Denis', 'PRODUCTION', true, 'DAY', NOW(), NOW()),
    ('Daniel', 'PRODUCTION', true, 'DAY', NOW(), NOW()),
    ('Andrey', 'PRODUCTION', true, 'DAY', NOW(), NOW()),
    ('Kirill', 'SETUP', true, 'DAY', NOW(), NOW()),
    ('Slava', 'PRODUCTION', true, 'DAY', NOW(), NOW()),
    ('Arkady', 'PRODUCTION', true, 'NIGHT', NOW(), NOW());

-- Проверяем результат
SELECT 'Обновленные станки:' as info;
SELECT id, name, type, axes, available FROM machines ORDER BY id;

SELECT 'Обновленные операторы:' as info;  
SELECT id, name, type, active, shift FROM operators ORDER BY name;

-- Показываем статистику
SELECT 'Статистика станков:' as info;
SELECT 
    type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as names
FROM machines 
GROUP BY type;

SELECT 'Статистика операторов:' as info;
SELECT 
    type,
    shift,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as names
FROM operators 
GROUP BY type, shift
ORDER BY type, shift;
