#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ ПОРТА FRONTEND НА СЕРВЕРЕ"
echo "========================================"
echo "Меняем порт Frontend с 5101 на 5201"
echo "========================================"

# Проверяем, что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из директории /var/upload/"
    exit 1
fi

echo "📍 Текущая директория: $(pwd)"

# Остановка только frontend процесса
echo "🛑 Остановка Frontend..."
pm2 delete crm-frontend 2>/dev/null || true

# Исправление Frontend порта
echo "⚙️ Исправление порта Frontend..."
cd frontend

# Создаем/обновляем .env файл с правильным портом
echo "PORT=5201" > .env
echo "REACT_APP_API_URL=https://kasuf.xyz/api" >> .env
echo "REACT_APP_ENVIRONMENT=production" >> .env
echo "BROWSER=none" >> .env
echo "OPEN_BROWSER=false" >> .env

echo "✅ Frontend .env обновлен:"
echo "PORT=$(grep '^PORT=' .env)"
echo "API_URL=$(grep '^REACT_APP_API_URL=' .env)"

cd ..

# Обновление PM2 конфигурации для frontend
echo "⚙️ Обновление PM2 конфигурации..."

# Проверяем существует ли ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    # Делаем резервную копию
    cp ecosystem.config.js ecosystem.config.js.backup
fi

# Создаем обновленную PM2 конфигурацию
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

echo "✅ PM2 конфигурация обновлена (Frontend порт 5201)"

# Установка serve если не установлен
echo "📦 Проверка serve..."
which serve >/dev/null 2>&1 || npm install -g serve

# Пересборка Frontend если нужно
if [ ! -d "frontend/build" ]; then
    echo "🔨 Сборка Frontend..."
    cd frontend
    NODE_ENV=production npm run build
    cd ..
fi

# Запуск только Frontend с новой конфигурацией
echo "🚀 Запуск Frontend на порту 5201..."
pm2 start ecosystem.config.js --only crm-frontend
pm2 save

# Проверка статуса
echo "📊 Проверка статуса..."
sleep 3
pm2 status

# Проверка нового порта
echo "🧪 Проверка порта 5201..."
sleep 2

if curl -s http://localhost:5201 >/dev/null 2>&1; then
    echo "✅ Frontend работает на порту 5201"
else
    echo "⚠️ Frontend может быть недоступен на порту 5201"
    echo "Проверьте логи: pm2 logs crm-frontend"
fi

# Проверка что старый порт свободен
if netstat -tlnp 2>/dev/null | grep -q ":5101 "; then
    echo "⚠️ ВНИМАНИЕ: Порт 5101 все еще занят!"
    echo "Проверьте процессы: netstat -tlnp | grep 5101"
else
    echo "✅ Старый порт 5101 свободен"
fi

echo ""
echo "========================================"
echo "✅ ИСПРАВЛЕНИЕ ПОРТА ЗАВЕРШЕНО!"
echo "========================================"
echo "🔄 Изменения:"
echo "   Frontend: 5101 → 5201"
echo "   Backend остался: 5200"
echo ""
echo "🌐 Доступ:"
echo "   Сайт:     https://kasuf.xyz"
echo "   API:      https://kasuf.xyz/api"
echo "   Health:   https://kasuf.xyz/health"
echo ""
echo "📋 Команды:"
echo "   pm2 status           - статус"
echo "   pm2 logs crm-frontend - логи frontend"
echo "   curl http://localhost:5201 - тест frontend"
echo ""
echo "⚠️ Убедитесь что Nginx настроен на порт 5201!"
echo ""
echo "🎉 Frontend теперь работает на порту 5201!"