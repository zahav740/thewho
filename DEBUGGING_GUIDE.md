# 🔧 Руководство по исправлению 500 ошибок API

## 📋 Текущий статус

### ✅ Исправлено:
- ✅ TypeScript ошибки компиляции
- ✅ Entity файлы приведены в соответствие с БД
- ✅ Antd Spin warning исправлен
- ✅ TabPane deprecated warning исправлен

### 🚨 Остается исправить:
- ❌ API endpoints возвращают 500 ошибки
- ❌ Бэкенд сервер не обрабатывает запросы корректно

## 🛠️ Пошаговое решение

### Шаг 1: Запуск диагностического контроллера
```bash
# Используйте compile-and-start.bat или:
cd backend
npm run start:dev
```

### Шаг 2: Тестирование API
```bash
# Запустите test-api-debug.bat или проверьте вручную:
curl http://localhost:3000/api/calendar/test
curl http://localhost:3000/api/calendar/debug
```

### Шаг 3: Проверка результатов
Ожидаемые результаты тестов:
- `/api/calendar/test` - должен вернуть `{"status": "ok"}`
- `/api/calendar/debug` - должен показать количество записей в БД

## 🔍 Диагностика проблем

### Если сервер не запускается:
1. Проверьте подключение к PostgreSQL
2. Убедитесь, что порт 3000 свободен
3. Проверьте .env файл в backend/

### Если API возвращает 500:
1. Проверьте логи в консоли backend
2. Используйте `/api/calendar/debug` для диагностики
3. Проверьте, что таблицы существуют в БД

### Если проблемы с БД:
```sql
-- Проверьте таблицы:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Проверьте данные:
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM operations;
SELECT COUNT(*) FROM machines;
```

## 📊 Структура исправлений

### Entity файлы:
- `operation.entity.ts` - ID как number, operationType как string
- `order.entity.ts` - ID как number, правильный маппинг полей
- `machine.entity.ts` - ID как number, type как string
- `shift-record.entity.ts` - обновлен под новую структуру

### Контроллеры:
- `calendar.controller.ts` - временно заменен на диагностический
- `health.controller.ts` - для проверки состояния системы

### Frontend исправления:
- `CalendarPage.tsx` - исправлен TabPane на items API
- `MachineUtilization.tsx` - исправлен Spin warning
- `OrderForm.tsx` - исправлены типы данных

## 🔄 Откат изменений

Если что-то пошло не так, все оригинальные файлы сохранены:
- `*.backup.ts` - оригинальные entity файлы
- `calendar.controller.backup.ts` - оригинальный контроллер

## 📞 Следующие шаги

1. **Запустите диагностику**: `test-api-debug.bat`
2. **Если тесты проходят**: Восстановите оригинальный calendar.controller.ts
3. **Если тесты не проходят**: Проверьте логи сервера и БД подключение
4. **После исправления**: Протестируйте фронтенд

## 🎯 Финальная проверка

Когда все работает:
- [ ] Фронтенд загружается без ошибок
- [ ] API endpoints возвращают 200 статус
- [ ] Данные отображаются в интерфейсе
- [ ] Нет console.error в браузере

---

**💡 Совет**: Начните с простых endpoints (/health, /test) и постепенно переходите к сложным.
