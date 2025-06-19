#!/bin/bash

# Скрипт мониторинга TheWho CRM
echo "📊 Мониторинг TheWho Production CRM"
echo "===================================="
echo "🕒 $(date)"
echo ""

# Проверка systemd service
echo "🔧 Статус systemd service:"
sudo systemctl is-active thewho-backend && echo "✅ Service активен" || echo "❌ Service не активен"
sudo systemctl is-enabled thewho-backend && echo "✅ Автозапуск включен" || echo "❌ Автозапуск выключен"

echo ""
echo "🌐 Проверка API:"
# Проверка локального API
api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5100/api/health)
if [ "$api_status" = "200" ]; then
    echo "✅ Локальный API (localhost:5100) - работает"
    curl -s http://localhost:5100/api/health | jq -r '"База данных: \(.database.connected // "неизвестно"), Машины: \(.database.machinesCount // "N/A"), Заказы: \(.database.ordersCount // "N/A")"' 2>/dev/null || echo "Ответ получен, но JSON некорректен"
else
    echo "❌ Локальный API (localhost:5100) - не отвечает (код: $api_status)"
fi

# Проверка через Nginx
nginx_status=$(curl -s -o /dev/null -w "%{http_code}" http://31.128.35.6/api/health)
if [ "$nginx_status" = "200" ]; then
    echo "✅ Внешний API (31.128.35.6) - работает"
else
    echo "❌ Внешний API (31.128.35.6) - не отвечает (код: $nginx_status)"
fi

echo ""
echo "📊 Использование ресурсов:"
# CPU и память процесса Node.js
node_pid=$(pgrep -f "node dist/src/main.js")
if [ ! -z "$node_pid" ]; then
    echo "🔍 PID процесса Node.js: $node_pid"
    ps -p $node_pid -o pid,ppid,cmd,%mem,%cpu --no-headers 2>/dev/null || echo "Процесс не найден"
else
    echo "❌ Процесс Node.js не найден"
fi

echo ""
echo "💾 Размер логов:"
ls -lh /var/log/thewho-backend*.log 2>/dev/null || echo "Логи не найдены"

echo ""
echo "📈 Последние 5 строк логов приложения:"
tail -5 /var/log/thewho-backend.log 2>/dev/null || echo "Лог-файл не найден"

echo ""
echo "🔍 Проверка портов:"
netstat -tlnp | grep :5100 || echo "Порт 5100 не прослушивается"

echo ""
echo "📋 Системная информация:"
echo "Свободное место: $(df -h /var/www/thewho | tail -1 | awk '{print $4}')"
echo "Загрузка системы: $(uptime | awk -F'load average:' '{print $2}')"
echo "Память: $(free -h | grep ^Mem | awk '{print $3 "/" $2}')"

echo ""
echo "🎯 Быстрые команды:"
echo "  Перезапуск:  sudo systemctl restart thewho-backend"
echo "  Логи live:   sudo journalctl -u thewho-backend -f"
echo "  Лог файл:    tail -f /var/log/thewho-backend.log"
