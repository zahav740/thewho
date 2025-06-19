# 🚨 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ API URL

## Проблема
Frontend обращается к `https://kasuf.xyz/api` вместо `http://31.128.35.6/api`, что вызывает ошибки `ERR_CONNECTION_REFUSED`.

## ✅ Быстрое решение

### На сервере выполните:

```bash
cd /var/www/thewho/backend
chmod +x fix-api-url.sh
./fix-api-url.sh
```

## 🔍 Диагностика проблемы

```bash
# Запустите диагностику
./diagnose-api.sh
```

## 📝 Ручное исправление

### 1. Исправьте .env.production в frontend:

```bash
cd /var/www/thewho/frontend
nano .env.production
```

Содержимое должно быть:
```
REACT_APP_API_URL=http://31.128.35.6/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

### 2. Пересоберите фронтенд:

```bash
npm run build
```

### 3. Перезапустите nginx:

```bash
sudo systemctl reload nginx
```

## 🧪 Проверка исправления

```bash
# Проверка API через браузер или curl
curl http://31.128.35.6/api/health
curl http://31.128.35.6/api/machines
```

## 🎯 Альтернативное решение (если нужен домен)

Если вы хотите использовать домен kasuf.xyz:

### 1. Настройте DNS:
- A запись kasuf.xyz → 31.128.35.6

### 2. Обновите nginx конфигурацию:
```bash
sudo nano /etc/nginx/sites-available/thewho
```

Добавьте server_name:
```nginx
server {
    listen 80;
    server_name kasuf.xyz www.kasuf.xyz 31.128.35.6;
    # остальная конфигурация...
}
```

### 3. Перезапустите nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Обновите .env.production:
```
REACT_APP_API_URL=http://kasuf.xyz/api
```

## 🚀 После исправления

1. Откройте http://31.128.35.6 в браузере
2. Проверьте в Developer Tools (F12) что нет ошибок сети
3. Убедитесь что данные загружаются (машины, заказы, операторы)

## 📞 Если проблемы остались

1. Запустите полную диагностику: `./diagnose-api.sh`
2. Проверьте логи: `tail -f /var/log/thewho-backend.log`
3. Убедитесь что backend работает: `curl http://localhost:5100/api/health`
