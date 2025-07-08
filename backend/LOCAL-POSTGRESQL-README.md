# 🔧 ПЕРЕКЛЮЧЕНИЕ НА ЛОКАЛЬНУЮ POSTGRESQL

## 📋 Что было изменено

Приложение теперь настроено для работы с **локальной PostgreSQL** базой данных вместо Supabase.

### ✅ Новые настройки:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `thewho`
- **Username**: `postgres`
- **Password**: `magarel`
- **SSL**: Отключен (не нужен для локальной БД)

## 🚀 Пошаговая инструкция

### Шаг 1: Убедитесь что PostgreSQL запущен
1. Проверьте что служба PostgreSQL работает
2. Откройте pgAdmin и убедитесь что можете подключиться

### Шаг 2: Создайте базу данных `thewho`
**Вариант A: Через pgAdmin**
1. Откройте pgAdmin
2. Подключитесь к серверу PostgreSQL
3. Правый клик на "Databases" → "Create" → "Database"
4. Имя базы данных: `thewho`
5. Нажмите "Save"

**Вариант B: Через SQL**
```sql
CREATE DATABASE thewho;
```

**Вариант C: Используйте готовый скрипт**
```bash
# Выполните SQL скрипт из файла:
create-database.sql
```

### Шаг 3: Тест подключения
```bash
TEST-LOCAL-POSTGRESQL.bat
```

### Шаг 4: Запуск приложения
```bash
START-PRODUCTION-BACKEND.bat
```

## 🧪 Диагностика

Если тест подключения не проходит, проверьте:

1. **PostgreSQL запущен?**
   - Проверьте службы Windows
   - Или запустите через pgAdmin

2. **База данных создана?**
   ```sql
   SELECT datname FROM pg_database WHERE datname = 'thewho';
   ```

3. **Правильный пароль?**
   - Пароль пользователя `postgres` должен быть `magarel`
   - Если другой пароль, измените в `.env.production`

4. **Порт доступен?**
   - PostgreSQL обычно использует порт 5432
   - Проверьте что порт не занят

## 🔍 Проверка работы

После успешного запуска:
- **API**: http://localhost:5100/api
- **Swagger docs**: http://localhost:5100/api/docs  
- **Health check**: http://localhost:5100/api/health

## ⚙️ Если нужно изменить настройки

Отредактируйте файл `.env.production`:

```env
# Database Configuration (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:ВАШТПАРОЛЬ@localhost:5432/thewho
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=ВАШТПАРОЛЬ
DB_NAME=thewho
```

## 📁 Новые файлы

- ✅ `test-local-postgresql.js` - тест подключения к локальной БД
- ✅ `TEST-LOCAL-POSTGRESQL.bat` - скрипт теста
- ✅ `create-database.sql` - SQL для создания БД
- ✅ Обновлены `.env` и `.env.production`
- ✅ Обновлена `database.config.ts` с поддержкой локальной БД

## 🎉 Готово!

Теперь приложение работает с локальной PostgreSQL базой данных!
Никаких проблем с SCRAM authentication и Supabase больше не будет.

---

## 💡 Полезные команды

```bash
# Тест подключения к локальной БД
TEST-LOCAL-POSTGRESQL.bat

# Запуск с локальной БД
START-PRODUCTION-BACKEND.bat

# Если нужно вернуться к Supabase
# Просто измените .env.production обратно
```
