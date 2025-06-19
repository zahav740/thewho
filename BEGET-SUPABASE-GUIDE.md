# Развертывание Production CRM на Beget с Supabase

## Важные детали конфигурации

- **База данных**: Supabase PostgreSQL (внешняя)
- **Backend порт**: 5100
- **Frontend порт**: 5101
- **Домен**: kasuf.xyz
- **SSL**: Автоматически через Supabase

## Быстрый старт

### 1. Локальная подготовка

```bash
# Запустите bat файл (Windows)
DEPLOY-BEGET-SUPABASE.bat

# Или вручную (Linux/Mac):
./deploy-supabase.sh
```

### 2. Загрузка на Beget

1. Загрузите `production-crm-beget-supabase.zip` на сервер
2. Распакуйте архив в директории сайта
3. Откройте SSH терминал на Beget

### 3. Настройка на сервере

```bash
# Дайте права на выполнение скриптов
chmod +x beget-deploy/*.sh

# ВАЖНО: Отредактируйте конфигурацию
nano .env.beget.supabase

# Обязательно измените:
# - JWT_SECRET (длинный секретный ключ)
# - Проверьте данные Supabase

# Запустите установку
./beget-deploy/setup-supabase.sh
```

### 4. Настройка веб-сервера на Beget

В панели управления Beget настройте:

#### Nginx конфигурация для kasuf.xyz:

```nginx
# Frontend
location / {
    proxy_pass http://127.0.0.1:5101;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Backend API
location /api/ {
    proxy_pass http://127.0.0.1:5100/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "https://kasuf.xyz" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;
}

# Health check
location /health {
    proxy_pass http://127.0.0.1:5100/health;
    proxy_set_header Host $host;
}
```

## Диагностика и устранение неполадок

### Проверка статуса системы

```bash
# Запустите полную диагностику
./beget-deploy/check-supabase.sh
```

### Типичные проблемы

#### 1. API возвращает 404

**Причина**: Backend не запущен или недоступен

**Решение**:
```bash
# Проверьте статус контейнеров
docker-compose -f docker-compose.beget.supabase.yml ps

# Проверьте логи backend
docker-compose -f docker-compose.beget.supabase.yml logs backend

# Перезапустите backend
docker-compose -f docker-compose.beget.supabase.yml restart backend
```

#### 2. Ошибка подключения к базе данных

**Причина**: Неправильные данные Supabase или проблемы с SSL

**Решение**:
```bash
# Проверьте подключение к Supabase
psql "postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SELECT version();"

# Если не работает, проверьте .env файл
cat .env | grep DB_
```

#### 3. CORS ошибки

**Причина**: Неправильная настройка CORS в backend

**Проверьте** в логах backend:
```bash
docker-compose -f docker-compose.beget.supabase.yml logs backend | grep CORS
```

**Убедитесь**, что в .env указан правильный CORS_ORIGIN:
```
CORS_ORIGIN=https://kasuf.xyz
```

#### 4. Frontend не загружается

**Причина**: Проблемы с Nginx или статическими файлами

**Решение**:
```bash
# Проверьте статус frontend контейнера
docker-compose -f docker-compose.beget.supabase.yml logs frontend

# Проверьте файлы сборки
ls -la frontend/build/

# Перезапустите frontend
docker-compose -f docker-compose.beget.supabase.yml restart frontend
```

## Мониторинг

### Регулярные проверки

```bash
# Ежедневно
./beget-deploy/check-supabase.sh

# Проверка логов
docker-compose -f docker-compose.beget.supabase.yml logs --tail=100
```

### Метрики производительности

```bash
# Использование ресурсов
docker stats --no-stream

# Статус подключений к Supabase
curl -s http://localhost:5100/health | jq .
```

## Обновление системы

```bash
# Создайте бэкап (опционально, так как используется Supabase)
./beget-deploy/backup.sh

# Остановите сервисы
docker-compose -f docker-compose.beget.supabase.yml down

# Загрузите новую версию кода
# ... (замените файлы)

# Пересоберите и запустите
docker-compose -f docker-compose.beget.supabase.yml up --build -d

# Проверьте статус
./beget-deploy/check-supabase.sh
```

## Безопасность

### Обязательные изменения перед продакшеном:

1. **JWT_SECRET** - сгенерируйте длинный случайный ключ
2. **DB_PASSWORD** - проверьте, что пароль Supabase актуален
3. **CORS_ORIGIN** - укажите только ваш домен
4. **SSL** - включено автоматически через Supabase

### Мониторинг безопасности:

```bash
# Проверка активных подключений
docker-compose -f docker-compose.beget.supabase.yml logs backend | grep "connection"

# Проверка CORS ошибок
docker-compose -f docker-compose.beget.supabase.yml logs backend | grep "CORS"
```

## Полезные команды

```bash
# Полный перезапуск
docker-compose -f docker-compose.beget.supabase.yml restart

# Просмотр логов в реальном времени
docker-compose -f docker-compose.beget.supabase.yml logs -f

# Остановка всех сервисов
docker-compose -f docker-compose.beget.supabase.yml down

# Запуск с пересборкой
docker-compose -f docker-compose.beget.supabase.yml up --build -d

# Проверка здоровья API
curl https://kasuf.xyz/api/health

# Тест frontend
curl https://kasuf.xyz
```

## Контакты и поддержка

При возникновении проблем:

1. Запустите диагностику: `./beget-deploy/check-supabase.sh`
2. Проверьте логи: `docker-compose -f docker-compose.beget.supabase.yml logs`
3. Убедитесь в корректности .env файла
4. Проверьте настройки веб-сервера в панели Beget

## Конфигурация Supabase

### Информация о подключении:
- **Host**: aws-0-eu-central-1.pooler.supabase.com
- **Port**: 6543
- **Database**: postgres
- **User**: postgres.kukqacmzfmzepdfddppl
- **Pool Mode**: transaction
- **SSL**: Обязательно включен

### Строка подключения:
```
postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## Архитектура развертывания

```
Internet
    ↓
kasuf.xyz (Beget Nginx)
    ↓
┌─────────────────┬─────────────────┐
│   Frontend      │    Backend      │
│  (port 5101)    │   (port 5100)   │
│   Nginx +       │   NestJS +      │
│   React Build   │   TypeORM       │
└─────────────────┴─────────────────┘
          ↓
    Supabase PostgreSQL
   (aws-0-eu-central-1)
```

Все готово для развертывания! 🚀
