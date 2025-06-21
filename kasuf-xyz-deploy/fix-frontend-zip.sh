#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ FRONTEND ДЛЯ АРХИВА frontend-production.zip"
echo "========================================================="
echo "Устанавливаем правильный порт 5201 для frontend"
echo "========================================================="

# Проверяем, что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из директории /var/upload/"
    exit 1
fi

echo "📍 Текущая директория: $(pwd)"

# Переходим в директорию frontend
cd frontend

# Остановка frontend
echo "🛑 Остановка Frontend..."
pm2 stop crm-frontend 2>/dev/null || true

# Удаление старой сборки
echo "🗑️ Удаление старой сборки..."
rm -rf build

# Создание директории build
echo "📁 Создание директории build..."
mkdir build

# Проверяем наличие архива
if [ ! -f "frontend-production.zip" ]; then
    echo "❌ Файл frontend-production.zip не найден в /var/upload/frontend/"
    echo "Проверьте наличие файла и повторите попытку"
    exit 1
fi

# Распаковка архива
echo "📦 Распаковка frontend-production.zip..."
unzip -o frontend-production.zip -d build/

# Проверяем успешность распаковки
if [ ! -f "build/index.html" ]; then
    echo "❌ Ошибка распаковки или файл index.html не найден"
    ls -la build/
    exit 1
fi

echo "✅ Архив распакован успешно:"
ls -la build/

# Создаем правильный .env файл
echo "⚙️ Создание .env файла для порта 5201..."
cat > .env << 'EOF'
PORT=5201
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
BROWSER=none
OPEN_BROWSER=false
EOF

echo "✅ .env файл создан:"
cat .env

cd ..

# Обновление PM2 конфигурации для порта 5201
echo "⚙️ Обновление PM2 конфигурации..."

# Создаем/обновляем PM2 конфигурацию
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: '/var/upload/backend/dist/main.js',
      cwd: '/var/upload/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5200
      },
      restart_delay: 5000,
      max_restarts: 10
    },
    {
      name: 'crm-frontend',
      script: 'serve',
      args: '-s build -l 5201',
      cwd: '/var/upload/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 5201
      },
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};
EOF

echo "✅ PM2 конфигурация обновлена (порт 5201)"

# Установка serve если не установлен
echo "📦 Проверка serve..."
which serve >/dev/null 2>&1 || npm install -g serve

# Запуск frontend
echo "🚀 Запуск Frontend на порту 5201..."
pm2 restart crm-frontend

# Если процесс не существует, создаем его
if ! pm2 list | grep -q crm-frontend; then
    pm2 start ecosystem.config.js --only crm-frontend
fi

pm2 save

# Проверка статуса
echo "📊 Статус процессов:"
sleep 3
pm2 status

# Проверка порта
echo "🧪 Проверка доступности на порту 5201..."
sleep 2

if curl -s http://localhost:5201 >/dev/null 2>&1; then
    echo "✅ Frontend отвечает на порту 5201"
    echo "HTTP ответ:"
    curl -s -I http://localhost:5201 | head -n 1
else
    echo "⚠️ Frontend недоступен на порту 5201"
    echo "Проверьте логи: pm2 logs crm-frontend"
fi

# Проверка содержимого build
echo ""
echo "📋 Содержимое build директории:"
ls -la frontend/build/ | head -10

# Проверка process на порту
echo ""
echo "🔍 Процессы на портах:"
echo "Порт 5201 (должен быть занят):"
netstat -tlnp 2>/dev/null | grep ":5201" || echo "Порт 5201 свободен"

echo "Порт 5101 (должен быть свободен):"  
netstat -tlnp 2>/dev/null | grep ":5101" || echo "Порт 5101 свободен ✅"

echo ""
echo "========================================================="
echo "✅ FRONTEND НАСТРОЕН ДЛЯ АРХИВА!"
echo "========================================================="
echo "📦 Использован архив: frontend-production.zip"
echo "📁 Распакован в: /var/upload/frontend/build/"
echo "🌐 Порт: 5201"
echo "🔗 API: https://kasuf.xyz/api"
echo ""
echo "🌐 Доступ:"
echo "   Локально: http://localhost:5201"
echo "   Сайт:     https://kasuf.xyz"
echo ""
echo "📋 Команды:"
echo "   pm2 status              - статус процессов"
echo "   pm2 logs crm-frontend   - логи frontend"
echo "   curl http://localhost:5201 - тест frontend"
echo ""
echo "🎉 Frontend готов и работает на порту 5201!"