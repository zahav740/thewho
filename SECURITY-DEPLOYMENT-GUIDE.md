# 🛡️ ИНСТРУКЦИЯ ПО БЕЗОПАСНОМУ РАЗВЕРТЫВАНИЮ PRODUCTION CRM

## 📋 КРАТКИЙ ЧЕКЛИСТ

### ⚠️ КРИТИЧЕСКИ ВАЖНО - ВЫПОЛНИТЕ ДО РАЗВЕРТЫВАНИЯ:

1. **Измените ВСЕ пароли и секреты в `.env.production`**
2. **Настройте домен и SSL сертификаты**
3. **Проверьте настройки файрвола**
4. **Настройте мониторинг и алерты**

---

## 🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ

### 1. Подготовка сервера
```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y

# Клонируйте репозиторий
git clone <your-repo> /app/production-crm
cd /app/production-crm
```

### 2. Настройка безопасности
```bash
# Скопируйте и настройте переменные окружения
cp .env.security .env.production

# ВАЖНО: Отредактируйте .env.production и измените все секреты!
nano .env.production

# Запустите автоматическую настройку безопасности
chmod +x deploy-secure.sh
sudo ./deploy-secure.sh
```

### 3. Настройка SSL (Let's Encrypt)
```bash
# Установите certbot
sudo apt install certbot python3-certbot-nginx -y

# Получите SSL сертификат
sudo certbot --nginx -d kasuf.xyz -d www.kasuf.xyz

# Автоматическое обновление сертификатов
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 ДЕТАЛЬНАЯ НАСТРОЙКА

### Структура файлов безопасности:
```
production-crm/
├── .env.security                     # Шаблон секретов
├── .env.production                   # Продакшн конфигурация
├── docker-compose.security.yml       # Защищенная Docker конфигурация
├── deploy-secure.sh                  # Скрипт автоматического развертывания
├── SECURITY-SETUP.md                 # Данная инструкция
├── nginx/
│   └── nginx-security.conf           # Защищенная конфигурация Nginx
├── backend/
│   ├── Dockerfile.security           # Защищенный Docker образ
│   ├── src/main.security.ts          # Защищенная точка входа
│   ├── src/middleware/security.middleware.ts
│   ├── src/guards/rate-limit.guard.ts
│   ├── src/filters/security-exception.filter.ts
│   └── src/modules/security/security.module.ts
├── frontend/
│   ├── Dockerfile.security           # Защищенный Docker образ
│   └── nginx.conf                    # Конфигурация Nginx для фронтенда
├── monitoring/
│   ├── prometheus.yml                # Конфигурация мониторинга
│   └── alerts.yml                    # Правила алертов
└── fail2ban/
    ├── jail.local                    # Конфигурация Fail2ban
    └── filter.d/                     # Фильтры безопасности
```

### Основные компоненты безопасности:

#### 🛡️ 1. Многоуровневая защита приложения:
- **Security Middleware** - проверка SQL инъекций, XSS, подозрительных User-Agent
- **Rate Limiting** - защита от DDoS и брутфорса
- **Input Validation** - строгая валидация всех входных данных
- **Security Headers** - HSTS, CSP, X-Frame-Options и др.
- **Exception Filtering** - безопасная обработка ошибок

#### 🚧 2. Инфраструктурная защита:
- **Nginx Reverse Proxy** - с защитой от атак
- **Fail2ban** - автоматическая блокировка атакующих IP
- **Файрвол UFW** - ограничение доступа к портам
- **Docker Security** - unprivileged контейнеры, read-only файловые системы

#### 📊 3. Мониторинг и алерты:
- **Prometheus** - сбор метрик безопасности
- **Security Module** - аналитика угроз
- **Логирование** - детальные логи всех событий безопасности
- **Automated Alerts** - уведомления о подозрительной активности

---

## 🔑 КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ

### 1. Измените секреты в .env.production:
```bash
# Сгенерируйте новые секреты
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)_DB_2025
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)_JWT_2025
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)_REDIS_2025

