#!/bin/bash

echo "🧪 ПРОВЕРКА ИСПРАВЛЕНИЯ API URL"
echo "==============================="

# Проверка портов
echo "📊 Статус процессов PM2:"
pm2 status

echo ""
echo "🌐 Проверка портов:"

# Backend порт 5200
if curl -s http://localhost:5200/health >/dev/null 2>&1; then
    echo "✅ Backend работает на порту 5200"
    echo "   $(curl -s http://localhost:5200/health || echo 'Health endpoint недоступен')"
else
    echo "❌ Backend недоступен на порту 5200"
fi

# Frontend порт 5201
if curl -s http://localhost:5201 >/dev/null 2>&1; then
    echo "✅ Frontend работает на порту 5201"
    response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5201)
    echo "   HTTP код: $response_code"
else
    echo "❌ Frontend недоступен на порту 5201"
fi

echo ""
echo "🔍 Проверка API URL в сборке:"

# Проверяем что localhost больше нет
localhost_count=$(grep -r "localhost:510" frontend/build/ 2>/dev/null | wc -l || echo 0)
if [ "$localhost_count" -eq 0 ]; then
    echo "✅ Нет ссылок на localhost:510x"
else
    echo "⚠️ Найдено $localhost_count ссылок на localhost:510x:"
    grep -r "localhost:510" frontend/build/ 2>/dev/null | head -3
fi

# Проверяем что kasuf.xyz есть
kasuf_count=$(grep -r "kasuf.xyz" frontend/build/ 2>/dev/null | wc -l || echo 0)
if [ "$kasuf_count" -gt 0 ]; then
    echo "✅ Найдено $kasuf_count ссылок на kasuf.xyz"
    echo "   Примеры:"
    grep -r "kasuf.xyz" frontend/build/ 2>/dev/null | head -2 | sed 's/^/   /'
else
    echo "⚠️ Не найдены ссылки на kasuf.xyz"
fi

echo ""
echo "🌐 Проверка внешнего доступа:"

# Проверка внешнего API
if curl -s https://kasuf.xyz/api/health >/dev/null 2>&1; then
    echo "✅ API доступно извне: https://kasuf.xyz/api/health"
    health_response=$(curl -s https://kasuf.xyz/api/health)
    echo "   Ответ: $health_response"
else
    echo "❌ API недоступно извне: https://kasuf.xyz/api/health"
fi

# Проверка сайта
if curl -s https://kasuf.xyz >/dev/null 2>&1; then
    echo "✅ Сайт доступен: https://kasuf.xyz"
    response_code=$(curl -s -o /dev/null -w "%{http_code}" https://kasuf.xyz)
    echo "   HTTP код: $response_code"
else
    echo "❌ Сайт недоступен: https://kasuf.xyz"
fi

echo ""
echo "📋 PM2 логи (последние 10 строк):"
echo "Backend логи:"
pm2 logs crm-backend --lines 5 --nostream 2>/dev/null || echo "Нет логов backend"

echo ""
echo "Frontend логи:"
pm2 logs crm-frontend --lines 5 --nostream 2>/dev/null || echo "Нет логов frontend"

echo ""
echo "==============================="
echo "✅ ПРОВЕРКА ЗАВЕРШЕНА!"
echo "==============================="
echo "🌐 Теперь попробуйте зайти на https://kasuf.xyz"
echo "   и проверьте, исчезли ли ошибки localhost:5100"