#!/bin/bash

# Мониторинг сервисов CRM
echo "📊 Статус сервисов Production CRM"
echo "=================================="

# Docker контейнеры
echo "🐳 Docker контейнеры:"
docker-compose -f docker-compose.beget.yml ps

echo ""
echo "🔍 Использование ресурсов:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "📊 Статус базы данных:"
docker exec crm-db psql -U postgres -d thewho_prod -c "SELECT COUNT(*) as total_records FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "💾 Размер базы данных:"
docker exec crm-db psql -U postgres -d thewho_prod -c "SELECT pg_size_pretty(pg_database_size('thewho_prod')) as database_size;"

echo ""
echo "📁 Размер логов:"
du -sh logs/

echo ""
echo "🌐 Тест подключения к API:"
curl -s -o /dev/null -w "HTTP статус: %{http_code}\nВремя ответа: %{time_total}s\n" http://localhost:3001/health

echo ""
echo "🎯 Последние 10 строк логов backend:"
docker-compose -f docker-compose.beget.yml logs --tail=10 backend
