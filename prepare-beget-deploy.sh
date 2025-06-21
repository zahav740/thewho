#!/bin/bash

echo "==================================="
echo "Подготовка к развертыванию на Beget"
echo "==================================="

# Создаем директории для развертывания
mkdir -p beget-deploy/frontend
mkdir -p beget-deploy/backend

echo "Копирование файлов..."

# Копируем архивы
cp frontend-beget.zip beget-deploy/frontend/
cp backend-beget.zip beget-deploy/backend/

# Создаем .env файлы
echo "Создание конфигурационных файлов..."

# Backend .env
cat > beget-deploy/backend/.env << 'EOF'
# Supabase Database Configuration
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.kukqacmzfmzepdfddppl
DB_PASSWORD=Magarel1!
DB_NAME=postgres

# JWT Configuration
JWT_SECRET=YourSuperSecretJWTKeyForBeget256BitsLong!
JWT_EXPIRES_IN=7d

# App Configuration
NODE_ENV=production
PORT=5200

# CORS для kasuf.xyz
CORS_ORIGIN=https://kasuf.xyz

# Database URL для TypeORM
DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Frontend Configuration
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/app/uploads

# Logging
LOG_LEVEL=info

# SSL Configuration
SSL_ENABLED=true

# TypeORM Configuration
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=true
EOF

# Frontend .env
cat > beget-deploy/frontend/.env << 'EOF'
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
PORT=5201
EOF

# PM2 конфигурация
cat > beget-deploy/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: '/var/upload/backend/dist/main.js',
      cwd: '/var/upload/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5200
      },
      restart_delay: 5000,
      max_restarts: 10
    },
    {
      name: 'crm-frontend',
      script: 'serve',
      args: '-s build -l 5201',
      cwd: '/var/upload/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 5201
      },
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};
EOF

# Nginx конфигурация
cat > beget-deploy/kasuf.xyz.nginx.conf << 'EOF'
# Frontend (основной сайт)
location / {
    proxy_pass http://127.0.0.1:5201;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
}

# Backend API
location /api/ {
    proxy_pass http://127.0.0.1:5200/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "https://kasuf.xyz" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://kasuf.xyz";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Access-Control-Allow-Credentials "true";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
}

# Health check
location /health {
    proxy_pass http://127.0.0.1:5200/health;
    proxy_set_header Host $host;
    access_log off;
}
EOF

# Скрипты запуска
cat > beget-deploy/start-backend.sh << 'EOF'
#!/bin/bash
echo "Запуск Backend на порту 5200..."
cd /var/upload/backend
export NODE_ENV=production
export PORT=5200
npm install --production
npm run build
npm start
EOF

cat > beget-deploy/start-frontend.sh << 'EOF'
#!/bin/bash
echo "Запуск Frontend на порту 5201..."
cd /var/upload/frontend
export PORT=5201
npm install --production
npm run build
npm install -g serve
serve -s build -l 5201
EOF

cat > beget-deploy/deploy-all.sh << 'EOF'
#!/bin/bash
echo "Полное развертывание на Beget..."

# Распаковка архивов
echo "Распаковка backend..."
cd /var/upload/backend
unzip -o backend-beget.zip

echo "Распаковка frontend..."
cd /var/upload/frontend  
unzip -o frontend-beget.zip

# Установка PM2
echo "Установка PM2..."
npm install -g pm2
npm install -g serve

# Копирование конфигурации
echo "Копирование конфигурации..."
cp /var/upload/ecosystem.config.js /var/upload/

# Запуск через PM2
echo "Запуск приложений..."
cd /var/upload
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "Развертывание завершено!"
echo "Backend: http://localhost:5200"
echo "Frontend: http://localhost:5201"
echo "Сайт: https://kasuf.xyz"
EOF

# Делаем скрипты исполняемыми
chmod +x beget-deploy/*.sh

echo ""
echo "✅ Подготовка завершена!"
echo ""
echo "Созданы файлы:"
echo "📁 beget-deploy/"
echo "  ├── frontend/frontend-beget.zip"
echo "  ├── backend/backend-beget.zip"
echo "  ├── .env файлы для frontend и backend"
echo "  ├── ecosystem.config.js (PM2)"
echo "  ├── kasuf.xyz.nginx.conf (Nginx)"
echo "  └── скрипты запуска"
echo ""
echo "Следующие шаги:"
echo "1. Загрузите содержимое beget-deploy/ на сервер в /var/upload/"
echo "2. Настройте Nginx согласно kasuf.xyz.nginx.conf"
echo "3. Запустите ./deploy-all.sh на сервере"
echo ""
echo "🚀 Готово к развертыванию!"