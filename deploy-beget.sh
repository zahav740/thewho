#!/bin/bash

# Скрипт развертывания на Beget
# Запускать из корневой директории проекта

echo "🚀 Начинаем развертывание production-crm на Beget..."

# 1. Сборка фронтенда
echo "📦 Сборка фронтенда..."
cd frontend
npm ci --production
npm run build
cd ..

# 2. Сборка бэкенда
echo "📦 Сборка бэкенда..."
cd backend
npm ci --production
npm run build
cd ..

# 3. Создание архива для загрузки
echo "📦 Создание архива..."
tar -czf production-crm-beget.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=*.log \
  --exclude=uploads \
  backend/dist \
  backend/package.json \
  backend/package-lock.json \
  frontend/build \
  frontend/nginx.conf \
  .env.production \
  docker-compose.beget.yml \
  beget-deploy

echo "✅ Архив production-crm-beget.tar.gz создан!"
echo "🔧 Следующие шаги:"
echo "1. Загрузите архив на сервер Beget"
echo "2. Распакуйте архив"
echo "3. Запустите beget-deploy/setup.sh"
