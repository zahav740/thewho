#!/bin/bash

echo "🔧 Быстрое исправление ошибки 400 Bad Request..."

# Проверяем, запущен ли backend
if ! curl -s http://localhost:5100/api/health >/dev/null 2>&1; then
    echo "❌ Backend не запущен на порту 5100"
    echo "📋 Запустите backend:"
    echo "  cd backend"
    echo "  npm run start:dev"
    exit 1
fi

echo "✅ Backend запущен"

# Применяем миграцию
echo "📋 Применяем миграцию soft delete..."

if [ -f "backend/src/database/migrations/add-soft-delete-to-orders.sql" ]; then
    # Пытаемся применить миграцию (если настроена БД)
    if [ ! -z "$DB_HOST" ] && [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ]; then
        echo "🚀 Применяем миграцию к БД..."
        psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -f "backend/src/database/migrations/add-soft-delete-to-orders.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Миграция применена"
        else
            echo "⚠️ Миграция не применена, но это не критично"
        fi
    else
        echo "⚠️ Переменные БД не настроены, пропускаем миграцию"
    fi
else
    echo "⚠️ Файл миграции не найден"
fi

# Перезапускаем backend
echo "🔄 Перезапускаем backend..."
cd backend

# Останавливаем если запущен
pkill -f "npm.*start"
pkill -f "node.*main.js"

# Ждем немного
sleep 2

# Запускаем заново
echo "🚀 Запускаем backend..."
npm run start:dev &

# Ждем запуска
sleep 5

# Проверяем что запустился
if curl -s http://localhost:5100/api/health >/dev/null 2>&1; then
    echo "✅ Backend успешно перезапущен"
else
    echo "❌ Backend не запустился. Проверьте логи:"
    echo "  cd backend && npm run start:dev"
fi

# Тестируем API заказов
echo "🧪 Тестируем API заказов..."
if curl -s "http://localhost:5100/api/orders?page=1&limit=5" >/dev/null 2>&1; then
    echo "✅ API заказов работает"
else
    echo "❌ API заказов не работает"
    echo "📋 Возможные решения:"
    echo "  1. Убедитесь что БД запущена"
    echo "  2. Проверьте переменные окружения"
    echo "  3. Примените миграцию вручную"
fi

echo ""
echo "🎉 Исправление завершено!"
echo "📋 Если проблема остается:"
echo "  1. Проверьте логи backend: cd backend && npm run start:dev"
echo "  2. Примените миграцию: ./apply-soft-delete-migration.sh"
echo "  3. Убедитесь что БД доступна"
