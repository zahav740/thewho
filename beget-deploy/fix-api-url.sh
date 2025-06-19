#!/bin/bash

# Скрипт исправления API URL для фронтенда
echo "🔧 Исправление API URL для TheWho CRM..."

# Переходим в директорию фронтенда
cd /var/www/thewho/frontend

# Создаем правильный .env.production файл
echo "📝 Создание правильного .env.production файла..."
cat > .env.production << EOF
REACT_APP_API_URL=http://31.128.35.6/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOF

echo "✅ .env.production создан с правильным API URL"

# Показываем содержимое
echo "📋 Содержимое .env.production:"
cat .env.production

echo ""
echo "🔨 Пересборка фронтенда..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Фронтенд успешно пересобран!"
    
    # Перезапускаем nginx для применения изменений
    echo "🔄 Перезапуск Nginx..."
    sudo systemctl reload nginx
    
    echo ""
    echo "🎉 Исправление завершено!"
    echo "🌐 Проверьте сайт: http://31.128.35.6"
    echo "🔌 API должно работать правильно"
    
else
    echo "❌ Ошибка при сборке фронтенда!"
    echo "Проверьте логи выше"
    exit 1
fi

echo ""
echo "🧪 Тестирование API:"
echo "Тест 1 - Health check:"
curl -s http://31.128.35.6/api/health | head -c 100
echo ""
echo "Тест 2 - Machines API:"
curl -s http://31.128.35.6/api/machines | head -c 100
echo ""
echo "Если тесты показывают данные, то всё работает!"
