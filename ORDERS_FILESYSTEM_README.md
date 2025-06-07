# 📁 Файловая система заказов производственной CRM

## 🎯 Описание

Реализована система версионирования заказов с сохранением всех данных в структурированном виде по папкам. Каждый заказ имеет собственную папку с версиями, где хранится полная информация о заказе, операциях, сменах, планировании и истории изменений.

## 📂 Структура папок

```
uploads/orders/
├── {drawing_number}/              # Номер чертежа (TH1K4108A, C6HP0021A, G63828A)
│   ├── {YYYY-MM-DD}/             # Дата создания версии
│   │   ├── order.json            # 📋 Основная информация заказа
│   │   ├── metadata.json         # 🏷️ Метаданные версии  
│   │   ├── operations/           # 🔧 Операции заказа
│   │   │   └── operations.json
│   │   ├── shifts/               # 👥 Данные смен
│   │   │   └── shift_records.json
│   │   ├── planning/             # 📅 Планирование
│   │   │   └── planning_results.json
│   │   ├── documents/            # 📄 Документы и файлы
│   │   ├── history/              # 📝 История изменений
│   │   └── exports/              # 📊 Экспорты и отчеты
│   ├── {YYYY-MM-DD_HH-MM}/       # Версии с временем (для обновлений)
│   └── latest_version.json       # 🔗 Указатель на последнюю версию
```

## 🔧 Реализованные компоненты

### 1. **OrderFileSystemService**
- `createOrderVersion()` - создание новой версии заказа
- `updateOrderVersion()` - обновление заказа (новая версия с временем)
- `getLatestOrderVersion()` - получение последней версии
- `getOrderVersion()` - получение конкретной версии
- `getOrderVersions()` - список всех версий заказа

### 2. **Enhanced OrdersService**
- Интеграция с файловой системой
- Автоматическое сохранение при создании/обновлении заказов
- Обогащение данных из файловой системы
- Экспорт всех заказов: `exportAllOrdersToFileSystem()`

### 3. **OrdersFilesystemController** 
- `GET /api/orders/filesystem` - список всех заказов
- `GET /api/orders/filesystem/:drawingNumber` - последняя версия заказа
- `GET /api/orders/filesystem/:drawingNumber/versions` - список версий
- `GET /api/orders/filesystem/:drawingNumber/versions/:version` - конкретная версия
- `POST /api/orders/filesystem/export-all` - экспорт всех заказов из БД
- `GET /api/orders/filesystem/statistics/overview` - статистика

## 🚀 Запуск и использование

### 1. Обновление модуля Orders
```bash
# Заменить orders.module.ts на orders.module.enhanced.ts
# Заменить orders.service.ts на orders.service.enhanced.ts
# Добавить orders-filesystem.controller.ts в контроллеры
```

### 2. Экспорт существующих заказов
```bash
# Запустить скрипт экспорта
node export-orders-to-filesystem.js export

# Проверить статус файловой системы
node export-orders-to-filesystem.js status

# Прямой экспорт (если API недоступно)
node export-orders-to-filesystem.js direct
```

### 3. Использование API
```bash
# Получить все заказы в файловой системе
curl http://localhost:5100/api/orders/filesystem

# Получить заказ TH1K4108A
curl http://localhost:5100/api/orders/filesystem/TH1K4108A

# Получить версии заказа
curl http://localhost:5100/api/orders/filesystem/TH1K4108A/versions

# Экспортировать все заказы из БД
curl -X POST http://localhost:5100/api/orders/filesystem/export-all

# Статистика файловой системы
curl http://localhost:5100/api/orders/filesystem/statistics/overview
```

## 📊 Примеры данных

### order.json
```json
{
  "id": 7,
  "drawing_number": "TH1K4108A",
  "quantity": 110,
  "deadline": "2025-05-07T22:00:00.000Z",
  "priority": 2,
  "workType": "фрезерная",
  "status": "in_progress",
  "completionPercentage": 25,
  "isOnSchedule": false
}
```

### operations/operations.json
```json
[
  {
    "id": 26,
    "operationNumber": 1,
    "estimatedTime": 120,
    "status": "assigned",
    "operationType": "MILLING",
    "machineAxes": 3,
    "assignedMachine": 3
  }
]
```

### shifts/shift_records.json
```json
[
  {
    "id": 8,
    "date": "2025-06-07",
    "operation_id": 23,
    "machine_id": 5,
    "day_shift": {
      "quantity": 5,
      "time_per_unit": 20.00,
      "operator": "Кирилл",
      "total_time": 100
    },
    "setup": {
      "time": 120,
      "operator": "Андрей"
    }
  }
]
```

## ✅ Текущий статус

### Созданные заказы:
- **TH1K4108A** - 2 операции, данные смен ✅
- **C6HP0021A** - 3 операции, данные смен ✅  
- **G63828A** - 2 операции ✅

### Реализованная функциональность:
- ✅ Автоматическое создание папок при создании заказов
- ✅ Версионирование с временными метками
- ✅ API для работы с файловой системой
- ✅ Интеграция с существующими сервисами
- ✅ Сохранение данных смен
- ✅ Экспорт существующих заказов из БД

## 🔄 Следующие шаги

1. **Интеграция с ShiftsService** - автоматическое сохранение смен в файлы
2. **Интеграция с PlanningService** - сохранение результатов планирования
3. **Добавление OperationHistory** - сохранение истории выполнения операций
4. **Фронтенд интеграция** - отображение версий заказов в UI
5. **Настройка автоматических бэкапов** - регулярное архивирование данных

## 🔍 Мониторинг

```bash
# Проверить структуру папок
ls -la uploads/orders/

# Посмотреть заказы
ls uploads/orders/

# Версии конкретного заказа  
ls uploads/orders/TH1K4108A/

# Содержимое версии
ls uploads/orders/TH1K4108A/2025-05-30/
```

## 📝 Логирование

Все операции с файловой системой логируются через NestJS Logger:
- Создание папок и версий
- Сохранение и загрузка файлов
- Ошибки файловых операций
- Статистика использования

## 🛡️ Безопасность

- Файлы сохраняются только в разрешенной директории `uploads/orders/`
- Валидация имен папок и файлов
- Обработка ошибок файловой системы
- Логирование всех операций для аудита

---

**Статус:** ✅ Базовая система реализована и готова к использованию
**Версия:** 1.0  
**Дата:** 2025-06-07
