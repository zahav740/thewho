# Настройка безопасности Production CRM

## 1. КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ ПЕРЕД РАЗВЕРТЫВАНИЕМ

### Измените все секреты в .env.production:
- [ ] `DB_PASSWORD` - минимум 20 символов
- [ ] `JWT_SECRET` - минимум 64 символа
- [ ] `REDIS_PASSWORD` - минимум 20 символов
- [ ] Добавьте новые секреты для дополнительной защиты

### Настройте файрвол на сервере:
```bash
# Разрешить только необходимые порты
ufw allow 22/tcp    # SSH (измените порт!)
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 5432/tcp   # PostgreSQL (только локально)
ufw deny 6379/tcp   # Redis (только локально)
ufw enable
```

## 2. NGINX КОНФИГУРАЦИЯ С БЕЗОПАСНОСТЬЮ

Файл создан: `/nginx/nginx-security.conf`

## 3. DOCKER SECURITY

Файл создан: `/docker-compose.security.yml`

## 4. BACKEND SECURITY

Файлы созданы:
- `/backend/src/middleware/security.middleware.ts`
- `/backend/src/guards/rate-limit.guard.ts`
- `/backend/src/filters/security-exception.filter.ts`

## 5. МОНИТОРИНГ И ЛОГИРОВАНИЕ

Файлы созданы:
- `/backend/src/modules/security/security.module.ts`
- `/monitoring/prometheus.yml`
- `/monitoring/alerts.yml`

## 6. ИНСТРУКЦИИ ПО РАЗВЕРТЫВАНИЮ

1. Скопируйте файлы безопасности на сервер
2. Измените все пароли и секреты
3. Настройте SSL сертификаты (Let's Encrypt)
4. Запустите с production конфигурацией
5. Настройте автоматические обновления
6. Настройте резервное копирование

## 7. ЕЖЕДНЕВНЫЕ ПРОВЕРКИ БЕЗОПАСНОСТИ

- [ ] Проверка логов на подозрительную активность
- [ ] Мониторинг использования ресурсов
- [ ] Проверка неудачных попыток входа
- [ ] Обновление зависимостей с уязвимостями

