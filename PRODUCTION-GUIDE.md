# TheWho Production CRM - Инструкция по эксплуатации

## 🎉 Поздравляем! Ваша CRM система успешно развернута

**Адреса доступа:**
- 🌐 **Веб-интерфейс**: http://31.128.35.6
- 🔌 **API**: http://31.128.35.6/api/health
- 📚 **Документация API**: http://31.128.35.6/api/docs

---

## 🔧 Управление системой

### Основные команды

```bash
# Статус системы
sudo systemctl status thewho-backend

# Перезапуск
sudo systemctl restart thewho-backend

# Остановка
sudo systemctl stop thewho-backend

# Запуск
sudo systemctl start thewho-backend

# Просмотр логов в реальном времени
sudo journalctl -u thewho-backend -f

# Просмотр логов приложения
tail -f /var/log/thewho-backend.log
```

### Мониторинг

```bash
# Полный мониторинг системы
cd /var/www/thewho/backend
./monitor-production.sh

# Быстрая проверка API
curl http://localhost:5100/api/health
curl http://31.128.35.6/api/health
```

---

## 💾 Резервное копирование

### Автоматический бэкап

```bash
# Создание бэкапа
cd /var/www/thewho/backend
./backup.sh

# Настройка автоматического бэкапа (cron)
sudo crontab -e

# Добавьте строку для ежедневного бэкапа в 3:00
0 3 * * * /var/www/thewho/backend/backup.sh >> /var/log/backup.log 2>&1
```

### Восстановление из бэкапа

```bash
# Восстановление базы данных
PGPASSWORD="Magarel1!" pg_restore \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.kukqacmzfmzepdfddppl \
  -d postgres \
  --clean --if-exists \
  /var/www/thewho/backups/database_backup_YYYYMMDD_HHMMSS.dump

# Восстановление файлов приложения
tar -xzf /var/www/thewho/backups/app_backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www/thewho/
sudo systemctl restart thewho-backend
```

---

## 🔄 Обновление системы

### Обновление кода приложения

```bash
# 1. Остановка системы
sudo systemctl stop thewho-backend

# 2. Создание бэкапа
./backup.sh

# 3. Обновление кода (загрузите новые файлы)
# Замените файлы в /var/www/thewho/

# 4. Установка зависимостей
cd /var/www/thewho/backend
npm ci --production

# 5. Сборка приложения
npm run build

# 6. Запуск системы
sudo systemctl start thewho-backend

# 7. Проверка работы
./monitor-production.sh
```

---

## 🛠️ Устранение неполадок

### Система не запускается

```bash
# Проверка логов
sudo journalctl -u thewho-backend -n 50
tail -50 /var/log/thewho-backend-error.log

# Проверка конфигурации
sudo systemctl show thewho-backend

# Ручной запуск для диагностики
cd /var/www/thewho/backend
NODE_ENV=production PORT=5100 node dist/src/main.js
```

### API не отвечает

```bash
# Проверка портов
netstat -tlnp | grep 5100
lsof -i :5100

# Проверка процессов
ps aux | grep node

# Проверка Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Проблемы с базой данных

```bash
# Тест подключения к Supabase
PGPASSWORD="Magarel1!" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.kukqacmzfmzepdfddppl \
  -d postgres \
  -c "SELECT COUNT(*) FROM machines;"
```

---

## 📊 Мониторинг производительности

### Системные ресурсы

```bash
# Использование CPU и памяти
htop

# Место на диске
df -h

# Размер логов
du -sh /var/log/thewho-*
du -sh /var/www/thewho/backend/logs/

# Статистика базы данных (через API)
curl http://localhost:5100/api/health | jq
```

### Очистка логов

```bash
# Ротация логов (настройка logrotate)
sudo nano /etc/logrotate.d/thewho

# Содержимое файла:
/var/log/thewho-*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload thewho-backend
    endscript
}
```

---

## 🔒 Безопасность

### Рекомендации

1. **Регулярно обновляйте зависимости**:
   ```bash
   cd /var/www/thewho/backend
   npm audit
   npm update
   ```

2. **Мониторьте логи на подозрительную активность**:
   ```bash
   grep -i "error\|warning\|failed" /var/log/thewho-backend.log
   ```

3. **Настройте firewall** (если не настроен):
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

4. **Регулярно делайте бэкапы**:
   - Настройте автоматический бэкап через cron
   - Проверяйте целостность бэкапов
   - Храните бэкапы в безопасном месте

---

## 📞 Поддержка

### Лог-файлы для анализа
- Приложение: `/var/log/thewho-backend.log`
- Ошибки: `/var/log/thewho-backend-error.log`
- Systemd: `sudo journalctl -u thewho-backend`
- Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

### Диагностическая информация
Для получения помощи приложите следующую информацию:

```bash
# Создание диагностического отчета
cat > diagnostic_report.txt << EOF
=== TheWho CRM Diagnostic Report ===
Дата: $(date)
Система: $(uname -a)
Статус службы: $(sudo systemctl is-active thewho-backend)
Версия Node.js: $(node --version)
Место на диске: $(df -h /var/www/thewho)
Память: $(free -h)
Последние 20 строк лога:
$(tail -20 /var/log/thewho-backend.log)
EOF
```

---

## 🎯 Полезные скрипты

Все скрипты находятся в `/var/www/thewho/backend/`:

- `./monitor-production.sh` - Полный мониторинг системы
- `./backup.sh` - Создание резервной копии
- `./setup-systemd.sh` - Настройка systemd service

**Сделайте их исполняемыми:**
```bash
chmod +x /var/www/thewho/backend/*.sh
```

---

**🎉 Ваша TheWho CRM успешно работает в продакшене!**

**Основные адреса:**
- Frontend: http://31.128.35.6
- API: http://31.128.35.6/api/health
- Docs: http://31.128.35.6/api/docs
