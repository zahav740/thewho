# 🏭 Production CRM - Production Deployment Guide

## 🚀 Быстрый запуск в продакшен

### Запуск системы:
```bash
START-PRODUCTION-CRM.bat
```

### Остановка системы:
```bash
STOP-PRODUCTION-CRM.bat
```

### Мониторинг системы:
```bash
MONITOR-PRODUCTION.bat
```

---

## 📋 Системные требования

### Минимальные требования:
- **Windows**: 10/11 или Windows Server 2019+
- **Node.js**: 18.x или выше
- **PostgreSQL**: 14.x или выше  
- **RAM**: 4GB минимум, 8GB рекомендуется
- **CPU**: 2 ядра минимум, 4 ядра рекомендуется
- **Диск**: 10GB свободного места

### Рекомендованные требования для продакшена:
- **RAM**: 16GB+
- **CPU**: 8+ ядер
- **SSD**: 50GB+ для базы данных и логов
- **Сеть**: Стабильное подключение к интернету

---

## 🔧 Production Environment Setup

### 1. Переменные окружения
Система автоматически устанавливает:
```env
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000
```

### 2. Настройки базы данных
PostgreSQL должен быть настроен с:
- **Host**: localhost
- **Port**: 5432
- **Database**: production_crm (или согласно вашей конфигурации)

### 3. Порты
- **Frontend**: 3000
- **Backend API**: 3001
- **PostgreSQL**: 5432

---

## 📊 Мониторинг и диагностика

### Проверка состояния системы:
```bash
# Автоматический мониторинг
MONITOR-PRODUCTION.bat

# Ручная проверка API
curl http://localhost:3001/api/health

# Проверка frontend
curl http://localhost:3000
```

### Основные endpoints для мониторинга:
- **Health Check**: `GET /api/health`
- **Machines**: `GET /api/machines`
- **Orders**: `GET /api/orders`
- **Calendar**: `GET /api/calendar`

---

## 🛠️ Troubleshooting

### Проблема: Backend не запускается
```bash
# Проверить PostgreSQL
pg_isready -h localhost -p 5432

# Проверить порт 3001
netstat -ano | findstr :3001

# Переустановить зависимости
cd backend
npm ci --only=production
npm run build
```

### Проблема: Frontend не отвечает
```bash
# Проверить порт 3000
netstat -ano | findstr :3000

# Пересобрать frontend
cd frontend
npm ci
npm run build
```

### Проблема: База данных недоступна
```bash
# Запустить PostgreSQL
net start postgresql-x64-14

# Проверить соединение
psql -h localhost -U postgres -l
```

---

## 📈 Performance Optimization

### Backend оптимизация:
- Production сборка с минификацией
- Кэширование статических ресурсов
- Оптимизация SQL запросов

### Frontend оптимизация:
- Статическая сборка с serve
- Сжатие ресурсов
- CDN для статических файлов (опционально)

### База данных:
- Индексы на часто используемых полях
- Regular VACUUM и ANALYZE
- Мониторинг медленных запросов

---

## 🔒 Security Considerations

### Настройки безопасности:
- ✅ CORS настроен для production
- ✅ Валидация входных данных
- ✅ TypeORM защита от SQL инъекций
- ✅ HTTPS готовность (требует настройки)

### Рекомендации:
1. Настроить firewall для портов 3000, 3001
2. Использовать reverse proxy (nginx/Apache)
3. Настроить HTTPS сертификаты
4. Регулярные бэкапы базы данных

---

## 📁 Структура файлов

```
production-crm/
├── START-PRODUCTION-CRM.bat     # Запуск в продакшен
├── STOP-PRODUCTION-CRM.bat      # Остановка системы  
├── MONITOR-PRODUCTION.bat       # Мониторинг
├── backend/
│   ├── dist/                    # Production сборка
│   ├── src/                     # Исходный код
│   └── package.json
├── frontend/
│   ├── build/                   # Production сборка
│   ├── src/                     # Исходный код
│   └── package.json
└── docs/                        # Документация
```

---

## 🔄 Backup & Recovery

### Автоматический backup базы данных:
```bash
# Ежедневный backup (настроить в Task Scheduler)
pg_dump -h localhost -U postgres production_crm > backup_%date%.sql
```

### Восстановление:
```bash
# Восстановление из backup
psql -h localhost -U postgres -d production_crm < backup_file.sql
```

---

## 📞 Support & Maintenance

### Логи системы:
- **Backend логи**: В окне "Production CRM Backend"
- **Frontend логи**: В окне "Production CRM Frontend"
- **PostgreSQL логи**: В директории PostgreSQL

### Регулярное обслуживание:
1. **Еженедельно**: Проверка логов, мониторинг производительности
2. **Ежемесячно**: Backup базы данных, обновление зависимостей
3. **Ежеквартально**: Анализ безопасности, оптимизация

---

## 🎯 Production Checklist

### Перед запуском:
- [ ] PostgreSQL установлен и работает
- [ ] Node.js 18+ установлен
- [ ] Все зависимости установлены
- [ ] Порты 3000, 3001 свободны
- [ ] Права администратора доступны

### После запуска:
- [ ] Backend отвечает на /api/health
- [ ] Frontend доступен на :3000
- [ ] API документация работает
- [ ] Основные endpoints отвечают
- [ ] База данных доступна

### Мониторинг:
- [ ] MONITOR-PRODUCTION.bat показывает "СИСТЕМА РАБОТАЕТ"
- [ ] Нет ошибок в логах
- [ ] Производительность в норме
- [ ] Backup настроен

---

**🏭 Production CRM готова к эксплуатации!**

*Для поддержки обращайтесь к системному администратору*
