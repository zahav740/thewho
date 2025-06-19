#!/bin/bash

# Скрипт обновления станков и операторов
echo "🔧 Обновление станков и операторов TheWho CRM..."

# Создаем SQL файл на сервере
cat > update_machines_operators.sql << 'EOF'
-- Обновление названий станков и операторов для TheWho CRM

-- Посмотрим что есть в базе
SELECT 'Текущие станки:' as info;
SELECT id, name, type, axes FROM machines ORDER BY id;

SELECT 'Текущие операторы:' as info;
SELECT id, name, type, active FROM operators ORDER BY id;

-- Обновляем фрезерные станки
-- 3х-4х осевые фрезерные
UPDATE machines SET 
    name = 'Doosan Yashana',
    type = 'MILLING',
    axes = 4,
    updated_at = NOW()
WHERE id = 1;

UPDATE machines SET 
    name = 'Doosan Hadasha',
    type = 'MILLING', 
    axes = 4,
    updated_at = NOW()
WHERE id = 2;

UPDATE machines SET 
    name = 'Doosan 3',
    type = 'MILLING',
    axes = 3,
    updated_at = NOW()
WHERE id = 3;

UPDATE machines SET 
    name = 'Pinnacle Gdola',
    type = 'MILLING',
    axes = 4,
    updated_at = NOW()
WHERE id = 4;

-- 3х осевой фрезерный
UPDATE machines SET 
    name = 'Mitsubishi',
    type = 'MILLING',
    axes = 3,
    updated_at = NOW()
WHERE id = 5;

-- Добавляем токарные станки (если их нет)
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
SELECT 'Статистика станков по типам:' as info;
SELECT 
    type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as names
FROM machines 
GROUP BY type;

SELECT 'Статистика операторов по сменам:' as info;
SELECT 
    type,
    COALESCE(shift, 'DAY') as shift,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as names
FROM operators 
GROUP BY type, COALESCE(shift, 'DAY')
ORDER BY type, shift;
EOF

echo "📝 SQL скрипт создан. Выполняем обновление..."

# Выполняем SQL скрипт
PGPASSWORD="Magarel1!" psql \
    -h aws-0-eu-central-1.pooler.supabase.com \
    -p 6543 \
    -U postgres.kukqacmzfmzepdfddppl \
    -d postgres \
    -f update_machines_operators.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Обновление успешно завершено!"
    echo ""
    echo "🧪 Тестируем через API:"
    echo "Станки:"
    curl -s http://31.128.35.6/api/machines | jq '.[].name' 2>/dev/null || curl -s http://31.128.35.6/api/machines
    echo ""
    echo "Операторы:"
    curl -s http://31.128.35.6/api/operators | jq '.[].name' 2>/dev/null || curl -s http://31.128.35.6/api/operators
    echo ""
    echo "🌐 Обновите страницу в браузере чтобы увидеть изменения!"
else
    echo "❌ Ошибка при выполнении SQL скрипта"
    exit 1
fi

# Удаляем временный файл
rm -f update_machines_operators.sql

echo ""
echo "🎉 Готово! Новые данные:"
echo "📋 Фрезерные станки: Doosan Yashana, Doosan Hadasha, Doosan 3, Pinnacle Gdola, Mitsubishi"
echo "📋 Токарные станки: JohnFord, Okuma"
echo "📋 Операторы: Denis, Daniel, Andrey, Kirill, Slava, Arkady (ночная смена)"
