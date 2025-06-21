#!/bin/bash

echo "🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ frontend-production.zip НА ПОРТУ 5201"
echo "=============================================================="

# Переход в директорию frontend
cd /var/upload/frontend

# Остановка frontend
echo "🛑 Остановка crm-frontend..."
pm2 stop crm-frontend

# Удаление старой сборки
echo "🗑️ Удаление старой сборки..."
rm -rf build

# Создание новой директории build
echo "📁 Создание директории build..."
mkdir build

# Распаковка архива
echo "📦 Распаковка frontend-production.zip..."
unzip -o frontend-production.zip -d build/

# Проверка содержимого
echo "📋 Содержимое build:"
ls -la build/

# Переход обратно в /var/upload для PM2
cd /var/upload

# Обновление PM2 конфигурации на порт 5201
echo "⚙️ Обновление PM2 для порта 5201..."
sed -i 's/-l 5101/-l 5201/g' ecosystem.config.js 2>/dev/null || true
sed -i 's/-l 5100/-l 5201/g' ecosystem.config.js 2>/dev/null || true

# Создание .env для frontend с портом 5201
echo "⚙️ Создание .env для порта 5201..."
cat > frontend/.env << 'EOF'
PORT=5201
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
EOF

# Перезапуск frontend
echo "🚀 Перезапуск crm-frontend на порту 5201..."
pm2 restart crm-frontend

# Если не запустился, принудительно запускаем
sleep 2
if ! pm2 list | grep -q "crm-frontend.*online"; then
    echo "⚠️ Frontend не запустился, принудительный запуск..."
    pm2 delete crm-frontend 2>/dev/null || true
    pm2 start serve --name crm-frontend -- -s frontend/build -l 5201
fi

pm2 save

# Проверка
echo "📊 Статус:"
pm2 status

echo "🧪 Тест порта 5201:"
sleep 2
if curl -s http://localhost:5201 >/dev/null; then
    echo "✅ Frontend работает на порту 5201"
else
    echo "❌ Frontend недоступен, проверьте логи: pm2 logs crm-frontend"
fi

echo ""
echo "✅ ГОТОВО! Frontend развернут на порту 5201"
echo "🌐 Доступ: https://kasuf.xyz"