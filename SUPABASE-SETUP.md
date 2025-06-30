# 🗄️ НАСТРОЙКА SUPABASE ДЛЯ KASUF CRM

## 📋 Информация о базе данных

```
Host: aws-0-eu-central-1.pooler.supabase.com
Port: 6543
Database: postgres
Username: postgres.kukqacmzfmzepdfddppl
Password: [ВАШ-ПАРОЛЬ]
Connection URL: postgresql://postgres.kukqacmzfmzepdfddppl:[ВАШ-ПАРОЛЬ]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 🔧 Настройка переменных окружения

1. **Скопируйте файл конфигурации:**
   ```bash
   cp .env.supabase.production .env.production
   ```

2. **Заполните обязательные поля:**
   ```env
   # Замените [YOUR-PASSWORD] на ваш реальный пароль Supabase
   DB_PASSWORD=ваш_реальный_пароль_supabase
   
   # Замените ключи Supabase (найдите в Settings -> API вашего проекта)
   SUPABASE_ANON_KEY=ваш_anon_key
   SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
   
   # Обязательно измените секреты безопасности
   JWT_SECRET=ваш_сильный_jwt_секрет_минимум_64_символа
   SESSION_SECRET=ваш_session_секрет
   ENCRYPTION_KEY=ваш_encryption_ключ
   API_SECRET_KEY=ваш_api_секрет
   ```

## 🐳 Развертывание с Supabase

### Вариант 1: Использование специальной конфигурации
```bash
# Используйте Docker Compose конфигурацию для Supabase
docker-compose -f docker-compose.supabase.yml up -d
```

### Вариант 2: Обновление основной конфигурации
```bash
# Замените секцию PostgreSQL в docker-compose.security.yml
# Удалите или закомментируйте сервис postgres:
```

## 📁 Файлы для Supabase

1. **`.env.supabase.production`** - конфигурация с настройками Supabase
2. **`docker-compose.supabase.yml`** - Docker конфигурация без локального PostgreSQL
3. **`ormconfig.supabase.ts`** - TypeORM конфигурация для Supabase

## ⚙️ Настройка TypeORM

1. **Замените в `app.module.ts`:**
   ```typescript
   import { supabaseConfig } from './ormconfig.supabase';
   
   @Module({
     imports: [
       TypeOrmModule.forRoot(supabaseConfig),
       // остальные модули...
     ],
   })
   ```

2. **Или используйте через переменные окружения:**
   ```typescript
   TypeOrmModule.forRoot({
     type: 'postgres',
     host: process.env.DB_HOST,
     port: +process.env.DB_PORT,
     username: process.env.DB_USERNAME,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     ssl: { rejectUnauthorized: false },
     // остальные настройки...
   })
   ```

## 🔒 Важные настройки безопасности для Supabase

### 1. Настройки RLS (Row Level Security)
```sql
-- Включите RLS для ваших таблиц в Supabase Dashboard
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- и т.д. для всех таблиц
```

### 2. Настройки сети в Supabase
- Перейдите в Settings -> Database
- В разделе "Connection Pooling" убедитесь что включен Pooler
- Проверьте что ваш IP разрешен в "Network Restrictions"

### 3. Backup настройки
- Supabase автоматически создает бэкапы
- Дополнительно можете настроить экспорт через API
- Убедитесь что Point-in-time Recovery включен

## 🚀 Пошаговое развертывание

### Шаг 1: Подготовка сервера
```bash
# Установите Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
```

### Шаг 2: Настройка файлов
```bash
# Клонируйте/загрузите файлы проекта
cd /app/kasuf-crm

# Скопируйте конфигурацию Supabase
cp .env.supabase.production .env.production

# ВАЖНО: Отредактируйте .env.production
nano .env.production
```

### Шаг 3: Развертывание
```bash
# Запустите с конфигурацией Supabase
docker-compose -f docker-compose.supabase.yml up -d

# Или используйте автоматический скрипт
chmod +x deploy-secure.sh
sudo ./deploy-secure.sh
```

### Шаг 4: Проверка подключения
```bash
# Проверьте логи backend на ошибки подключения
docker-compose -f docker-compose.supabase.yml logs backend

# Проверьте health check
curl http://localhost/api/health
```

## 🔍 Диагностика проблем

### Проблемы подключения к базе данных:
```bash
# Проверьте подключение к Supabase
docker exec -it kasuf_crm_backend_supabase sh
# Внутри контейнера:
nc -zv aws-0-eu-central-1.pooler.supabase.com 6543
```

### Проверка настроек SSL:
```bash
# Убедитесь что SSL работает
openssl s_client -connect aws-0-eu-central-1.pooler.supabase.com:6543
```

### Логи для диагностики:
```bash
# Логи приложения
docker-compose -f docker-compose.supabase.yml logs -f backend

# Логи Nginx
docker-compose -f docker-compose.supabase.yml logs -f nginx
```

## ⚠️ Важные ограничения Supabase

1. **Connection Pooling**: Supabase Pooler работает в режиме `transaction`
2. **Prepared Statements**: Могут не работать с некоторыми ORM операциями
3. **Extensions**: Не все PostgreSQL расширения доступны
4. **Performance**: Connection pooling может влиять на производительность

## 📊 Мониторинг Supabase

### В Supabase Dashboard:
- Database -> Logs - просмотр логов запросов
- Settings -> Usage - мониторинг использования
- Database -> Roles - управление пользователями

### В вашем приложении:
- Prometheus метрики подключений
- Логирование медленных запросов
- Мониторинг ошибок подключения

## 🔄 Миграции с Supabase

```bash
# Создание миграции
npm run typeorm migration:generate -- -n CreateUsersTable

# Запуск миграций
npm run typeorm migration:run

# Откат миграции
npm run typeorm migration:revert
```

## 📞 Поддержка

- **Supabase Support**: https://supabase.com/support
- **CRM Support**: admin@kasuf.xyz
- **Документация**: https://supabase.com/docs

---

**✅ После настройки ваше приложение будет работать с Supabase как основной базой данных!**
