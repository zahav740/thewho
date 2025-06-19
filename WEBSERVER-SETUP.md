# Настройка веб-сервера на Beget для Production CRM

## Вариант 1: Apache (наиболее распространенный на Beget)

### Создайте файл .htaccess в корне сайта:

```apache
# Перенаправление API запросов на бэкенд
RewriteEngine On

# CORS headers для API
Header always set Access-Control-Allow-Origin "https://kasuf.xyz"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Проксирование API запросов
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/$1 [P,L]

# Обслуживание статических файлов React
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Кэширование статических ресурсов
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Сжатие
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Максимальный размер загружаемых файлов
php_value upload_max_filesize 50M
php_value post_max_size 50M
```

## Вариант 2: Nginx (если доступен)

### Создайте конфигурационный файл nginx.conf:

```nginx
server {
    listen 80;
    server_name kasuf.xyz www.kasuf.xyz;
    root /home/k/kasuf/kasuf.xyz/public_html;
    index index.html;

    # Логи
    access_log /home/k/kasuf/kasuf.xyz/logs/access.log;
    error_log /home/k/kasuf/kasuf.xyz/logs/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 50M;
}
```

## Структура файлов на сервере

```
/home/k/kasuf/kasuf.xyz/
├── public_html/              # Корень сайта
│   ├── index.html           # React build
│   ├── static/              # CSS, JS файлы
│   ├── .htaccess           # Apache конфигурация
│   └── api/                # (виртуальная папка)
├── crm/                    # CRM приложение
│   ├── backend/
│   ├── frontend/
│   ├── .env
│   └── start-backend.bat
└── logs/                   # Логи
```

## Настройка в панели Beget

### 1. Домены и поддомены
- Перейдите в "Сайты" → "Добавить сайт"
- Укажите домен kasuf.xyz
- Корневая папка: public_html

### 2. SSL сертификат
- "SSL" → "Let's Encrypt"
- Выберите домен kasuf.xyz
- Активируйте бесплатный сертификат

### 3. База данных
- "Базы данных" → "PostgreSQL"
- Создайте базу: thewho_prod
- Создайте пользователя с правами на эту базу
- Запишите данные для .env файла

### 4. Cron задачи (для автозапуска)
```bash
# Автозапуск бэкенда каждую минуту (если не запущен)
* * * * * cd /home/k/kasuf/crm && ./start-backend.sh >/dev/null 2>&1
```

## Проверка работы

### 1. Проверка бэкенда
```bash
curl http://localhost:3001/health
```

### 2. Проверка фронтенда
Откройте https://kasuf.xyz в браузере

### 3. Проверка API
```bash
curl https://kasuf.xyz/api/health
```

## Устранение проблем

### Если API не работает:
1. Проверьте, запущен ли бэкенд: `ps aux | grep node`
2. Проверьте логи: `tail -f logs/error.log`
3. Проверьте настройки CORS в .env файле

### Если фронтенд не загружается:
1. Проверьте права доступа к файлам
2. Проверьте .htaccess или nginx конфигурацию
3. Проверьте путь к статическим файлам

### Если база данных недоступна:
1. Проверьте настройки подключения в .env
2. Убедитесь, что PostgreSQL запущен
3. Проверьте права пользователя БД
