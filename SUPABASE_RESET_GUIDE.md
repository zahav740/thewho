# 🔄 Полная очистка и пересоздание базы данных Supabase

## ⚠️ ВНИМАНИЕ: Резервное копирование данных

**ПЕРЕД ОЧИСТКОЙ ОБЯЗАТЕЛЬНО СОХРАНИТЕ ДАННЫЕ!**

### Экспорт существующих данных

1. **Через SQL Editor в Supabase:**
```sql
-- Экспорт заказов
COPY (SELECT * FROM orders) TO STDOUT WITH CSV HEADER;

-- Экспорт операций  
COPY (SELECT * FROM operations) TO STDOUT WITH CSV HEADER;

-- Экспорт планирования
COPY (SELECT * FROM planning_results) TO STDOUT WITH CSV HEADER;

-- Экспорт смен
COPY (SELECT * FROM shifts) TO STDOUT WITH CSV HEADER;
```

2. **Через приложение (в консоли браузера):**
```javascript
// Сохранить данные в локальный файл
const data = await loadFromSupabase();
const backup = JSON.stringify(data, null, 2);
const blob = new Blob([backup], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `theWho-backup-${new Date().toISOString().split('T')[0]}.json`;
a.click();
```

## 🗑️ Способ 1: Полная очистка существующего проекта

### Шаг 1: Остановка приложения
```bash
# Остановите сервер разработки
Ctrl + C
```

### Шаг 2: Удаление всех таблиц и объектов

Выполните в **SQL Editor** Supabase:

```sql
-- ===============================================
-- ПОЛНАЯ ОЧИСТКА БАЗЫ ДАННЫХ
-- ===============================================

-- Отключаем RLS для всех таблиц
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planning_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS setups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS force_majeure DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts DISABLE ROW LEVEL SECURITY;

-- Удаляем представления
DROP VIEW IF EXISTS orders_with_operations CASCADE;
DROP VIEW IF EXISTS planning_details CASCADE;

-- Удаляем функции
DROP FUNCTION IF EXISTS get_machine_load_by_day(TEXT, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS check_planning_conflicts(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Удаляем все таблицы (CASCADE удалит связанные объекты)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS force_majeure CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS setups CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS planning_results CASCADE;
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Удаляем старые таблицы (если есть)
DROP TABLE IF EXISTS planning_result CASCADE;

-- Очищаем схему storage (если использовалась)
DELETE FROM storage.objects WHERE bucket_id = 'pdf_files';
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Обновляем статистику
ANALYZE;

-- Проверяем, что всё удалено
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'auth%' 
    AND tablename NOT LIKE 'storage%'
    AND tablename NOT LIKE 'realtime%';
```

### Шаг 3: Создание новой схемы

1. Скопируйте **весь** содержимый файла `supabase-new-schema.sql`
2. Вставьте в **новый запрос** в SQL Editor
3. Нажмите **Run**
4. Дождитесь выполнения (может занять 30-60 секунд)

### Шаг 4: Проверка создания

```sql
-- Проверяем созданные таблицы
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('orders', 'operations', 'planning_results', 'shifts', 'setups', 'machines', 'force_majeure', 'alerts')
ORDER BY tablename;

-- Проверяем данные станков
SELECT name, type, is_active FROM machines ORDER BY name;

-- Проверяем представления
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- Проверяем функции
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name LIKE '%machine%' OR routine_name LIKE '%planning%';
```

## 🆕 Способ 2: Создание нового проекта (рекомендуется)

### Шаг 1: Создание нового проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **"New Project"**
3. Заполните данные:
   - **Name**: `TheWho-Production-v2` (или другое имя)
   - **Database Password**: Сильный пароль
   - **Region**: Тот же что и раньше
4. Нажмите **"Create new project"**
5. Дождитесь создания (2-3 минуты)

### Шаг 2: Получение новых данных подключения

1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **URL** (новый проект будет иметь другой URL)
   - **anon public** ключ

### Шаг 3: Создание схемы в новом проекте

1. Откройте **SQL Editor** в новом проекте
2. Создайте **New query**
3. Скопируйте содержимое `supabase-new-schema.sql`
4. Выполните запрос

### Шаг 4: Обновление конфигурации приложения

Обновите файл `.env`:

```env
# Новые данные подключения
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_KEY=your-new-anon-key

# Other environment variables
VITE_API_URL=http://localhost:3000
```

