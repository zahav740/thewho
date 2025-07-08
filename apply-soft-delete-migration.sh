#!/bin/bash

# Скрипт для применения миграции soft delete
# Запускается из корня проекта

echo "🔧 Применение миграции для soft delete..."

# Проверяем наличие PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен. Установите PostgreSQL для продолжения."
    exit 1
fi

# Переменные окружения (настройте под свою базу данных)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-thewho_db}"
DB_USER="${DB_USER:-postgres}"

echo "📋 Параметры подключения:"
echo "  Хост: $DB_HOST"
echo "  Порт: $DB_PORT"
echo "  База: $DB_NAME"
echo "  Пользователь: $DB_USER"

# Путь к файлу миграции
MIGRATION_FILE="backend/src/database/migrations/add-soft-delete-to-orders.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

echo "📁 Найден файл миграции: $MIGRATION_FILE"

# Применяем миграцию
echo "🚀 Применение миграции..."

if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"; then
    echo "✅ Миграция успешно применена!"
    echo ""
    echo "📊 Проверяем результат:"
    
    # Проверяем что новые колонки добавлены
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d orders" | grep -E "(isDeleted|deletedAt|deletedBy)"
    
    if [ $? -eq 0 ]; then
        echo "✅ Новые колонки успешно добавлены в таблицу orders"
    else
        echo "⚠️ Не удалось найти новые колонки. Проверьте вывод выше."
    fi
    
    # Показываем структуру таблицы
    echo ""
    echo "📋 Структура таблицы orders:"
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d orders"
    
else
    echo "❌ Ошибка при применении миграции. Проверьте подключение к базе данных."
    exit 1
fi

echo ""
echo "🎉 Миграция завершена!"
echo "Теперь система поддерживает мягкое удаление заказов."
