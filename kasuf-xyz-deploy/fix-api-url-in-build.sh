#!/bin/bash

echo "🔧 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ API URL В СОБРАННОМ FRONTEND"
echo "===================================================="
echo "Заменяем localhost:5100 на https://kasuf.xyz в сборке"
echo "===================================================="

# Проверяем, что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из директории /var/upload/"
    exit 1
fi

cd frontend

# Остановка frontend
echo "🛑 Остановка Frontend..."
pm2 stop crm-frontend 2>/dev/null || true

# Проверяем наличие build директории
if [ ! -d "build" ]; then
    echo "❌ Директория build не найдена!"
    echo "Сначала распакуйте архив:"
    echo "rm -rf build && mkdir build && unzip -o frontend-production.zip -d build/"
    exit 1
fi

echo "📁 Работаем с директорией: $(pwd)/build"

# Поиск и замена во всех JS файлах
echo "🔍 Поиск файлов с localhost:5100..."
grep -r "localhost:5100" build/ || echo "Файлы с localhost:5100 не найдены"

echo "🔍 Поиск файлов с localhost:5101..."  
grep -r "localhost:5101" build/ || echo "Файлы с localhost:5101 не найдены"

echo "🔄 Замена API URL в JavaScript файлах..."

# Замена в основных JS файлах
find build/ -name "*.js" -type f -exec sed -i 's|http://localhost:5100/api|https://kasuf.xyz/api|g' {} \;
find build/ -name "*.js" -type f -exec sed -i 's|http://localhost:5101/api|https://kasuf.xyz/api|g' {} \;
find build/ -name "*.js" -type f -exec sed -i 's|localhost:5100|kasuf.xyz|g' {} \;
find build/ -name "*.js" -type f -exec sed -i 's|localhost:5101|kasuf.xyz|g' {} \;

# Замена в CSS файлах (если есть)
find build/ -name "*.css" -type f -exec sed -i 's|http://localhost:5100|https://kasuf.xyz|g' {} \;
find build/ -name "*.css" -type f -exec sed -i 's|http://localhost:5101|https://kasuf.xyz|g' {} \;

# Замена в HTML файлах
find build/ -name "*.html" -type f -exec sed -i 's|http://localhost:5100/api|https://kasuf.xyz/api|g' {} \;
find build/ -name "*.html" -type f -exec sed -i 's|http://localhost:5101/api|https://kasuf.xyz/api|g' {} \;

# Замена в JSON файлах (если есть конфигурация)
find build/ -name "*.json" -type f -exec sed -i 's|http://localhost:5100/api|https://kasuf.xyz/api|g' {} \;
find build/ -name "*.json" -type f -exec sed -i 's|http://localhost:5101/api|https://kasuf.xyz/api|g' {} \;

echo "✅ Замена завершена!"

# Проверяем результат
echo "🔍 Проверка замены..."
if grep -r "localhost:510" build/ 2>/dev/null; then
    echo "⚠️ Еще остались ссылки на localhost:510x!"
    echo "Найденные файлы:"
    grep -r "localhost:510" build/ 2>/dev/null
else
    echo "✅ Все ссылки на localhost:510x заменены!"
fi

# Проверяем что появились правильные ссылки
if grep -r "kasuf.xyz/api" build/ 2>/dev/null | head -3; then
    echo "✅ Найдены правильные ссылки на kasuf.xyz/api"
else
    echo "⚠️ Не найдены ссылки на kasuf.xyz/api - возможно замена не сработала"
fi

cd /var/upload

# Создаем правильный .env
echo "⚙️ Создание .env для порта 5201..."
cat > frontend/.env << 'EOF'
PORT=5201
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
BROWSER=none
OPEN_BROWSER=false
EOF

# Обновляем PM2 конфигурацию
echo "⚙️ Обновление PM2 на порт 5201..."
sed -i 's/-l 5100/-l 5201/g' ecosystem.config.js 2>/dev/null || true
sed -i 's/-l 5101/-l 5201/g' ecosystem.config.js 2>/dev/null || true

# Запуск frontend
echo "🚀 Запуск Frontend на порту 5201..."
pm2 restart crm-frontend

# Если не запустился, принудительно создаем процесс
sleep 2
if ! pm2 list | grep -q "crm-frontend.*online"; then
    echo "⚠️ Frontend не запустился, принудительный запуск..."
    pm2 delete crm-frontend 2>/dev/null || true
    pm2 start serve --name crm-frontend -- -s frontend/build -l 5201
fi

pm2 save

# Проверка
echo "📊 Статус процессов:"
pm2 status

echo "🧪 Тест Frontend на порту 5201..."
sleep 3
if curl -s http://localhost:5201 >/dev/null; then
    echo "✅ Frontend отвечает на порту 5201"
else
    echo "❌ Frontend недоступен"
    echo "Логи: pm2 logs crm-frontend"
fi

echo ""
echo "===================================================="
echo "✅ ИСПРАВЛЕНИЕ API URL ЗАВЕРШЕНО!"
echo "===================================================="
echo "🔄 Изменения:"
echo "   localhost:5100/api → https://kasuf.xyz/api"
echo "   localhost:5101/api → https://kasuf.xyz/api"
echo "   Frontend порт: 5201"
echo ""
echo "🌐 Теперь попробуйте войти на https://kasuf.xyz"
echo ""
echo "📋 Если проблемы остались:"
echo "   pm2 logs crm-frontend  - логи frontend"
echo "   pm2 logs crm-backend   - логи backend"
echo "   ./check-ports.sh       - диагностика"
echo ""
echo "🎉 API URL исправлен в собранном frontend!"