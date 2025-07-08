# 🚨 ИСПРАВЛЕНИЕ ПРОБЛЕМ ЗАПУСКА

## 🔧 Проблема: Backend не запускается

**Ошибка**: `EBUSY: resource busy or locked, rmdir dist`

### ✅ Решение:

1. **Запустите диагностику**:
   ```bash
   DIAGNOSE-PROBLEMS.bat
   ```

2. **Используйте новый скрипт без компиляции**:
   ```bash
   START-BACKEND-TS.bat
   ```

3. **Если не помогает, очистите проект**:
   ```bash
   START-BACKEND-CLEAN.bat --clean
   ```

## 🔧 Проблема: PostgreSQL недоступен

### ✅ Решения:

1. **Запустите PostgreSQL**:
   - Через службы Windows: `services.msc` → PostgreSQL
   - Или командой: `net start postgresql-x64-14`

2. **Создайте базу данных**:
   ```sql
   psql -U postgres -c "CREATE DATABASE thewho;"
   ```

3. **Проверьте подключение**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

## 🔧 Проблема: Порты заняты

### ✅ Решения:

1. **Найдите процессы на портах**:
   ```bash
   netstat -ano | find "5100"
   netstat -ano | find "5101"
   ```

2. **Остановите процессы**:
   ```bash
   taskkill /f /pid [PID_NUMBER]
   ```

3. **Или используйте другие порты** в .env файлах

## 🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ:

### 1. Остановите все процессы:
```bash
taskkill /f /im node.exe
taskkill /f /im npm.exe
```

### 2. Запустите PostgreSQL:
```bash
net start postgresql-x64-14
```

### 3. Создайте базу данных:
```bash
psql -U postgres -c "CREATE DATABASE thewho;"
```

### 4. Запустите backend:
```bash
START-BACKEND-TS.bat
```

### 5. Запустите frontend:
```bash
START-FRONTEND-5101.bat
```

### 6. Откройте браузер:
```
http://localhost:5101/excel-import
```

## 📋 Альтернативные способы запуска:

### Backend:
- `START-BACKEND-TS.bat` - без компиляции (рекомендуется)
- `START-BACKEND-CLEAN.bat` - с очисткой
- `START-BACKEND-SIMPLE.bat` - базовый запуск

### Frontend:
- `START-FRONTEND-5101.bat` - стандартный запуск

## 🆘 Если ничего не помогает:

1. **Полная переустановка зависимостей**:
   ```bash
   cd backend
   rmdir /s node_modules
   del package-lock.json
   npm install
   
   cd ../frontend  
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

2. **Ручной запуск**:
   ```bash
   # Backend
   cd backend
   npx ts-node -r tsconfig-paths/register src/main.ts
   
   # Frontend (в новом терминале)
   cd frontend
   npm start
   ```

---

## ✅ Ожидаемый результат:

- Backend: http://localhost:5100/api/health ✅
- Frontend: http://localhost:5101 ✅  
- Excel Import: http://localhost:5101/excel-import ✅
- API Docs: http://localhost:5100/api/docs ✅
