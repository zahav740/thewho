#!/bin/bash

# Проверка подключения к Supabase и статуса сервисов
echo "🔍 Диагностика CRM с Supabase на Beget"
echo "======================================"

# Проверка env переменных
echo "📋 Проверка переменных окружения:"
if [ -f ".env" ]; then
    echo "✅ Файл .env найден"
    echo "DB_HOST: $(grep DB_HOST .env | cut -d'=' -f2)"
    echo "DB_PORT: $(grep DB_PORT .env | cut -d'=' -f2)"
    echo "DB_NAME: $(grep DB_NAME .env | cut -d'=' -f2)"
    echo "CORS_ORIGIN: $(grep CORS_ORIGIN .env | cut -d'=' -f2)"
else
    echo "❌ Файл .env не найден!"
fi

echo ""
echo "🐳 Статус Docker контейнеров:"
docker-compose -f docker-compose.beget.supabase.yml ps

echo ""
echo "🔍 Использование ресурсов:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "Docker stats недоступен"

echo ""
echo "🌐 Проверка подключений:"

# Проверка Supabase
echo "🔗 Тест подключения к Supabase..."
if command -v psql >/dev/null 2>&1; then
    psql "postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SELECT version();" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Supabase подключение работает"
    else
        echo "❌ Supabase подключение недоступно"
    fi
else
    echo "⚠️ psql не установлен, используем curl для проверки хоста"
    if curl -s --connect-timeout 5 "https://aws-0-eu-central-1.pooler.supabase.com" >/dev/null 2>&1; then
        echo "✅ Supabase хост доступен"
    else
        echo "❌ Supabase хост недоступен"
    fi
fi

# Проверка Backend API
echo ""
echo "🔌 Тест Backend API:"
if curl -s -f http://localhost:5100/health >/dev/null 2>&1; then
    echo "✅ Backend API (5100) работает"
    curl -s http://localhost:5100/health | jq . 2>/dev/null || curl -s http://localhost:5100/health
else
    echo "❌ Backend API (5100) недоступен"
fi

# Проверка Frontend
echo ""
echo "🌐 Тест Frontend:"
if curl -s -f http://localhost:5101 >/dev/null 2>&1; then
    echo "✅ Frontend (5101) работает"
else
    echo "❌ Frontend (5101) недоступен"
fi

# Проверка внешнего доступа
echo ""
echo "🌍 Тест внешнего доступа:"
if curl -s -f https://kasuf.xyz >/dev/null 2>&1; then
    echo "✅ kasuf.xyz доступен"
else
    echo "❌ kasuf.xyz недоступен"
fi

if curl -s -f https://kasuf.xyz/api/health >/dev/null 2>&1; then
    echo "✅ API через kasuf.xyz работает"
    curl -s https://kasuf.xyz/api/health | jq . 2>/dev/null || curl -s https://kasuf.xyz/api/health
else
    echo "❌ API через kasuf.xyz недоступен"
fi

echo ""
echo "📊 Логи сервисов (последние 20 строк):"
echo "Backend:"
docker-compose -f docker-compose.beget.supabase.yml logs --tail=20 backend 2>/dev/null || echo "Логи backend недоступны"

echo ""
echo "Frontend:"
docker-compose -f docker-compose.beget.supabase.yml logs --tail=10 frontend 2>/dev/null || echo "Логи frontend недоступны"

echo ""
echo "🔧 Полезные команды:"
echo "Перезапуск: docker-compose -f docker-compose.beget.supabase.yml restart"
echo "Логи: docker-compose -f docker-compose.beget.supabase.yml logs -f"
echo "Остановка: docker-compose -f docker-compose.beget.supabase.yml down"
echo "Пересборка: docker-compose -f docker-compose.beget.supabase.yml up --build -d"
