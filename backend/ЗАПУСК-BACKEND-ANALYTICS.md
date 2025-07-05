# 🚀 ЗАПУСК BACKEND С НОВЫМ МОДУЛЕМ ANALYTICS

## 📋 Проблема
Frontend получает 400 ошибку при обращении к `/api/analytics/*` - это означает что:
1. Backend запущен, но модуль Analytics не загружен ИЛИ  
2. Backend нужно перезапустить с новыми изменениями

## ✅ Решение

### 1. Перезапустить Backend
```bash
cd backend
npm run start:dev
```

### 2. Проверить что модуль загружен
При запуске в логах должно быть:
```
[Nest] Mapped {/analytics/kpi-oee, GET} route
[Nest] Mapped {/analytics/operators, GET} route  
[Nest] Mapped {/analytics/machines, GET} route
[Nest] Mapped {/analytics/summary, GET} route
```

### 3. Протестировать API
```bash
cd backend
node test-analytics-api.js
```

### 4. Если 400 ошибки продолжаются
Проверить логи backend на предмет ошибок с базой данных или импортами.

## 🔧 Возможные проблемы

### Ошибка компиляции TypeScript
Если в backend есть ошибки TS - исправить их:
```bash
cd backend  
npm run build
```

### Проблемы с БД
Если в логах ошибки с entity - проверить:
- Machine entity имеет поле `code`
- ShiftRecord relations работают корректно
- База данных подключена

### Отсутствующие зависимости
```bash
cd backend
npm install
```

## 📊 Ожидаемое поведение

**✅ Успешно:** 
- Analytics endpoints возвращают 200 с пустыми данными `{success: true, data: []}`

**❌ Проблемы:**
- 404 = модуль не загружен
- 400 = ошибка в коде сервиса  
- 500 = ошибка базы данных
- Connection refused = backend не запущен

---

**После исправления backend, frontend автоматически подключится к новым API!**
