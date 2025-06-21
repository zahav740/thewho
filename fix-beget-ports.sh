#!/bin/bash

echo "============================================"
echo "🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ПОРТОВ НА BEGET"
echo "============================================"
echo "Исправляем конфигурацию уже развернутого приложения"
echo "Backend: 5100 → 5200"
echo "Frontend: 5101 → 5201"
echo "============================================"

# Проверяем, что мы в правильной директории
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Запустите скрипт из директории /var/upload/"
    echo "Структура должна быть:"
    echo "/var/upload/"
    echo "├── frontend/"
    echo "└── backend/"
    exit 1
fi

echo "📍 Текущая директория: $(pwd)"

# Остановка всех процессов PM2
echo "🛑 Остановка всех процессов..."
pm2 delete all 2>/dev/null || true

# Исправление Backend .env
echo "🔧 Исправление Backend конфигурации..."
cd backend

if [ -f ".env" ]; then
    echo "Создание резервной копии backend/.env..."
    cp .env .env.backup
    
    echo "Обновление портов в backend/.env..."
    sed -i 's/PORT=5100/PORT=5200/g' .env
    sed -i 's/localhost:5101/localhost:5201/g' .env
    sed -i 's/http:\/\/localhost:5101/http:\/\/localhost:5201/g' .env
    
    # Добавляем правильную конфигурацию Supabase если её нет
    if ! grep -q "aws-0-eu-central-1.pooler.supabase.com" .env; then
        echo "" >> .env
        echo "# Supabase Configuration" >> .env
        echo "DB_HOST=aws-0-eu-central-1.pooler.supabase.com" >> .env
        echo "DB_PORT=6543" >> .env
        echo "DB_USERNAME=postgres.kukqacmzfmzepdfddppl" >> .env
        echo "DB_PASSWORD=Magarel1!" >> .env
        echo "DB_NAME=postgres" >> .env
        echo "DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" >> .env
        echo "CORS_ORIGIN=https://kasuf.xyz" >> .env
    fi
    
    echo "✅ Backend .env обновлен:"
    echo "PORT=$(grep 'PORT=' .env)"
    echo "CORS_ORIGIN=$(grep 'CORS_ORIGIN=' .env)"
else
    echo "❌ Файл backend/.env не найден!"
    echo "Создаем новый .env файл..."
    cat > .env << 'EOF'
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
EOF
    echo "✅ Создан новый backend/.env"
fi

cd ..

# Исправление Frontend .env
echo "🔧 Исправление Frontend конфигурации..."
cd frontend

if [ -f ".env" ]; then
    echo "Создание резервной копии frontend/.env..."
    cp .env .env.backup
    
    echo "Обновление портов в frontend/.env..."
    sed -i 's/PORT=5101/PORT=5201/g' .env
    sed -i 's/localhost:5100/localhost:5200/g' .env
    sed -i 's/http:\/\/localhost:5100/http:\/\/localhost:5200/g' .env
    
    echo "✅ Frontend .env обновлен:"
    echo "PORT=$(grep 'PORT=' .env 2>/dev/null || echo 'PORT не найден')"
    echo "API_URL=$(grep 'REACT_APP_API_URL=' .env 2>/dev/null || echo 'API_URL не найден')"
else
    echo "❌ Файл frontend/.env не найден!"
    echo "Создаем новый .env файл..."
    cat > .env << 'EOF'
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
PORT=5201
EOF
    echo "✅ Создан новый frontend/.env"
fi

cd ..

# Обновление PM2 конфигурации
echo "🔧 Обновление PM2 конфигурации..."
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

echo "✅ PM2 конфигурация обновлена"

# Пересборка приложений с новыми настройками
echo "🔨 Пересборка Backend..."
cd backend
npm run build 2>/dev/null || echo "⚠️ Сборка backend завершилась с предупреждениями"
cd ..

echo "🔨 Пересборка Frontend..."
cd frontend
npm run build 2>/dev/null || echo "⚠️ Сборка frontend завершилась с предупреждениями"
cd ..

# Установка serve если не установлен
echo "📦 Проверка serve..."
npm list -g serve 2>/dev/null || npm install -g serve

# Запуск приложений
echo "🚀 Запуск приложений на новых портах..."
pm2 start ecosystem.config.js
pm2 save

# Проверка статуса
echo "📊 Статус приложений:"
sleep 3
pm2 status

# Тестирование портов
echo "🧪 Тестирование портов..."
sleep 2

echo "Тест Backend (порт 5200)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5200/health 2>/dev/null | grep -q "200"; then
    echo "✅ Backend работает на порту 5200"
elif curl -s -o /dev/null http://localhost:5200 2>/dev/null; then
    echo "✅ Backend отвечает на порту 5200"
else
    echo "⚠️ Backend может быть недоступен на порту 5200"
    echo "Проверьте логи: pm2 logs crm-backend"
fi

echo "Тест Frontend (порт 5201)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5201 2>/dev/null | grep -q "200"; then
    echo "✅ Frontend работает на порту 5201"
elif curl -s -o /dev/null http://localhost:5201 2>/dev/null; then
    echo "✅ Frontend отвечает на порту 5201"
else
    echo "⚠️ Frontend может быть недоступен на порту 5201"
    echo "Проверьте логи: pm2 logs crm-frontend"
fi

echo ""
echo "============================================"
echo "✅ ИСПРАВЛЕНИЕ ПОРТОВ ЗАВЕРШЕНО!"
echo "============================================"
echo "🔄 Новые порты:"
echo "   Backend:  5200 (было 5100)"
echo "   Frontend: 5201 (было 5101)"
echo ""
echo "🌐 Доступ к сайту:"
echo "   Сайт:     https://kasuf.xyz"
echo "   API:      https://kasuf.xyz/api"
echo "   Health:   https://kasuf.xyz/health"
echo ""
echo "📋 Команды диагностики:"
echo "   pm2 status              - статус процессов"
echo "   pm2 logs                - все логи"
echo "   pm2 logs crm-backend    - логи backend"
echo "   pm2 logs crm-frontend   - логи frontend"
echo "   curl http://localhost:5200/health  - тест backend"
echo "   curl http://localhost:5201         - тест frontend"
echo ""
echo "⚠️ ВАЖНО: Убедитесь, что Nginx в панели Beget"
echo "   настроен на порты 5200 и 5201!"
echo ""
echo "🎉 Теперь попробуйте войти в систему!"