## 🔄 Восстановление данных

### Способ 1: Автоматическая миграция

```javascript
// В консоли браузера после запуска приложения
import { syncWithSupabase } from './src/utils/supabaseClient';

// Ваши сохраненные данные (из резервной копии)
const backupData = {
  orders: [/* ваши заказы */],
  planningResults: [/* ваше планирование */]
};

// Синхронизация с новой базой
const result = await syncWithSupabase(
  backupData.orders, 
  backupData.planningResults
);

console.log('Восстановление завершено:', result);
```

### Способ 2: Ручное восстановление из JSON

Если у вас есть JSON backup:

```javascript
// Загрузите файл backup и выполните
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const backupData = JSON.parse(text);
  
  // Восстановление
  const result = await syncWithSupabase(
    backupData.orders, 
    backupData.planningResults
  );
  
  console.log('Данные восстановлены:', result);
};
fileInput.click();
```

### Способ 3: Восстановление из CSV

```sql
-- В SQL Editor (если сохранили CSV)
COPY orders FROM '/path/to/orders.csv' WITH CSV HEADER;
COPY operations FROM '/path/to/operations.csv' WITH CSV HEADER;
COPY planning_results FROM '/path/to/planning.csv' WITH CSV HEADER;
```

## 🧹 Очистка локальных данных

### Очистка кэша браузера

```javascript
// Выполните в консоли браузера
console.log('🧹 Очищаем локальное хранилище...');

// Очищаем localStorage
localStorage.clear();

// Очищаем sessionStorage  
sessionStorage.clear();

// Очищаем indexedDB
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

console.log('✅ Очистка завершена. Перезагружаем страницу...');
window.location.reload();
```

### Очистка файлов приложения

```bash
# Очистка зависимостей и кэша
rm -rf node_modules
rm package-lock.json
npm install

# Очистка кэша сборщика
rm -rf .vite
rm -rf dist

# Перезапуск
npm run dev
```

## ✅ Проверка работоспособности

### Тест 1: Подключение к базе

```javascript
// В консоли браузера
import { supabase } from './src/utils/supabaseClient';

// Проверка подключения
const { data, error } = await supabase.from('machines').select('*').limit(1);
if (error) {
  console.error('❌ Ошибка подключения:', error);
} else {
  console.log('✅ Подключение работает:', data);
}
```

### Тест 2: Создание тестового заказа

```javascript
import { orderService } from './src/utils/supabaseClient';

const testOrder = await orderService.upsertOrder({
  id: crypto.randomUUID(),
  name: 'Тестовый заказ',
  client_name: 'Тестовый клиент', 
  drawing_number: 'TEST-' + Date.now(),
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  quantity: 1,
  priority: 3
});

console.log('✅ Тестовый заказ создан:', testOrder);
```

### Тест 3: Проверка представлений

```sql
-- В SQL Editor
SELECT COUNT(*) as machines_count FROM machines;
SELECT COUNT(*) as orders_count FROM orders;
SELECT * FROM orders_with_operations LIMIT 1;
```

## 🚨 Решение проблем

### Ошибка: "permission denied for table"
```sql
-- Проверьте RLS политики
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Если нужно, отключите RLS временно
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Ошибка: "function does not exist"
- Убедитесь, что весь SQL скрипт выполнен
- Проверьте логи выполнения SQL

### Ошибка: "invalid UUID format"
- Очистите локальное хранилище браузера
- Используйте `crypto.randomUUID()` для новых ID

## 🎯 Финальная проверка

После завершения у вас должно быть:

- ✅ **8 таблиц**: orders, operations, planning_results, shifts, setups, machines, force_majeure, alerts
- ✅ **7 станков** в таблице machines
- ✅ **2 представления**: orders_with_operations, planning_details  
- ✅ **3 функции**: update_updated_at_column, get_machine_load_by_day, check_planning_conflicts
- ✅ **RLS включен** для всех таблиц
- ✅ **Триггеры** для автообновления timestamps
- ✅ **Приложение работает** без ошибок подключения

## 📞 Если что-то пошло не так

1. **Сохраните логи ошибок** из SQL Editor
2. **Проверьте URL и ключи** в .env файле
3. **Очистите кэш браузера** полностью
4. **Пересоздайте проект** Supabase (способ 2)

Готово! Ваша база данных полностью обновлена! 🚀
