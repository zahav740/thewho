# Настройка PDF-хранилища в Supabase

В этом документе описан процесс настройки хранилища PDF-файлов чертежей в Supabase для интеграции с приложением TheWho.

## Шаг 1: Создание бакета для PDF-файлов

1. Войдите в панель управления Supabase и откройте ваш проект
2. В левом меню выберите "Storage" -> "Buckets"
3. Нажмите кнопку "Create Bucket"
4. Введите имя бакета: `pdf_files`
5. Установите доступ: "Private" (Для дополнительной безопасности)

## Шаг 2: Настройка политик доступа

### Политика на загрузку файлов

1. В разделе Storage выберите созданный бакет `pdf_files`
2. Перейдите на вкладку "Policies"
3. Нажмите "Create Policy"
4. Выберите шаблон "Insert: Auth users can upload files to folder" 
5. Настройте следующие параметры:
   - Policy name: `allow_authenticated_uploads`
   - Allowed operations: `INSERT`
   - FOR storage.objects
   - USING expression: `(bucket_id = 'pdf_files' AND auth.role() = 'authenticated')`

### Политика на чтение файлов

1. Нажмите снова "Create Policy"
2. Выберите шаблон "Select: Auth users can read files"
3. Настройте следующие параметры:
   - Policy name: `allow_authenticated_reads`
   - Allowed operations: `SELECT`
   - FOR storage.objects
   - USING expression: `(bucket_id = 'pdf_files' AND auth.role() = 'authenticated')`

### Политика на обновление файлов (опционально)

1. Нажмите "Create Policy"
2. Выберите шаблон "Update: Auth users can update files they created"
3. Настройте следующие параметры:
   - Policy name: `allow_authenticated_updates`
   - Allowed operations: `UPDATE`
   - FOR storage.objects
   - USING expression: `(bucket_id = 'pdf_files' AND auth.role() = 'authenticated')`

### Политика на удаление файлов (опционально)

1. Нажмите "Create Policy"
2. Выберите шаблон "Delete: Auth users can delete files they created"
3. Настройте следующие параметры:
   - Policy name: `allow_authenticated_deletes`
   - Allowed operations: `DELETE`
   - FOR storage.objects
   - USING expression: `(bucket_id = 'pdf_files' AND auth.role() = 'authenticated')`

## Шаг 3: Создание публичных URL для PDF-файлов

Для доступа к PDF-файлам через web-приложение:

1. В разделе Storage выберите созданный бакет `pdf_files`
2. Перейдите на вкладку "Policies"
3. Создайте новую политику для публичного доступа:
   - Policy name: `allow_public_reads`
   - Allowed operations: `SELECT`
   - FOR storage.objects
   - USING expression: `(bucket_id = 'pdf_files')`
   
Примечание: Убедитесь, что вы разрешаете публичный доступ только для файлов, которые не содержат конфиденциальных данных.

## Шаг 4: Настройка таблиц базы данных

Выполните SQL-скрипт из файла `docs/supabase_sql_schema.sql` в SQL-редакторе Supabase для создания необходимых таблиц:

1. В левом меню выберите "SQL Editor"
2. Нажмите кнопку "New Query"
3. Скопируйте и вставьте содержимое файла `docs/supabase_sql_schema.sql`
4. Нажмите кнопку "Run" для выполнения скрипта

Этот скрипт создаст следующие таблицы:
- `orders` - таблица заказов
- `operations` - таблица операций
- `planning` - таблица результатов планирования

## Шаг 5: Настройка политик доступа к таблицам

### Политики для таблицы orders

1. В левом меню выберите "Authentication" -> "Policies"
2. Выберите таблицу `orders`
3. Создайте следующие политики:

#### SELECT политика
- Policy name: `Allow authenticated read access`
- Allowed operations: `SELECT`
- USING expression: `auth.role() = 'authenticated'`

#### INSERT политика
- Policy name: `Allow authenticated insert access`
- Allowed operations: `INSERT`
- USING expression: `auth.role() = 'authenticated'`

#### UPDATE политика
- Policy name: `Allow authenticated update access`
- Allowed operations: `UPDATE`
- USING expression: `auth.role() = 'authenticated'`

#### DELETE политика
- Policy name: `Allow authenticated delete access`
- Allowed operations: `DELETE`
- USING expression: `auth.role() = 'authenticated'`

### Повторите те же политики для таблиц operations и planning

## Шаг 6: Настройка аутентификации (опционально)

Для добавления защиты:

1. В левом меню выберите "Authentication" -> "Settings"
2. Настройте методы входа в зависимости от ваших требований (Email, Magic Link, и т.д.)
3. Для обеспечения безопасности, вы можете отключить регистрацию и добавлять пользователей вручную

## Тестирование

Проверка хранилища PDF-файлов:

1. Откройте ваше приложение TheWho
2. Введите API ключ Supabase в разделе "Синхронизация с Supabase"
3. Создайте новый заказ и загрузите PDF-файл
4. Проверьте, что PDF-файл появился в бакете `pdf_files` в Supabase
5. Убедитесь, что вы можете просмотреть загруженный PDF через приложение

## Устранение неполадок

Если возникают ошибки с загрузкой или доступом к файлам:

1. Проверьте консоль разработчика в браузере для деталей ошибки
2. Убедитесь, что добавлены правильные политики доступа для бакета
3. Проверьте, что API-ключ имеет необходимые разрешения
4. Просмотрите журналы в Supabase (раздел "Logs" в левом меню)

## Дополнительные рекомендации

- **Резервное копирование**: Регулярно экспортируйте данные из Supabase для создания резервных копий
- **Мониторинг использования**: Следите за использованием хранилища в разделе "Usage" администраторской панели Supabase
- **Защита API-ключей**: Не включайте ключи API напрямую в код приложения, используйте переменные окружения
- **Ограничение размеров файлов**: Для экономии места в хранилище, рассмотрите возможность ограничения размеров загружаемых PDF-файлов
