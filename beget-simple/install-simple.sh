#!/bin/bash

# Простая установка CRM на Beget без Docker
echo "🚀 Установка Production CRM на Beget (простая версия)"

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен! Установите Node.js 18+"
    exit 1
fi

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен!"
    exit 1
fi

# Создание директорий
echo "📁 Создание директорий..."
mkdir -p uploads logs tmp

# Копирование конфигурации
if [ ! -f ".env" ]; then
    echo "⚙️ Копирование .env файла..."
    cp .env.beget .env
    echo "🔧 ВАЖНО: Отредактируйте файл .env с вашими настройками!"
    echo "Нажмите Enter после редактирования .env файла..."
    read
fi

# Установка зависимостей бэкенда
echo "📦 Установка зависимостей бэкенда..."
cd backend
npm ci --production
echo "🔨 Сборка бэкенда..."
npm run build
cd ..

# Сборка фронтенда
echo "📦 Сборка фронтенда..."
cd frontend
npm ci --production
npm run build
cd ..

# Создание файла запуска для бэкенда
echo "📝 Создание файлов запуска..."
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
export NODE_ENV=production
export PORT=3001
node dist/src/main.js
EOF

chmod +x start-backend.sh

# Создание файла запуска для фронтенда (если есть веб-сервер)
cat > start-frontend.sh << 'EOF'
#!/bin/bash
# Фронтенд собран в frontend/build
# Настройте ваш веб-сервер (Apache/Nginx) для обслуживания файлов из frontend/build
echo "Frontend собран в: $(pwd)/frontend/build"
echo "Настройте веб-сервер для обслуживания этой директории"
EOF

chmod +x start-frontend.sh

# Создание конфигурации Nginx
mkdir -p nginx-config
cat > nginx-config/site.conf << 'EOF'
server {
    listen 80;
    server_name ваш-домен.com;
    root /path/to/your/project/frontend/build;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 50M;
}
EOF

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте .env файл с настройками БД и доменом"
echo "2. Настройте PostgreSQL базу данных"
echo "3. Запустите миграции: cd backend && npm run migration:run"
echo "4. Запустите бэкенд: ./start-backend.sh"
echo "5. Настройте веб-сервер для frontend/build"
echo ""
echo "📁 Файлы:"
echo "- Backend запускается: ./start-backend.sh"
echo "- Frontend файлы в: frontend/build"
echo "- Nginx конфиг в: nginx-config/site.conf"
echo ""
echo "🌐 После настройки веб-сервера CRM будет доступна по вашему домену"
