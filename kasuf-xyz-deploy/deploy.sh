#!/bin/bash

echo "============================================"
echo "Развертывание CRM на kasuf.xyz"
echo "Backend: порт 5200 | Frontend: порт 5201"
echo "============================================"

# Проверка расположения
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Запустите скрипт из директории /var/upload/"
    exit 1
fi

# Создание директорий логов
mkdir -p /var/log/pm2

# Распаковка архивов
echo "📦 Распаковка архивов..."

echo "Распаковка backend..."
cd backend
if [ -f "backend-beget.zip" ]; then
    unzip -o backend-beget.zip
    echo "✅ Backend распакован"
else
    echo "❌ backend-beget.zip не найден!"
    exit 1
fi
cd ..

echo "Распаковка frontend..."
cd frontend  
if [ -f "frontend-beget.zip" ]; then
    unzip -o frontend-beget.zip
    echo "✅ Frontend распакован"
else
    echo "❌ frontend-beget.zip не найден!"
    exit 1
fi
cd ..

# Установка глобальных пакетов
echo "🌐 Установка PM2 и serve..."
npm install -g pm2 serve

# Backend сборка
echo "⚙️ Сборка Backend..."
cd backend
npm install --production
npm run build
cd ..

# Frontend сборка  
echo "🎨 Сборка Frontend..."
cd frontend
npm install --production
npm run build
cd ..

# Остановка старых процессов
echo "🔄 Остановка старых процессов..."
pm2 delete all 2>/dev/null || true

# Запуск приложений
echo "🚀 Запуск приложений..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Проверка статуса
echo "📊 Статус приложений:"
sleep 3
pm2 status

# Тестирование
echo "🧪 Тестирование..."
sleep 2

if curl -s http://localhost:5200/health > /dev/null; then
    echo "✅ Backend работает (порт 5200)"
else
    echo "⚠️ Backend недоступен"
fi

if curl -s http://localhost:5201 > /dev/null; then
    echo "✅ Frontend работает (порт 5201)"
else
    echo "⚠️ Frontend недоступен"
fi

echo ""
echo "============================================"
echo "✅ РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "============================================"
echo "🌐 Сайт: https://kasuf.xyz"
echo "📡 API: https://kasuf.xyz/api"
echo "💓 Health: https://kasuf.xyz/health"
echo ""
echo "📋 Команды управления:"
echo "pm2 status       - статус"
echo "pm2 logs         - логи"
echo "pm2 restart all  - перезапуск"
echo ""
echo "⚠️ Настройте Nginx в панели Beget!"
echo "🎉 CRM готов к работе!"