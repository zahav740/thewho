#!/bin/bash

# Production CRM - Build and Deploy Script
# Этот скрипт собирает и запускает продакшен версию

echo "🚀 Deploying Production CRM System..."

# Проверяем, что Docker установлен
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Останавливаем предыдущие контейнеры
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod down

# Удаляем старые образы
echo "🗑️ Removing old images..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod down --rmi all --volumes --remove-orphans

# Собираем новые образы
echo "🔨 Building new images..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

# Запускаем контейнеры
echo "🚀 Starting production containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Ждем запуска
echo "⏳ Waiting for services to start..."
sleep 30

# Проверяем статус
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

# Показываем логи
echo "📜 Recent logs:"
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=20

echo ""
echo "✅ Production deployment completed!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:3000/api"
echo "🗄️ Database: postgres://localhost:5432/production_crm"
echo ""
echo "📋 To view logs: docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.prod.yml --env-file .env.prod down"
