# 🔧 РЕШЕНИЕ ПРОБЛЕМЫ ПОДКЛЮЧЕНИЯ К BACKEND

## 🚨 Проблема
Фронтенд показывает ошибки:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5100/api/auth/login:1
:5100/api/health:1  
:5100/api/translations/client:1
```

## 💡 Причина
Backend сервер не запущен на порту 5100.

## ✅ Решение

### Вариант 1: Быстрый запуск
```bash
FIX-BACKEND-CONNECTION.bat
```

### Вариант 2: Пошаговое решение

#### 1. Диагностика проблемы
```bash
DIAGNOSE-BACKEND.bat
```

#### 2. Запуск backend сервера
```bash
QUICK-START-BACKEND.bat
```

#### 3. Если нужна полная установка
```bash
START-BACKEND-5100.bat
```

## 🔍 Проверка работы

После запуска backend проверьте:

1. **Health check**: http://localhost:5100/api/health
2. **Swagger API**: http://localhost:5100/api/docs
3. **Консоль backend** должна показать:
   ```
   Application is running on: http://localhost:5100
   Swagger API docs: http://localhost:5100/api/docs
   Health check: http://localhost:5100/api/health
   ```

## 🔧 Настройки

### Backend (.env)
```env
PORT=5100
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=magarel
DB_NAME=thewho
DATABASE_URL=postgresql://postgres:magarel@localhost:5432/thewho
```

### Frontend API Config
```typescript
API_BASE = 'http://localhost:5100/api'
```

## 🛠️ Если проблемы продолжаются

### 1. Проверьте PostgreSQL
```bash
# PostgreSQL должен быть запущен на порту 5432
netstat -an | findstr "5432"
```

### 2. Проверьте порт 5100
```bash
# Порт должен быть свободен до запуска backend
netstat -an | findstr "5100"
```

### 3. Проверьте зависимости
```bash
cd backend
npm install
```

### 4. Проверьте компиляцию
```bash
cd backend
npm run build
```

### 5. Альтернативный запуск
```bash
cd backend
npm run start:ts
```

## 🎯 Порядок запуска

1. **Сначала PostgreSQL** (должен быть запущен)
2. **Затем Backend** на порту 5100
3. **Затем Frontend** на порту 3000/5101

## 📝 Логи при успешном запуске

### Backend консоль:
```
PRODUCTION BACKEND STARTING ON PORT 5100 ...
Database: postgresql://postgres:mag***@localhost:5432/thewho
Environment: development
Application is running on: http://localhost:5100
Swagger API docs: http://localhost:5100/api/docs
Health check: http://localhost:5100/api/health
```

### Frontend консоль:
```
✅ Используем найденный API URL: http://localhost:5100/api
🚀 API инициализирован: http://localhost:5100/api
✅ API успешно инициализирован
```

## 🔄 После запуска

1. Обновите страницу фронтенда
2. Проверьте, что ошибки `ERR_CONNECTION_REFUSED` исчезли
3. Попробуйте войти в систему
4. Протестируйте Excel импорт

---

**Статус**: 🔧 Готово к исправлению  
**Команда**: `FIX-BACKEND-CONNECTION.bat`  
**Проверка**: http://localhost:5100/api/health
