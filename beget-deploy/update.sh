#!/bin/bash

# Скрипт обновления CRM на Beget
echo "🔄 Обновление Production CRM..."

# Создание бэкапа базы данных
echo "💾 Создание бэкапа базы данных..."
docker exec crm-db pg_dump -U postgres thewho_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Остановка сервисов
echo "⏹️ Остановка сервисов..."
docker-compose -f docker-compose.beget.yml down

# Обновление кода
echo "📥 Обновление кода..."
# Здесь должен быть код для получения обновлений из git или загрузки нового архива

# Сборка и запуск
echo "🔨 Пересборка и запуск..."
docker-compose -f docker-compose.beget.yml up --build -d

# Запуск миграций
echo "🔄 Запуск миграций..."
sleep 30
cd backend
npm run migration:run
cd ..

# Проверка статуса
echo "✅ Проверка статуса..."
docker-compose -f docker-compose.beget.yml ps

echo "🎉 Обновление завершено!"
