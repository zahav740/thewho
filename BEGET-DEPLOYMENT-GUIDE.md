# 🚀 Руководство по развертыванию на Beget

## 📋 Подготовка

### 1. Запуск скрипта подготовки
```bash
BEGET-DEPLOYMENT-PREP.bat
```

Скрипт автоматически:
- ✅ Создаст production конфигурации
- ✅ Соберет backend (NestJS → JavaScript)
- ✅ Соберет frontend (Vite → статические файлы)
- ✅ Создаст архив kasuf-xyz-deployment.zip
- ✅ Подготовит все конфигурационные файлы

## 🌐 Архитектура развертывания

```
kasuf.xyz (Nginx)
├── Frontend (/)              → Vite статика
├── Backend API (/api/*)      → Proxy → localhost:5200
└── Health Check (/health)    → Proxy → localhost:5200
```

## 📁 Структура на сервере

```
/var/www/kasuf/data/www/kasuf.xyz/
├── backend/
│   ├── dist/              # Compiled JavaScript
│   ├── node_modules/      # Production dependencies
│   ├── logs/              # Application logs
│   ├── .env               # Production environment
│   └── package.json       # Production package.json
├── frontend/
│   └── dist/              # Vite build output
└── config/
    ├── ecosystem.beget.config.js  # PM2 configuration
    ├── nginx.beget.conf           # Nginx configuration
    └── deploy.sh                  # Deployment script
```

## 🔧 Конфигурация

### Backend (.env.production)
```env
NODE_ENV=production
PORT=5200
HTTPS=true

# Supabase Database
DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require

# CORS for kasuf.xyz
CORS_ORIGIN=https://kasuf.xyz,https://www.kasuf.xyz
```

### Frontend (.env.production)
```env
VITE_API_URL=https://kasuf.xyz/api
VITE_ENVIRONMENT=production
VITE_SSL=true
```

## 🚀 Развертывание

### Шаг 1: Загрузка файлов
```bash
# Загрузить архив на сервер
scp kasuf-xyz-deployment.zip user@kasuf.xyz:/var/www/kasuf/data/www/kasuf.xyz/

# Подключиться к серверу
ssh user@kasuf.xyz

# Распаковать архив
cd /var/www/kasuf/data/www/kasuf.xyz/
unzip kasuf-xyz-deployment.zip
```

### Шаг 2: Запуск развертывания
```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh

# Запустить развертывание
./deploy.sh
```

### Шаг 3: Настройка Nginx
```bash
# Скопировать конфигурацию nginx
sudo cp config/nginx.beget.conf /etc/nginx/sites-available/kasuf.xyz
sudo ln -s /etc/nginx/sites-available/kasuf.xyz /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить nginx
sudo systemctl restart nginx
```

### Шаг 4: SSL сертификаты
```bash
# Получить Let's Encrypt сертификат
sudo certbot --nginx -d kasuf.xyz -d www.kasuf.xyz

# Или загрузить собственные сертификаты в:
# /etc/ssl/certs/kasuf.xyz.crt
# /etc/ssl/private/kasuf.xyz.key
```

## 🔍 Проверка развертывания

### Проверка backend
```bash
# Проверка PM2
pm2 status
pm2 logs production-crm-backend

# Проверка порта
netstat -tlnp | grep :5200

# Health check
curl https://kasuf.xyz/health
```

### Проверка frontend
```bash
# Проверка файлов
ls -la /var/www/kasuf/data/www/kasuf.xyz/frontend/dist/

# Проверка доступности
curl -I https://kasuf.xyz
```

## 📊 Мониторинг

### PM2 команды
```bash
pm2 status                    # Статус приложения
pm2 logs                      # Логи в реальном времени
pm2 restart production-crm-backend  # Перезапуск
pm2 stop production-crm-backend     # Остановка
pm2 delete production-crm-backend   # Удаление
```

### Логи
```bash
# Backend логи
tail -f /var/www/kasuf/data/www/kasuf.xyz/backend/logs/combined.log

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔧 Обновление

### Для обновления приложения:
1. Запустить `BEGET-DEPLOYMENT-PREP.bat` локально
2. Загрузить новый архив на сервер
3. Запустить `./deploy.sh` (создаст backup автоматически)

### Откат к предыдущей версии:
```bash
# Остановить текущую версию
pm2 stop production-crm-backend

# Восстановить backup
mv backend backend.failed
mv backend.backup.YYYYMMDD-HHMMSS backend

# Запустить
pm2 start ecosystem.beget.config.js --env production
```

## 🌐 URLs после развертывания

- **Frontend**: https://kasuf.xyz
- **Backend API**: https://kasuf.xyz/api
- **Health Check**: https://kasuf.xyz/health
- **API Docs**: https://kasuf.xyz/api/docs

## ⚠️ Важные заметки

1. **SSL обязателен** - все настроено для HTTPS
2. **Supabase** - база данных уже настроена
3. **PM2** - управление процессами
4. **Nginx** - обслуживание статики и proxy для API
5. **Vite** - оптимизированная сборка frontend

## 🆘 Troubleshooting

### Backend не стартует
```bash
# Проверить логи
pm2 logs production-crm-backend

# Проверить переменные окружения
cat /var/www/kasuf/data/www/kasuf.xyz/backend/.env

# Проверить подключение к базе
node -e "console.log(process.env.DATABASE_URL)"
```

### Frontend не загружается
```bash
# Проверить nginx конфигурацию
sudo nginx -t

# Проверить файлы
ls -la /var/www/kasuf/data/www/kasuf.xyz/frontend/dist/

# Проверить права доступа
sudo chown -R www-data:www-data /var/www/kasuf/data/www/kasuf.xyz/
```

Все готово к развертыванию! 🚀