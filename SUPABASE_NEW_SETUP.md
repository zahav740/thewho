# 🚀 Инструкция по созданию новой базы данных Supabase для TheWho

## 📋 Обзор

Эта инструкция поможет вам создать новую базу данных Supabase, которая полностью соответствует структуре данных вашего приложения TheWho.

## 🎯 Что было создано

1. **Полная SQL схема** (`supabase-new-schema.sql`) - соответствует всем интерфейсам TypeScript
2. **Обновленный клиент** (`supabaseClient.ts`) - работает с новой схемой
3. **Миграция данных** - сохраняет существующие данные

## 📊 Структура новой базы данных

### Основные таблицы:
- **orders** - заказы (id, name, client_name, drawing_number, deadline, quantity, priority, pdf_url)
- **operations** - операции (id, order_id, sequence_number, machine, operation_type, estimated_time, status, etc.)
- **planning_results** - результаты планирования (id, order_id, operation_id, machine, planned_start_date, etc.)
- **shifts** - смены (id, date, machine, is_night, operators, operations, setups)
- **setups** - наладки (id, drawing_number, setup_type, operation_number, time_spent, etc.)

### Дополнительные таблицы:
- **machines** - справочник станков с характеристиками
- **force_majeure** - форс-мажорные ситуации
- **alerts** - системные уведомления

### Представления и функции:
- **orders_with_operations** - заказы с операциями в JSON
- **planning_details** - детали планирования с join'ами
- **get_machine_load_by_day()** - загрузка станков по дням
- **check_planning_conflicts()** - проверка конфликтов планирования

## 🔧 Инструкция по установке

### Шаг 1: Создание нового проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите в свой аккаунт
3. Нажмите "New Project"
4. Заполните данные:
   - **Name**: TheWho Production Planning
   - **Database Password**: Создайте надежный пароль
   - **Region**: Выберите ближайший регион
5. Нажмите "Create new project"
6. Дождитесь создания проекта (2-3 минуты)

### Шаг 2: Получение данных подключения

1. В созданном проекте перейдите в **Settings** → **API**
2. Скопируйте:
   - **URL** (например: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** ключ (начинается с `eyJ...`)

### Шаг 3: Обновление файла .env

Обновите файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-new-project-url.supabase.co
VITE_SUPABASE_KEY=your-new-anon-key

# Other environment variables
VITE_API_URL=http://localhost:3000
```

### Шаг 4: Создание схемы базы данных

1. В Supabase перейдите в **SQL Editor**
2. Нажмите "New query"
3. Скопируйте и вставьте содержимое файла `supabase-new-schema.sql`
4. Нажмите "Run" (выполнение займет 10-15 секунд)
5. Убедитесь, что все таблицы созданы без ошибок

### Шаг 5: Проверка создания таблиц

1. Перейдите в **Database** → **Tables**
2. Убедитесь, что созданы следующие таблицы:
   - ✅ orders
   - ✅ operations  
   - ✅ planning_results
   - ✅ shifts
   - ✅ setups
   - ✅ machines
   - ✅ force_majeure
   - ✅ alerts

### Шаг 6: Проверка данных станков

1. Откройте таблицу **machines**
2. Убедитесь, что добавлены 7 станков:
   - Doosan Yashana, Doosan Hadasha, Doosan 3
   - Pinnacle Gdola, Mitsubishi
   - Okuma, JonFord

## 🔄 Миграция существующих данных

### Автоматическая миграция

Если у вас есть существующие данные, приложение автоматически:

1. **Проверит формат ID** - преобразует в UUID если необходимо
2. **Сохранит связи** между заказами и операциями
3. **Мигрирует планирование** с сохранением всех связей

### Ручная миграция (если нужно)

```javascript
// В консоли браузера после запуска приложения
import { syncWithSupabase, loadFromSupabase } from './src/utils/supabaseClient';

// Загрузить данные из старой базы и синхронизировать с новой
const existingOrders = []; // ваши данные
const existingPlanning = []; // ваши данные планирования

const result = await syncWithSupabase(existingOrders, existingPlanning);
console.log('Миграция завершена:', result);
```

## 🛡️ Безопасность и RLS

### Row Level Security (RLS)

- ✅ **Включен** для всех таблиц
- ✅ **Политики** для аутентифицированных пользователей
- ✅ **Анонимный доступ** для разработки (можно отключить в продакшене)

### Отключение анонимного доступа в продакшене

```sql
-- Удалить политики анонимного доступа
DROP POLICY "Anonymous users full access" ON orders;
DROP POLICY "Anonymous users full access" ON operations;
DROP POLICY "Anonymous users full access" ON planning_results;
DROP POLICY "Anonymous users full access" ON shifts;
DROP POLICY "Anonymous users full access" ON setups;
DROP POLICY "Anonymous users full access" ON machines;
DROP POLICY "Anonymous users full access" ON force_majeure;
DROP POLICY "Anonymous users full access" ON alerts;
```

## 📝 Использование в приложении

### Основные функции

```typescript
import { 
  orderService, 
  operationService, 
  planningService,
  syncWithSupabase,
  loadFromSupabase 
} from './src/utils/supabaseClient';

// Получить все заказы с операциями
const orders = await orderService.getAllOrders();

// Синхронизировать данные
const result = await syncWithSupabase(localOrders, localPlanning);

// Загрузить данные из базы
const data = await loadFromSupabase();
```

### Новые возможности

1. **Проверка конфликтов планирования**
```typescript
const hasConflict = await planningService.checkPlanningConflicts(
  'Doosan Yashana', 
  '2024-01-15T08:00:00Z', 
  '2024-01-15T12:00:00Z'
);
```

2. **Загрузка станков по дням**
```typescript
const loadData = await machineService.getMachineLoadByDay(
  'Doosan Yashana',
  '2024-01-01',
  '2024-01-31'
);
```

## 🔍 Проверка работоспособности

### Тест 1: Создание заказа
```typescript
const newOrder = await orderService.upsertOrder({
  id: uuidv4(),
  name: 'Тестовый заказ',
  client_name: 'Тестовый клиент',
  drawing_number: 'TEST-001',
  deadline: new Date().toISOString(),
  quantity: 5,
  priority: 1
});
```

### Тест 2: Проверка представлений
```sql
-- В SQL Editor
SELECT * FROM orders_with_operations LIMIT 5;
SELECT * FROM planning_details LIMIT 5;
```

## ❌ Решение проблем

### Ошибка: "table does not exist"
- Убедитесь, что SQL схема выполнена полностью
- Проверьте, что нет синтаксических ошибок в SQL

### Ошибка: "permission denied"
- Проверьте настройки RLS
- Убедитесь, что политики доступа настроены

### Ошибка: "invalid UUID"
- Приложение автоматически преобразует ID в UUID
- Если проблема сохраняется, очистите локальное хранилище

### Ошибка подключения 401
- Проверьте правильность URL и ключа API в `.env`
- Убедитесь, что ключ соответствует проекту

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи** в консоли браузера
2. **Проверьте SQL** в Supabase SQL Editor  
3. **Обратитесь к документации** Supabase
4. **Используйте встроенную диагностику** приложения

## 🎉 Готово!

После выполнения всех шагов у вас будет:

- ✅ Новая современная база данных
- ✅ Полная совместимость с приложением
- ✅ Автоматическая миграция данных
- ✅ Расширенные возможности планирования
- ✅ Система уведомлений и алертов
- ✅ Поддержка форс-мажорных ситуаций

Ваше приложение TheWho готово к работе с новой базой данных! 🚀
