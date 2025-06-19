#!/bin/bash

# Диагностика проблем с API в TheWho CRM
echo "🔍 Диагностика API TheWho CRM"
echo "=============================="
echo "🕒 $(date)"
echo ""

# Проверка backend
echo "🔧 Проверка Backend:"
backend_local=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5100/api/health 2>/dev/null)
echo "- Локальный backend (localhost:5100): $backend_local"

backend_external=$(curl -s -o /dev/null -w "%{http_code}" http://31.128.35.6/api/health 2>/dev/null)
echo "- Внешний backend (31.128.35.6): $backend_external"

# Проверка конфигурации nginx
echo ""
echo "🌐 Проверка Nginx:"
nginx_status=$(sudo systemctl is-active nginx 2>/dev/null)
echo "- Статус Nginx: $nginx_status"

echo "- Конфигурация для /api:"
grep -A 10 "location /api" /etc/nginx/sites-available/thewho 2>/dev/null || echo "  Конфигурация не найдена"

# Проверка портов
echo ""
echo "🔌 Проверка портов:"
echo "- Порт 5100 (backend):"
netstat -tlnp | grep :5100 || echo "  Порт не прослушивается"

echo "- Порт 80 (nginx):"
netstat -tlnp | grep :80 || echo "  Порт не прослушивается"

# Проверка процессов
echo ""
echo "🔄 Проверка процессов:"
backend_process=$(pgrep -f "node dist/src/main.js")
if [ ! -z "$backend_process" ]; then
    echo "- Backend процесс: PID $backend_process ✅"
else
    echo "- Backend процесс: НЕ НАЙДЕН ❌"
fi

nginx_process=$(pgrep nginx)
if [ ! -z "$nginx_process" ]; then
    echo "- Nginx процесс: PID $nginx_process ✅"
else
    echo "- Nginx процесс: НЕ НАЙДЕН ❌"
fi

# Тест API запросов
echo ""
echo "🧪 Тест API запросов:"

echo "1. Health check (через localhost):"
curl -s http://localhost:5100/api/health | head -c 200 2>/dev/null && echo "" || echo "ОШИБКА"

echo "2. Health check (через nginx):"
curl -s http://31.128.35.6/api/health | head -c 200 2>/dev/null && echo "" || echo "ОШИБКА"

echo "3. Machines API (через nginx):"
curl -s http://31.128.35.6/api/machines | head -c 200 2>/dev/null && echo "" || echo "ОШИБКА"

# Проверка логов
echo ""
echo "📊 Последние ошибки в логах:"
echo "- Backend логи (последние 5 строк):"
tail -5 /var/log/thewho-backend-error.log 2>/dev/null || echo "  Лог не найден"

echo "- Nginx error логи (последние 5 строк):"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "  Лог не найден"

# Рекомендации
echo ""
echo "🔧 Рекомендации по исправлению:"

if [ "$backend_local" != "200" ]; then
    echo "❌ Backend не отвечает локально - проверьте systemd service"
    echo "   sudo systemctl status thewho-backend"
    echo "   sudo journalctl -u thewho-backend -f"
fi

if [ "$backend_external" != "200" ]; then
    echo "❌ Backend не доступен извне - проверьте nginx конфигурацию"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
fi

echo ""
echo "🚀 Быстрые команды для исправления:"
echo "1. Перезапуск backend:    sudo systemctl restart thewho-backend"
echo "2. Перезапуск nginx:      sudo systemctl reload nginx"  
echo "3. Исправление API URL:   ./fix-api-url.sh"
echo "4. Проверка логов:        tail -f /var/log/thewho-backend.log"
