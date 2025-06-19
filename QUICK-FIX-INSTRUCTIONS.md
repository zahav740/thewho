# БЫСТРОЕ ИСПРАВЛЕНИЕ НА СЕРВЕРЕ BEGET

## Текущая ситуация
Структура модулей нарушена, файлы не копируются в правильные директории.

## НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ

Выполните на сервере следующие команды **ИМЕННО В ТАКОМ ПОРЯДКЕ**:

### 1. Сделайте скрипты исполняемыми
```bash
chmod +x beget-deploy/*.sh
```

### 2. Запустите быстрое исправление
```bash
./beget-deploy/quick-fix.sh
```

### 3. Если быстрое исправление не помогло, выполните поэтапно:

#### Шаг 3.1: Диагностика
```bash
./beget-deploy/diagnose-structure.sh
```

#### Шаг 3.2: Исправление структуры
```bash
./beget-deploy/fix-structure.sh
```

#### Шаг 3.3: Экстренное восстановление (если нужно)
```bash
./beget-deploy/emergency-fix.sh
```

### 4. Проверка результата
```bash
echo "=== ПРОВЕРКА ПОСЛЕ ИСПРАВЛЕНИЯ ==="
echo "Machines:"
ls -la backend/dist/src/modules/machines/ | wc -l

echo "Operations:"
ls -la backend/dist/src/modules/operations/ | wc -l

echo "Orders:"
ls -la backend/dist/src/modules/orders/ | wc -l

echo "Calendar:"  
ls -la backend/dist/src/modules/calendar/ | wc -l

echo "Entities:"
ls -la backend/dist/src/database/entities/ | wc -l
```

### 5. Перезапуск сервисов
```bash
docker-compose -f docker-compose.beget.yml down
docker-compose -f docker-compose.beget.yml up -d
```

### 6. Проверка работы
```bash
# Статус контейнеров
docker-compose -f docker-compose.beget.yml ps

# Логи
docker-compose -f docker-compose.beget.yml logs

# Тест API
curl http://localhost:3001/health
```

## АЛЬТЕРНАТИВНЫЙ МЕТОД (если Docker не работает)

### Запуск без Docker:

1. **Подготовка backend:**
```bash
cd backend
npm install
npm run build
```

2. **Запуск backend напрямую:**
```bash
node dist/src/main.js
```

3. **Запуск frontend (в новом терминале):**
```bash
cd frontend
npm install
npm run build
npx serve -s build -l 3000
```

## ПРОБЛЕМЫ И РЕШЕНИЯ

### Если файлы не найдены:
- Проверьте, что вы находитесь в корневой директории проекта
- Убедитесь, что архив был полностью распакован
- Проверьте права доступа: `ls -la`

### Если Docker не работает:
- Используйте альтернативный метод запуска выше
- Обратитесь в поддержку Beget для установки Docker

### Если база данных не подключается:
1. Проверьте PostgreSQL: `sudo systemctl status postgresql`
2. Создайте базу данных вручную:
```sql
sudo -u postgres psql
CREATE DATABASE thewho_prod;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE thewho_prod TO postgres;
\q
```

### Если порты заняты:
```bash
# Проверка портов
netstat -tlnp | grep :3001
netstat -tlnp | grep :3000

# Остановка процессов
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:3000 | xargs kill -9
```

## МОНИТОРИНГ

После исправления используйте для мониторинга:
```bash
./beget-deploy/monitor.sh
```

## ЛОГИ

Проверка логов:
```bash
# Docker логи
docker-compose -f docker-compose.beget.yml logs --tail=50

# Системные логи
tail -f /var/log/syslog | grep -E '(node|docker|postgres)'
```

## КОНТАКТЫ

Если проблемы продолжаются:
1. Сохраните все логи
2. Выполните полную диагностику: `./beget-deploy/diagnose-structure.sh > full-diagnosis.log 2>&1`
3. Отправьте файл full-diagnosis.log для анализа
