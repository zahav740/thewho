# 🚀 Быстрый старт - Развертывание CRM на Beget

## Шаг 1: Подготовка локально ⚡

1. **Запустите сборку и создание архива:**
   ```
   CREATE-BEGET-ARCHIVE.bat
   ```

2. **Результат:** Получите файл `production-crm-beget-ready.zip`

## Шаг 2: Загрузка на Beget 📤

1. **Войдите в панель Beget:** https://cp.beget.com
2. **Файловый менеджер:** Перейдите в корень вашего сайта
3. **Загрузите архив:** `production-crm-beget-ready.zip`
4. **Распакуйте архив** в корень сайта

## Шаг 3: Настройка 🔧

### 3.1 База данных
- **Панель:** "Базы данных" → "PostgreSQL"
- **Создайте:** Базу `thewho_prod` и пользователя

### 3.2 Конфигурация
1. **Переименуйте** `.env.beget` в `.env`
2. **Отредактируйте** `.env` файл:
   ```env
   DB_PASSWORD=ваш_пароль_БД
   JWT_SECRET=ваш_длинный_секретный_ключ
   CORS_ORIGIN=https://kasuf.xyz
   DOMAIN=kasuf.xyz
   ```

### 3.3 SSL сертификат
- **Панель:** "SSL" → "Let's Encrypt"
- **Активируйте** для домена kasuf.xyz

## Шаг 4: Запуск 🏃‍♂️

### 4.1 Миграции базы данных
```bash
cd /path/to/your/site
chmod +x start-migrations.sh
./start-migrations.sh
```

### 4.2 Запуск бэкенда
```bash
chmod +x start-backend.sh
./start-backend.sh
```

### 4.3 Настройка автозапуска (Cron)
```bash
* * * * * cd /home/k/kasuf/kasuf.xyz && ./start-backend.sh >/dev/null 2>&1
```

## Шаг 5: Проверка ✅

1. **Фронтенд:** https://kasuf.xyz
2. **API:** https://kasuf.xyz/api/health
3. **Логи:** `tail -f logs/error.log`

## 🆘 Если что-то не работает

### Проблема: API недоступно
```bash
# Проверить процессы
ps aux | grep node

# Проверить логи
cat logs/error.log

# Перезапустить
./start-backend.sh
```

### Проблема: База данных
```bash
# Проверить подключение
psql -h localhost -U postgres -d thewho_prod

# Проверить настройки в .env
cat .env
```

### Проблема: Фронтенд не загружается
- Проверьте права доступа к файлам
- Убедитесь, что .htaccess настроен правильно
- Проверьте логи веб-сервера

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `logs/error.log`
2. Убедитесь в правильности .env настроек
3. Проверьте доступность портов и базы данных

---

**🎉 После настройки CRM будет доступна по адресу: https://kasuf.xyz**
