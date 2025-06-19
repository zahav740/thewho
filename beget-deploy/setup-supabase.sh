#!/bin/bash

# Скрипт установки CRM на Beget с Supabase
echo "🚀 Установка Production CRM на Beget с Supabase..."

# Проверка прав доступа
if [ "$EUID" -eq 0 ]; then
    echo "❌ Не запускайте скрипт под root!"
    exit 1
fi

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p uploads logs nginx

# Копирование env файла для Supabase
if [ ! -f ".env" ]; then
    echo "⚙️ Копирование .env файла для Supabase..."
    cp .env.beget.supabase .env
    echo "🔧 ВАЖНО: Отредактируйте файл .env с вашими настройками!"
fi

# Обновление main.ts для продакшена
echo "🔄 Подготовка backend для продакшена..."
cd backend
if [ -f "src/main.beget.ts" ]; then
    cp src/main.beget.ts src/main.ts
    echo "✅ main.ts обновлен для Beget"
fi

# Обновление ormconfig для Supabase
if [ -f "ormconfig.beget.ts" ]; then
    cp ormconfig.beget.ts ormconfig.ts
    echo "✅ ormconfig.ts обновлен для Supabase"
fi

# Установка зависимостей для бэкенда
echo "📦 Установка зависимостей бэкенда..."
npm ci --production

# Сборка бэкенда
echo "🔨 Сборка бэкенда..."
npm run build
cd ..

# Сборка фронтенда
echo "📦 Сборка фронтенда..."
cd frontend

# Обновление .env для фронтенда
echo "REACT_APP_API_URL=https://kasuf.xyz/api" > .env.production
echo "REACT_APP_ENVIRONMENT=production" >> .env.production

npm ci --production
npm run build
cd ..

# Проверка соединения с Supabase
echo "🔍 Проверка соединения с Supabase..."
cd backend
node -e "
const { checkDatabaseConnection } = require('./dist/ormconfig.js');
checkDatabaseConnection().then(success => {
  if (success) {
    console.log('✅ Supabase connection successful');
    process.exit(0);
  } else {
    console.log('❌ Supabase connection failed');
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Error checking connection:', err.message);
  process.exit(1);
});
"
cd ..

# Запуск контейнеров
echo "🐳 Запуск Docker контейнеров..."
docker-compose -f docker-compose.beget.supabase.yml up -d

# Ожидание запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 45

# Проверка статуса сервисов
echo "✅ Проверка статуса сервисов..."
docker-compose -f docker-compose.beget.supabase.yml ps

# Проверка health check
echo "🔍 Проверка API..."
sleep 10
if curl -f http://localhost:5100/health >/dev/null 2>&1; then
    echo "✅ Backend API работает"
else
    echo "❌ Backend API недоступен"
    echo "📋 Логи backend:"
    docker-compose -f docker-compose.beget.supabase.yml logs backend
fi

echo ""
echo "🎉 Установка завершена!"
echo "📋 Следующие шаги:"
echo "1. Убедитесь, что все настройки в .env корректны"
echo "2. Проверьте логи: docker-compose -f docker-compose.beget.supabase.yml logs"
echo "3. Настройте веб-сервер для проксирования на порты 5100 и 5101"
echo ""
echo "🌐 Frontend (порт 5101): http://localhost:5101"
echo "🔌 Backend API (порт 5100): http://localhost:5100"
echo "🔧 Health check: http://localhost:5100/health"
echo ""
echo "🔗 Для публичного доступа настройте Nginx на Beget:"
echo "   kasuf.xyz -> localhost:5101 (frontend)"
echo "   kasuf.xyz/api -> localhost:5100 (backend)"