# Обновите остальные секреты
ENCRYPTION_KEY=$(openssl rand -base64 32)
API_SECRET_KEY=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

### 2. Настройте домен и CORS:
```bash
DOMAIN=kasuf.xyz
CORS_ORIGIN=https://kasuf.xyz
REACT_APP_API_URL=https://kasuf.xyz/api
```

### 3. Настройте мониторинг:
```bash
ENABLE_PROMETHEUS=true
ENABLE_AUDIT_LOG=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook
SECURITY_ALERT_EMAIL=admin@kasuf.xyz
```

---

## 🚨 МОНИТОРИНГ БЕЗОПАСНОСТИ

### Команды для проверки:
```bash
# Статус контейнеров
docker-compose -f docker-compose.security.yml ps

# Логи безопасности
docker-compose -f docker-compose.security.yml logs nginx | grep -i security
docker-compose -f docker-compose.security.yml logs backend | grep -i security

# Статус Fail2ban
sudo fail2ban-client status
sudo fail2ban-client status nginx-limit-req

# Проверка файрвола
sudo ufw status verbose

# Открытые порты
sudo netstat -tuln | grep LISTEN
```

### Важные логи:
- **Nginx Access**: `/var/log/nginx/kasuf_xyz_access.log`
- **Nginx Error**: `/var/log/nginx/kasuf_xyz_error.log`
- **Security Events**: `/var/log/crm-security/`
- **Fail2ban**: `/var/log/fail2ban.log`
- **Deployment**: `/var/log/crm-deployment.log`

---

## 🔄 ОБСЛУЖИВАНИЕ

### Ежедневные проверки:
```bash
# Проверка подозрительной активности
sudo fail2ban-client status | grep "Currently banned"

# Проверка использования ресурсов
docker stats --no-stream

# Проверка логов на ошибки
tail -100 /var/log/nginx/kasuf_xyz_error.log | grep -i error
```

### Еженедельные задачи:
```bash
# Обновление безопасности
sudo apt update && sudo apt upgrade -y

# Проверка сертификатов SSL
sudo certbot certificates

# Очистка логов
sudo logrotate -f /etc/logrotate.d/crm
```

### Ежемесячные задачи:
```bash
# Обновление Docker образов
docker-compose -f docker-compose.security.yml pull
docker-compose -f docker-compose.security.yml up -d

# Проверка резервных копий
ls -la /var/backups/crm/
```

---

## 🆘 ЭКСТРЕННЫЕ ПРОЦЕДУРЫ

### При атаке:
```bash
# Блокировка IP адреса
sudo fail2ban-client set nginx-limit-req banip <IP>

# Временное отключение сайта
docker-compose -f docker-compose.security.yml stop nginx

# Просмотр активных атак
sudo tail -f /var/log/nginx/kasuf_xyz_access.log | grep -v "200\|304"
```

### При компрометации:
```bash
# Смена всех паролей
nano .env.production  # Измените все секреты

# Перезапуск с новыми секретами
docker-compose -f docker-compose.security.yml down
docker-compose -f docker-compose.security.yml up -d

# Создание экстренного бэкапа
/usr/local/bin/crm-backup.sh
```

---

## 📞 КОНТАКТЫ ПОДДЕРЖКИ

- **Администратор**: admin@kasuf.xyz
- **Техподдержка**: support@kasuf.xyz
- **Экстренная связь**: +7 (XXX) XXX-XX-XX

---

## ✅ ФИНАЛЬНАЯ ПРОВЕРКА

После развертывания убедитесь что:

- [ ] Все пароли в `.env.production` изменены
- [ ] SSL сертификаты настроены и работают
- [ ] Файрвол настроен и активен
- [ ] Fail2ban запущен и работает
- [ ] Приложение доступно по HTTPS
- [ ] Мониторинг работает
- [ ] Резервное копирование настроено
- [ ] Логирование работает
- [ ] Алерты настроены

**🎉 Поздравляем! Ваше приложение защищено по всем стандартам безопасности.**

---

*Документ создан: 27 июня 2025*  
*Версия: 1.0*  
*Статус: Production Ready*
