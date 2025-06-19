#!/bin/bash

# Скрипт настройки systemd service для TheWho CRM
echo "🔧 Настройка systemd service для TheWho CRM..."

# Остановка текущего процесса если запущен
echo "⏹️ Остановка текущих процессов..."
pkill -f "node dist/src/main.js" || true

# Копирование service файла
echo "📋 Установка systemd service..."
sudo cp thewho-backend.service /etc/systemd/system/

# Перезагрузка systemd
echo "🔄 Перезагрузка systemd..."
sudo systemctl daemon-reload

# Включение автозапуска
echo "🚀 Включение автозапуска..."
sudo systemctl enable thewho-backend

# Запуск service
echo "▶️ Запуск service..."
sudo systemctl start thewho-backend

# Проверка статуса
echo "✅ Проверка статуса..."
sudo systemctl status thewho-backend --no-pager

echo ""
echo "🎉 Настройка завершена!"
echo ""
echo "📋 Полезные команды:"
echo "  Проверка статуса:    sudo systemctl status thewho-backend"
echo "  Перезапуск:          sudo systemctl restart thewho-backend"
echo "  Остановка:           sudo systemctl stop thewho-backend"
echo "  Логи:                sudo journalctl -u thewho-backend -f"
echo "  Логи приложения:     tail -f /var/log/thewho-backend.log"
echo ""
echo "🌐 Ваша CRM доступна по адресу: http://31.128.35.6"
echo "🔌 API документация: http://31.128.35.6/api/docs"
