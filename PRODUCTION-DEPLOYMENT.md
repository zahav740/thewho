# Production CRM System - Deployment Guide

## 🚀 Быстрый старт

### Предварительные требования
- Docker Desktop
- Docker Compose
- Минимум 4GB RAM
- Минимум 10GB свободного места

### Развертывание

1. **Клонируйте проект и перейдите в директорию:**
   ```bash
   cd production-crm
   ```

2. **Запустите продакшен:**
   ```bash
   # Windows
   deploy.bat
   
   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Откройте браузер:**
   - Фронтенд: http://localhost
   - API: http://localhost:3000/api
   - Swagger документация: http://localhost:3000/api/docs

## 📊 Мониторинг

### Просмотр статуса:
```bash
# Windows
monitor.bat

# Linux/Mac
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### Просмотр логов:
```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f frontend
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f postgres
```

## 🛠️ Управление

### Остановка системы:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod down
```

### Полная очистка (осторожно! удалит все данные):
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod down --volumes --rmi all
```

### Бэкап базы данных:
```bash
docker exec production_crm_db pg_dump -U postgres production_crm > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление базы данных:
```bash
docker exec -i production_crm_db psql -U postgres production_crm < backup_file.sql
```

## 🔧 Конфигурация

### Основные файлы конфигурации:
- `.env.prod` - Переменные окружения для продакшена
- `docker-compose.prod.yml` - Docker Compose конфигурация
- `frontend/nginx.conf` - Nginx конфигурация для фронтенда
- `backend/.env.production` - Конфигурация бэкенда

### Важные переменные окружения:
```bash
DB_PASSWORD=production-postgres-password-2025  # Пароль БД
JWT_SECRET=production-jwt-secret-key           # JWT секрет
REACT_APP_API_URL=http://localhost:3000/api   # URL API для фронтенда
```

## 🔒 Безопасность

### Рекомендации для продакшена:
1. **Измените пароли по умолчанию** в `.env.prod`
2. **Настройте SSL/HTTPS** (добавьте сертификаты)
3. **Настройте файрвол** для ограничения доступа
4. **Регулярно делайте бэкапы** базы данных
5. **Мониторьте логи** на предмет подозрительной активности

### SSL Configuration (опционально):
```yaml
# В docker-compose.prod.yml добавьте:
volumes:
  - ./ssl:/etc/nginx/ssl
# И настройте nginx для HTTPS
```

## 📈 Производительность

### Оптимизация PostgreSQL:
```sql
-- Подключитесь к БД и выполните:
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### Мониторинг ресурсов:
```bash
# Использование ресурсов контейнерами
docker stats

# Использование места
docker system df
```

## 🆘 Устранение неполадок

### Проблемы с запуском:
1. **Проверьте логи:** `docker-compose logs`
2. **Проверьте порты:** `netstat -tulpn | grep :80`
3. **Перезапустите систему:** `docker-compose down && docker-compose up -d`

### Проблемы с базой данных:
```bash
# Проверка подключения к БД
docker exec production_crm_db pg_isready -U postgres -d production_crm

# Подключение к БД для диагностики
docker exec -it production_crm_db psql -U postgres -d production_crm
```

### Очистка логов (если диск заполняется):
```bash
docker system prune -a
docker volume prune
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи всех сервисов
2. Убедитесь, что все порты свободны
3. Проверьте доступное место на диске
4. Перезапустите Docker Desktop
5. Попробуйте полную переустановку

---

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
│   Port: 80      │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │   Docker        │
                    │   Network       │
                    └─────────────────┘
```

## 📋 Чек-лист для продакшена

- [ ] Docker и Docker Compose установлены
- [ ] Изменены пароли по умолчанию
- [ ] Настроена резервное копирование
- [ ] Настроен мониторинг
- [ ] Протестированы все основные функции
- [ ] Настроен файрвол
- [ ] Документация обновлена
- [ ] Команда обучена управлению системой

Удачного развертывания! 🎉
