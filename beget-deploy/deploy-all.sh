#!/bin/bash

echo "============================================"
echo "Полное развертывание CRM на Beget"
echo "Домен: https://kasuf.xyz"
echo "Backend: порт 5200"
echo "Frontend: порт 5201"
echo "============================================"

# Проверка текущей директории
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Ошибка: запустите скрипт из директории /var/upload/"
    exit 1
fi

# Создание директорий логов для PM2
echo "📁 Создание директорий..."
mkdir -p /var/log/pm2

# Распаковка архивов
echo "📦 Распаковка архивов..."

if [ -f "backend/backend-beget.zip" ]; then
    echo "Распаковка backend..."
    cd backend
    unzip -o backend-beget.zip
    cd ..
else
    echo "❌ Файл backend/backend-beget.zip не найден!"
    exit 1
fi

if [ -f "frontend/frontend-beget.zip" ]; then
    echo "Распаковка frontend..."
    cd frontend
    unzip -o frontend-beget.zip
    cd ..
else
    echo "❌ Файл frontend/frontend-beget.zip не найден!"
    exit 1
fi

# Проверка Node.js
echo "🔧 Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

echo "Node.js версия: $(node --version)"
echo "NPM версия: $(npm --version)"

# Установка глобальных пакетов
echo "🌐 Установка PM2 и serve..."
npm install -g pm2
npm install -g serve

# Backend - установка зависимостей и сборка
echo "⚙️ Настройка Backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Файл package.json не найден в backend!"
    exit 1
fi

echo "Установка зависимостей backend..."
npm install --production

echo "Сборка backend..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Сборка backend не удалась!"
    exit 1
fi

cd ..

# Frontend - установка зависимостей и сборка
echo "🎨 Настройка Frontend..."
cd frontend

if [ ! -f "package.json" ]; then
    echo "❌ Файл package.json не найден в frontend!"
    exit 1
fi

echo "Установка зависимостей frontend..."
npm install --production

echo "Сборка frontend..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Сборка frontend не удалась!"
    exit 1
fi

cd ..

# Остановка существующих процессов PM2
echo "🔄 Остановка существующих процессов..."
pm2 delete all 2>/dev/null || true

# Запуск через PM2
echo "🚀 Запуск приложений..."
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
echo "💾 Сохранение конфигурации PM2..."
pm2 save

# Настройка автозапуска
echo "🔄 Настройка автозапуска..."
pm2 startup

# Проверка статуса
echo "📊 Проверка статуса приложений..."
sleep 5
pm2 status

# Тест доступности
echo "🧪 Тестирование доступности..."

echo "Тест Backend (порт 5200)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5200/health | grep -q "200"; then
    echo "✅ Backend доступен на порту 5200"
else
    echo "⚠️ Backend может быть недоступен. Проверьте логи: pm2 logs crm-backend"
fi

echo "Тест Frontend (порт 5201)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5201 | grep -q "200"; then
    echo "✅ Frontend доступен на порту 5201"
else
    echo "⚠️ Frontend может быть недоступен. Проверьте логи: pm2 logs crm-frontend"
fi

echo ""
echo "============================================"
echo "✅ Развертывание завершено!"
echo "============================================"
echo ""
echo "📍 Информация о приложении:"
echo "   Backend:  http://localhost:5200"
echo "   Frontend: http://localhost:5201"
echo "   Сайт:     https://kasuf.xyz"
echo "   API:      https://kasuf.xyz/api"
echo "   Health:   https://kasuf.xyz/health"
echo ""
echo "📋 Полезные команды:"
echo "   pm2 status              - статус приложений"
echo "   pm2 logs                - просмотр логов"
echo "   pm2 restart all         - перезапуск"
echo "   pm2 logs crm-backend    - логи backend"
echo "   pm2 logs crm-frontend   - логи frontend"
echo ""
echo "⚠️ ВАЖНО: Настройте Nginx согласно kasuf.xyz.nginx.conf"
echo "   в панели управления Beget!"
echo ""
echo "🎉 Ваш CRM готов к работе!"