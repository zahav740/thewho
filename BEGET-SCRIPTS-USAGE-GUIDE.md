# Beget Deployment Scripts - Usage Guide

## Созданные скрипты

### 1. `prepare-backend-beget.bat`
Подготавливает ZIP-архив только с бэкендом для развертывания на Beget.

**Что включено:**
- Скомпилированный код (dist/)
- Исходный код (src/)
- Зависимости (node_modules/)
- Конфигурационные файлы
- SQL скрипты
- Скрипты запуска
- README с инструкциями

**Результат:** `backend-beget.zip`

### 2. `prepare-frontend-beget.bat`
Подготавливает ZIP-архив только с фронтендом для развертывания на Beget.

**Что включено:**
- Production build (build/)
- Конфигурация nginx
- .htaccess для Apache
- Node.js сервер для статики
- Конфигурационные файлы
- README с инструкциями

**Результат:** `frontend-beget.zip`

### 3. `prepare-complete-beget.bat`
Создает полный пакет развертывания, включающий оба компонента.

**Что включено:**
- Полный бэкенд и фронтенд
- Скрипты развертывания для Linux/Windows
- Конфигурационные шаблоны
- Полная документация
- Скрипты управления сервисами

**Результат:** `production-crm-beget-complete-{timestamp}.zip`

## Использование

### Быстрое развертывание (рекомендуется)
```batch
# Запустите главный скрипт
prepare-complete-beget.bat
```

### Раздельное развертывание
```batch
# Только бэкенд
prepare-backend-beget.bat

# Только фронтенд
prepare-frontend-beget.bat
```

## Что делают скрипты

### Безопасность
- ✅ Используют английскую кодировку (`chcp 65001`)
- ✅ Проверяют существование директорий
- ✅ Обрабатывают ошибки
- ✅ Создают безопасные конфигурации
- ✅ Очищают временные файлы

### Автоматизация
- ✅ Устанавливают зависимости
- ✅ Собирают production версии
- ✅ Создают необходимые конфигурации
- ✅ Генерируют документацию
- ✅ Упаковывают в ZIP архивы

### Конфигурация
- ✅ Создают шаблоны .env файлов
- ✅ Настраивают nginx/Apache конфигурации
- ✅ Создают скрипты запуска
- ✅ Генерируют ecosystem.config.js для PM2

## После создания архивов

### 1. Загрузите на сервер Beget
```bash
# Загрузите архив через FTP/SFTP или панель управления
scp production-crm-beget-complete-*.zip user@server:/home/user/
```

### 2. Распакуйте
```bash
unzip production-crm-beget-complete-*.zip
cd production-crm-beget-complete-*/
```

### 3. Настройте окружение
```bash
cp .env.beget .env
nano .env  # Отредактируйте под ваши настройки
```

### 4. Разверните
```bash
chmod +x deploy-scripts/*.sh
./deploy-scripts/deploy.sh
```

### 5. Запустите сервисы
```bash
./deploy-scripts/start-services.sh
```

## Важные настройки в .env

```env
# База данных (обязательно изменить!)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Безопасность (обязательно изменить!)
JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters

# Домен (настроить под ваш домен)
CORS_ORIGIN=https://your-domain.beget.tech
REACT_APP_API_URL=https://your-domain.beget.tech/api
DOMAIN=your-domain.beget.tech
```

## Варианты развертывания фронтенда

### Статические файлы (рекомендуется)
```bash
cp -r frontend/build/* /path/to/web/directory/
cp frontend/.htaccess /path/to/web/directory/
```

### Node.js сервер
```bash
cd frontend
npm install express
node server.js
```

### Nginx
```bash
cp frontend/nginx-beget.conf /etc/nginx/sites-available/crm
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
systemctl reload nginx
```

## Проверка работы

### Backend API
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/docs
```

### Frontend
```bash
curl http://localhost:3000/
```

## Управление сервисами

```bash
# Запуск
./deploy-scripts/start-services.sh

# Остановка
./deploy-scripts/stop-services.sh

# Логи
tail -f backend.log
tail -f frontend.log
```

## Устранение неполадок

### Проверка процессов
```bash
ps aux | grep node
netstat -tulnp | grep :3001
```

### Проверка логов
```bash
tail -f backend.log
tail -f frontend.log
```

### Проверка конфигурации
```bash
cat .env
node -e "console.log(process.env.NODE_ENV)"
```

---

## Технические детали скриптов

- **Кодировка:** UTF-8 (chcp 65001)
- **Проверки:** Существование директорий, успешность команд
- **Очистка:** Автоматическое удаление временных файлов
- **Логирование:** Подробный вывод процесса
- **Архивация:** PowerShell Compress-Archive
- **Совместимость:** Windows 10+, PowerShell 5.0+

Все скрипты готовы к использованию и безопасны для запуска на вашей системе.
