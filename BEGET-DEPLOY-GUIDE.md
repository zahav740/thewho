# Развертывание Production CRM на Beget

## Предварительные требования

### На сервере Beget должно быть установлено:
- Docker и Docker Compose
- Node.js 18+
- PostgreSQL (или используйте контейнер)
- Nginx (опционально, если не используете контейнер)

## Пошаговое развертывание

### 1. Подготовка локально

```bash
# Клонируйте или скачайте проект
cd production-crm

# Сделайте скрипты исполняемыми (на Linux/Mac)
chmod +x deploy-beget.sh
chmod +x beget-deploy/*.sh

# Соберите проект для продакшена
./deploy-beget.sh
```

### 2. Загрузка на сервер

```bash
# Загрузите архив production-crm-beget.tar.gz на ваш сервер Beget
# Через FTP, SFTP или панель управления

# На сервере распакуйте архив
tar -xzf production-crm-beget.tar.gz
cd production-crm
```

### 3. Настройка окружения

```bash
# Отредактируйте .env.beget файл
nano .env.beget

# Обновите следующие параметры:
# - DB_PASSWORD: безопасный пароль для базы данных
# - JWT_SECRET: длинный секретный ключ для JWT
# - CORS_ORIGIN: ваш домен (например, https://mydomain.beget.tech)
# - REACT_APP_API_URL: URL вашего API
# - DOMAIN: ваш домен
# - EMAIL: ваш email
```

### 4. Запуск установки

```bash
# Запустите скрипт установки
./beget-deploy/setup.sh
```

### 5. Проверка работы

```bash
# Проверьте статус контейнеров
docker-compose -f docker-compose.beget.yml ps

# Проверьте логи
docker-compose -f docker-compose.beget.yml logs

# Мониторинг системы
./beget-deploy/monitor.sh
```

## Настройка доменов и портов

### Если у вас есть домен:

1. В панели Beget настройте поддомен или основной домен
2. Обновите `.env` файл с правильным доменом
3. Настройте проксирование портов 3000 и 3001 на ваш домен

### Доступ к приложению:

- **Frontend**: http://ваш-домен.beget.tech:3000
- **Backend API**: http://ваш-домен.beget.tech:3001
- **Документация API**: http://ваш-домен.beget.tech:3001/api/docs

## Обслуживание

### Обновление приложения:
```bash
./beget-deploy/update.sh
```

### Мониторинг:
```bash
./beget-deploy/monitor.sh
```

### Бэкап базы данных:
```bash
docker exec crm-db pg_dump -U postgres thewho_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление из бэкапа:
```bash
docker exec -i crm-db psql -U postgres thewho_prod < backup_file.sql
```

### Логи приложения:
```bash
# Логи всех сервисов
docker-compose -f docker-compose.beget.yml logs

# Логи конкретного сервиса
docker-compose -f docker-compose.beget.yml logs backend
docker-compose -f docker-compose.beget.yml logs frontend
docker-compose -f docker-compose.beget.yml logs postgres
```

### Перезапуск сервисов:
```bash
# Перезапуск всех сервисов
docker-compose -f docker-compose.beget.yml restart

# Перезапуск конкретного сервиса
docker-compose -f docker-compose.beget.yml restart backend
```

## Устранение неполадок

### Контейнер не запускается:
```bash
# Проверьте логи
docker-compose -f docker-compose.beget.yml logs [service-name]

# Проверьте конфигурацию
docker-compose -f docker-compose.beget.yml config
```

### База данных недоступна:
```bash
# Проверьте статус PostgreSQL
docker-compose -f docker-compose.beget.yml exec postgres pg_isready

# Подключитесь к базе данных
docker-compose -f docker-compose.beget.yml exec postgres psql -U postgres -d thewho_prod
```

### API не отвечает:
```bash
# Проверьте health check
curl http://localhost:3001/health

# Проверьте порты
netstat -tlnp | grep :3001
```

## Безопасность

1. **Смените все пароли по умолчанию** в `.env` файле
2. **Используйте HTTPS** в продакшене
3. **Регулярно обновляйте** зависимости
4. **Делайте бэкапы** базы данных
5. **Мониторьте логи** на подозрительную активность

## Производительность

### Для оптимизации производительности:

1. **Настройте кэширование** в Redis (включено в docker-compose)
2. **Используйте CDN** для статических файлов
3. **Настройте балансировку нагрузки** если трафик большой
4. **Мониторьте ресурсы** сервера регулярно

## Контакты

Если возникают проблемы с развертыванием, проверьте:
1. Логи Docker контейнеров
2. Конфигурацию .env файла
3. Доступность портов на сервере
4. Настройки firewall
