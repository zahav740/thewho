@echo off
chcp 65001 >nul
echo ==========================================
echo 🧪 ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ Production CRM
echo ==========================================
echo.

echo 📋 Проверяем состояние базы данных...

REM Проверяем подключение к БД
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Подключение успешно' as status;" 2>nul
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: Не удается подключиться к базе данных!
    pause
    exit /b 1
)

echo ✅ Подключение к БД успешно
echo.

echo 📊 Анализируем текущие данные...
psql -h localhost -p 5432 -U postgres -d thewho -c "
-- Проверяем основные таблицы
SELECT 
  '📋 ОБЩАЯ СТАТИСТИКА:' as info,
  (SELECT COUNT(*) FROM orders) as заказов,
  (SELECT COUNT(*) FROM operations) as операций,
  (SELECT COUNT(*) FROM machines WHERE \"isActive\" = true) as станков,
  (SELECT COUNT(*) FROM operation_progress) as с_прогрессом;

-- Проверяем заказы без операций
SELECT 
  '⚠️  ЗАКАЗЫ БЕЗ ОПЕРАЦИЙ:' as info,
  COUNT(*) as количество
FROM orders o
LEFT JOIN operations op ON o.id = op.\"orderId\"
WHERE op.id IS NULL;

-- Статусы операций
SELECT 
  '📈 СТАТУСЫ ОПЕРАЦИЙ:' as info,
  status,
  COUNT(*) as количество
FROM operations 
GROUP BY status 
ORDER BY количество DESC;

-- Занятость станков
SELECT 
  '🏭 СОСТОЯНИЕ СТАНКОВ:' as info,
  CASE WHEN \"isOccupied\" THEN 'Занят' ELSE 'Свободен' END as состояние,
  COUNT(*) as количество
FROM machines 
WHERE \"isActive\" = true
GROUP BY \"isOccupied\";
"

echo.
echo 🔍 Проверяем API endpoints...

echo Тестируем /api/machines...
curl -s http://localhost:3000/api/machines | jq -r ".length // \"Error\"" 2>nul || echo "❌ API недоступен"

echo Тестируем /api/operations...  
curl -s http://localhost:3000/api/operations | jq -r ".length // \"Error\"" 2>nul || echo "❌ API недоступен"

echo Тестируем /api/progress/metrics...
curl -s http://localhost:3000/api/progress/metrics | jq -r ".success // \"Error\"" 2>nul || echo "❌ API недоступен"

echo.
echo 📈 Проверяем производственные метрики...

psql -h localhost -p 5432 -U postgres -d thewho -c "
-- Средний прогресс
SELECT 
  '📊 МЕТРИКИ ПРОИЗВОДСТВА:' as info,
  ROUND(AVG(COALESCE(p.progress_percentage, 0)), 2) as средний_прогресс,
  COUNT(CASE WHEN o.status = 'IN_PROGRESS' THEN 1 END) as в_работе,
  COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as завершено,
  COUNT(CASE WHEN o.status = 'ASSIGNED' THEN 1 END) as назначено
FROM operations o
LEFT JOIN operation_progress p ON o.id = p.operation_id;

-- Загрузка станков
SELECT 
  '🏭 ЗАГРУЗКА СТАНКОВ:' as info,
  COUNT(*) as всего_станков,
  COUNT(CASE WHEN \"isOccupied\" = true THEN 1 END) as занятых,
  ROUND(
    (COUNT(CASE WHEN \"isOccupied\" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
    2
  ) as процент_загрузки
FROM machines
WHERE \"isActive\" = true;

-- Проверяем прогресс операций
SELECT 
  '📈 ПРОГРЕСС ОПЕРАЦИЙ:' as info,
  COUNT(*) as всего_с_прогрессом,
  COUNT(CASE WHEN progress_percentage > 0 THEN 1 END) as начатых,
  COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as завершенных,
  MAX(progress_percentage) as максимальный_прогресс
FROM operation_progress;
"

echo.
echo 🎯 Проверяем детали активных операций...

psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
  '🔄 АКТИВНЫЕ ОПЕРАЦИИ:' as заголовок,
  m.code as станок,
  op.\"operationNumber\" as операция,
  op.operationtype as тип,
  op.status as статус,
  COALESCE(p.progress_percentage, 0) as прогресс,
  ord.drawing_number as чертеж
FROM machines m
LEFT JOIN operations op ON m.\"currentOperation\" = op.id OR op.\"assignedMachine\" = m.id
LEFT JOIN operation_progress p ON op.id = p.operation_id  
LEFT JOIN orders ord ON op.\"orderId\" = ord.id
WHERE m.\"isActive\" = true AND op.id IS NOT NULL
ORDER BY m.code;
"

echo.
echo ✅ ИТОГОВАЯ ОЦЕНКА СИСТЕМЫ:

psql -h localhost -p 5432 -U postgres -d thewho -c "
WITH system_health AS (
  SELECT 
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM operations) as total_operations,
    (SELECT COUNT(*) FROM orders o WHERE NOT EXISTS (SELECT 1 FROM operations op WHERE op.\"orderId\" = o.id)) as orders_without_ops,
    (SELECT COUNT(*) FROM operation_progress) as operations_with_progress,
    (SELECT COUNT(*) FROM machines WHERE \"isActive\" = true AND \"isOccupied\" = true) as busy_machines,
    (SELECT COUNT(*) FROM machines WHERE \"isActive\" = true) as total_machines
)
SELECT 
  '🎉 ОЦЕНКА ГОТОВНОСТИ СИСТЕМЫ:' as заголовок,
  CASE 
    WHEN orders_without_ops = 0 THEN '✅ Все заказы имеют операции'
    ELSE '⚠️  ' || orders_without_ops || ' заказов без операций'
  END as статус_операций,
  CASE 
    WHEN operations_with_progress > total_operations * 0.8 THEN '✅ Прогресс настроен'
    ELSE '⚠️  Нужно настроить прогресс'
  END as статус_прогресса,
  CASE 
    WHEN busy_machines > 0 THEN '✅ Станки работают (' || busy_machines || '/' || total_machines || ')'
    ELSE '⚠️  Станки простаивают'
  END as статус_станков,
  CASE 
    WHEN orders_without_ops = 0 AND operations_with_progress > 0 AND busy_machines > 0 
    THEN '🚀 СИСТЕМА ГОТОВА К ПРОИЗВОДСТВУ!'
    ELSE '🔧 Нужны дополнительные настройки'
  END as общий_статус
FROM system_health;
"

echo.
echo 📋 Рекомендации по дальнейшим действиям:
echo.
echo 1. Если есть заказы без операций - запустите APPLY-EMERGENCY-FIXES.bat
echo 2. Проверьте что backend запущен на порту 3000
echo 3. Проверьте что frontend запущен на порту 3001
echo 4. Откройте http://localhost:3001 для проверки интерфейса
echo 5. Перейдите в раздел "Мониторинг производства" для тестирования
echo.

pause
