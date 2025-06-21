#!/bin/bash

echo "============================================"
echo "🔧 АВТОМАТИЧЕСКАЯ НАСТРОЙКА ПОРТОВ BEGET"
echo "============================================"
echo "Устанавливает правильные порты для production:"
echo "Backend: 5200 | Frontend: 5201"
echo "============================================"

# Проверяем расположение
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Запустите скрипт из директории /var/upload/"
    echo "Текущая директория: $(pwd)"
    exit 1
fi

# Остановка процессов
echo "🛑 Остановка всех процессов..."
pm2 delete all 2>/dev/null || true

# Настройка Backend для production
echo "⚙️ Настройка Backend (порт 5200)..."
cd backend

# Создаем правильный .env для production
cat > .env << 'EOF'
# PRODUCTION BEGET
NODE_ENV=production
PORT=5200

# Supabase Database
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.kukqacmzfmzepdfddppl
DB_PASSWORD=Magarel1!
DB_NAME=postgres
DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# CORS для kasuf.xyz
CORS_ORIGIN=https://kasuf.xyz

# JWT
JWT_SECRET=YourSuperSecretJWTKeyForBeget256BitsLong!
JWT_EXPIRES_IN=7d

# TypeORM
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=true

# Другие настройки
LOG_LEVEL=info
SSL_ENABLED=true
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/app/uploads
EOF

echo "✅ Backend .env создан (порт 5200)"
cd ..

# Настройка Frontend для production  
echo "⚙️ Настройка Frontend (порт 5201)..."
cd frontend

# Создаем правильный .env для production
cat > .env << 'EOF'
# PRODUCTION BEGET
PORT=5201
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
BROWSER=none
OPEN_BROWSER=false
EOF

echo "✅ Frontend .env создан (порт 5201)"
cd ..

# Создаем правильную PM2 конфигурацию
echo "⚙️ Создание PM2 конфигурации..."
cat > ecosystem.config.js << 'EOF'
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
      max_restarts: 10,
      error_file: '/var/log/pm2/crm-backend-error.log',
      out_file: '/var/log/pm2/crm-backend-out.log'
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
      max_restarts: 10,
      error_file: '/var/log/pm2/crm-frontend-error.log',
      out_file: '/var/log/pm2/crm-frontend-out.log'
    }
  ]
};
EOF

echo "✅ PM2 конфигурация создана"

# Создание директории для логов
mkdir -p /var/log/pm2

# Установка serve если не установлен
echo "📦 Проверка serve..."
which serve >/dev/null 2>&1 || npm install -g serve

# Пересборка при необходимости
echo "🔨 Проверка сборки..."

if [ ! -d "backend/dist" ]; then
    echo "Сборка Backend..."
    cd backend
    npm run build
    cd ..
fi

if [ ! -d "frontend/build" ]; then
    echo "Сборка Frontend..."
    cd frontend
    NODE_ENV=production npm run build
    cd ..
fi

# Запуск приложений
echo "🚀 Запуск приложений..."
pm2 start ecosystem.config.js
pm2 save

# Настройка автозапуска
pm2 startup >/dev/null 2>&1 || true

# Проверка статуса
echo "📊 Проверка статуса..."
sleep 3
pm2 status

# Проверка портов
echo "🧪 Проверка портов..."
sleep 2

if curl -s http://localhost:5200/health >/dev/null 2>&1; then
    echo "✅ Backend работает на порту 5200"
else
    echo "⚠️ Backend может быть недоступен на порту 5200"
fi

if curl -s http://localhost:5201 >/dev/null 2>&1; then
    echo "✅ Frontend работает на порту 5201"
else
    echo "⚠️ Frontend может быть недоступен на порту 5201"
fi

echo ""
echo "============================================"
echo "✅ НАСТРОЙКА ПОРТОВ ЗАВЕРШЕНА!"
echo "============================================"
echo "🎯 Правильные порты установлены:"
echo "   Backend:  5200 (Supabase)"
echo "   Frontend: 5201 (kasuf.xyz API)"
echo ""
echo "🌐 Доступ:"
echo "   Сайт:     https://kasuf.xyz"
echo "   API:      https://kasuf.xyz/api"
echo "   Health:   https://kasuf.xyz/health"
echo ""
echo "📋 Управление:"
echo "   pm2 status    - статус"
echo "   pm2 logs      - логи"
echo "   pm2 restart all - перезапуск"
echo ""
echo "⚠️ Убедитесь что Nginx настроен на порты 5200/5201!"
echo ""
echo "🎉 Теперь порты настроены правильно!"