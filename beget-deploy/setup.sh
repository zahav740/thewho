#!/bin/bash

# Скрипт установки CRM на Beget
echo "🚀 Установка Production CRM на Beget..."

# Проверка прав доступа
if [ "$EUID" -eq 0 ]; then
    echo "❌ Не запускайте скрипт под root!"
    exit 1
fi

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p uploads logs nginx

# Копирование env файла
if [ ! -f ".env" ]; then
    echo "⚙️ Копирование .env файла..."
    cp .env.beget .env
    echo "🔧 ВАЖНО: Отредактируйте файл .env с вашими настройками!"
fi

# Установка зависимостей для бэкенда
echo "📦 Установка зависимостей бэкенда..."
cd backend
npm ci --production
cd ..

# Создание пользователя для базы данных
echo "🗄️ Настройка базы данных..."
echo "Создание пользователя PostgreSQL и базы данных..."

# Запуск контейнеров
echo "🐳 Запуск Docker контейнеров..."
docker-compose -f docker-compose.beget.yml up -d

# Ожидание запуска базы данных
echo "⏳ Ожидание запуска базы данных..."
sleep 30

# Запуск миграций
echo "🔄 Запуск миграций базы данных..."
cd backend
npm run migration:run
cd ..

# Проверка статуса сервисов
echo "✅ Проверка статуса сервисов..."
docker-compose -f docker-compose.beget.yml ps

echo ""
echo "🎉 Установка завершена!"
echo "📋 Следующие шаги:"
echo "1. Отредактируйте .env файл с вашими настройками"
echo "2. Перезапустите сервисы: docker-compose -f docker-compose.beget.yml restart"
echo "3. Проверьте логи: docker-compose -f docker-compose.beget.yml logs"
echo ""
echo "🌐 CRM будет доступна по адресу: http://ваш-домен.beget.tech:3000"
echo "🔌 API будет доступно по адресу: http://ваш-домен.beget.tech:3001"
