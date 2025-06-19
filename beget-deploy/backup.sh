#!/bin/bash

# Скрипт создания бэкапа TheWho CRM
backup_date=$(date +%Y%m%d_%H%M%S)
backup_dir="/var/www/thewho/backups"
echo "💾 Создание бэкапа TheWho CRM - $backup_date"

# Создание директории для бэкапов
mkdir -p $backup_dir

echo "📊 Бэкап базы данных Supabase..."
# Для Supabase бэкап нужно делать через их инструменты
# Экспортируем структуру и данные через pg_dump
PGPASSWORD="Magarel1!" pg_dump \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.kukqacmzfmzepdfddppl \
  -d postgres \
  --no-password \
  --format=custom \
  --compress=9 \
  --file="$backup_dir/database_backup_$backup_date.dump"

if [ $? -eq 0 ]; then
    echo "✅ Бэкап базы данных создан: database_backup_$backup_date.dump"
else
    echo "❌ Ошибка создания бэкапа базы данных"
fi

echo "📁 Бэкап файлов приложения..."
# Создание архива с исходным кодом и конфигурацией
tar -czf "$backup_dir/app_backup_$backup_date.tar.gz" \
  -C /var/www/thewho \
  --exclude=node_modules \
  --exclude='*.log' \
  --exclude=uploads \
  backend frontend

if [ $? -eq 0 ]; then
    echo "✅ Бэкап приложения создан: app_backup_$backup_date.tar.gz"
else
    echo "❌ Ошибка создания бэкапа приложения"
fi

echo "📋 Бэкап конфигурации Nginx..."
cp /etc/nginx/sites-available/thewho "$backup_dir/nginx_config_$backup_date.conf" 2>/dev/null || echo "⚠️ Конфиг Nginx не найден"

echo "📝 Создание информационного файла..."
cat > "$backup_dir/backup_info_$backup_date.txt" << EOF
TheWho CRM Backup Information
============================
Дата создания: $(date)
Версия приложения: Production
База данных: Supabase PostgreSQL
Сервер: 31.128.35.6

Файлы в бэкапе:
- database_backup_$backup_date.dump (база данных)
- app_backup_$backup_date.tar.gz (исходный код)
- nginx_config_$backup_date.conf (конфигурация Nginx)

Восстановление:
1. База данных: pg_restore --clean --if-exists -d postgres database_backup_$backup_date.dump
2. Приложение: tar -xzf app_backup_$backup_date.tar.gz -C /var/www/thewho/
3. Nginx: cp nginx_config_$backup_date.conf /etc/nginx/sites-available/thewho

Системная информация на момент бэкапа:
$(uname -a)
$(df -h /var/www/thewho)
$(free -h)
EOF

echo ""
echo "📊 Информация о бэкапах:"
ls -lh $backup_dir/

echo ""
echo "🗑️ Очистка старых бэкапов (старше 7 дней)..."
find $backup_dir -name "*backup_*" -type f -mtime +7 -delete
deleted_count=$(find $backup_dir -name "*backup_*" -type f -mtime +7 | wc -l)
echo "Удалено старых бэкапов: $deleted_count"

echo ""
echo "✅ Бэкап завершен!"
echo "📍 Расположение: $backup_dir"
echo "💾 Размер: $(du -sh $backup_dir | cut -f1)"
