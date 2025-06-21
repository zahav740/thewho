#!/bin/bash

echo "🔒 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ HTTP → HTTPS"
echo "====================================="
echo "Заменяем http://kasuf.xyz на https://kasuf.xyz"
echo "====================================="

cd /var/upload/frontend

# Остановка frontend
echo "🛑 Остановка Frontend..."
pm2 stop crm-frontend

# Проверяем текущие HTTP ссылки
echo "🔍 Поиск HTTP ссылок..."
grep -r "http://kasuf\.xyz" build/ 2>/dev/null || echo "HTTP ссылки не найдены"

# Замена HTTP на HTTPS
echo "🔒 Замена HTTP на HTTPS..."
find build/ -name "*.js" -exec sed -i 's|http://kasuf\.xyz|https://kasuf.xyz|g' {} \;
find build/ -name "*.html" -exec sed -i 's|http://kasuf\.xyz|https://kasuf.xyz|g' {} \;
find build/ -name "*.css" -exec sed -i 's|http://kasuf\.xyz|https://kasuf.xyz|g' {} \;

# Дополнительные замены для API
find build/ -name "*.js" -exec sed -i 's|kasuf\.xyz/api|kasuf.xyz/api|g' {} \;

# Проверка результата
echo "✅ Проверка замены:"
if grep -r "http://kasuf\.xyz" build/ 2>/dev/null; then
    echo "⚠️ Еще остались HTTP ссылки:"
    grep -r "http://kasuf\.xyz" build/ 2>/dev/null
else
    echo "✅ Все HTTP ссылки заменены на HTTPS"
fi

# Проверяем HTTPS ссылки
https_count=$(grep -r "https://kasuf\.xyz" build/ 2>/dev/null | wc -l || echo 0)
echo "✅ Найдено $https_count HTTPS ссылок на kasuf.xyz"

cd /var/upload

# Запуск frontend
echo "🚀 Запуск Frontend..."
pm2 restart crm-frontend

# Проверка статуса
echo "📊 Статус:"
sleep 2
pm2 status

echo ""
echo "====================================="
echo "✅ HTTP → HTTPS ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "====================================="
echo "🔒 Все ссылки теперь используют HTTPS"
echo "🌐 Попробуйте войти на https://kasuf.xyz"
echo ""
echo "📋 Если проблемы остались:"
echo "   pm2 logs crm-frontend"
echo "   curl https://kasuf.xyz/api/health"