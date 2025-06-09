# 📊 API для работы с Excel импортом заказов

## 🔍 Новые возможности импорта Excel

### 1. **Детальный анализ Excel файла**
**Endpoint:** `POST /api/enhanced-orders/analyze-excel`

**Описание:** Анализирует Excel файл и показывает все найденные заказы с цветовым кодированием

**Параметры:**
```
- excel: файл (multipart/form-data)
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "fileName": "orders.xlsx",
    "totalRows": 72,
    "orders": [
      {
        "rowNumber": 2,
        "drawingNumber": "DRW-001",
        "quantity": 10,
        "deadline": "31.12.2025",
        "priority": "Высокий",
        "workType": "Фрезерная обработка",
        "color": "red",
        "colorLabel": "🔴 Критичные заказы",
        "operations": [
          {
            "number": 1,
            "type": "Фрезерная",
            "time": 120,
            "axes": 3
          }
        ],
        "selected": true,
        "exists": false
      }
    ],
    "colorStatistics": {
      "green": { "count": 15, "label": "🟢 Готовые заказы" },
      "yellow": { "count": 25, "label": "🟡 Обычные заказы" },
      "red": { "count": 18, "label": "🔴 Критичные заказы" },
      "blue": { "count": 14, "label": "🔵 Плановые заказы" }
    },
    "recommendedFilters": [
      {
        "color": "red",
        "label": "🔴 Критичные заказы",
        "count": 18,
        "description": "Срочные заказы высокого приоритета (18 шт.)",
        "priority": 1,
        "recommended": true
      }
    ]
  },
  "message": "Найдено 72 заказа в файле orders.xlsx"
}
```

### 2. **Выборочный импорт заказов**
**Endpoint:** `POST /api/enhanced-orders/import-selected-orders`

**Описание:** Импортирует только выбранные заказы по цветовым фильтрам и/или конкретным номерам чертежей

**Параметры:**
```
- excel: файл (multipart/form-data)
- selectedOrders: JSON массив номеров чертежей ["DRW-001", "DRW-005"]
- clearExisting: "true" | "false" - очистить существующие данные
- skipDuplicates: "true" | "false" - пропускать дубликаты
- colorFilters: JSON массив цветов ["red", "yellow"]
```

**Пример запроса:**
```javascript
const formData = new FormData();
formData.append('excel', file);
formData.append('selectedOrders', JSON.stringify(["DRW-001", "DRW-005", "DRW-010"]));
formData.append('clearExisting', 'false');
formData.append('skipDuplicates', 'true');
formData.append('colorFilters', JSON.stringify(["red", "yellow"]));

fetch('/api/enhanced-orders/import-selected-orders', {
  method: 'POST',
  body: formData
});
```

**Ответ:**
```json
{
  "success": true,
  "message": "Импорт завершен! Создано: 15, Обновлено: 3, Ошибок: 0",
  "data": {
    "totalRows": 18,
    "processedRows": 18,
    "created": 15,
    "updated": 3,
    "errors": [],
    "colorStatistics": {
      "red": 8,
      "yellow": 10
    },
    "summary": {
      "greenOrders": 0,
      "yellowOrders": 10,
      "redOrders": 8,
      "blueOrders": 0
    }
  }
}
```

### 3. **Полный импорт с фильтрами**
**Endpoint:** `POST /api/enhanced-orders/upload-excel-full`

**Описание:** Загружает весь Excel файл с применением настроек импорта

## 🎨 Цветовая система фильтрации

### Определение цветов:
1. **🟢 Зеленый (Готовые)** - Заказы готовые к производству
2. **🟡 Желтый (Обычные)** - Стандартные заказы
3. **🔴 Красный (Критичные)** - Срочные заказы высокого приоритета
4. **🔵 Синий (Плановые)** - Плановые заказы на будущее

### Логика определения цвета:

1. **По цвету ячейки Excel** (если есть цветовое форматирование)
2. **По содержимому текста:**
   - Зеленый: "готов", "ready", "completed", "done"
   - Красный: "критич", "срочн", "critical", "urgent"
   - Синий: "план", "plan", "scheduled"
   - Желтый: все остальные (по умолчанию)

## 📋 Структура Excel файла

### Ожидаемые колонки:
- **A (Номер чертежа)** - Уникальный идентификатор заказа
- **B (Количество)** - Количество изделий для изготовления
- **C (Срок)** - Дедлайн выполнения заказа
- **D (Приоритет)** - Приоритет заказа (1-4 или текст)
- **E (Тип работы)** - Описание типа работ
- **F+ (Операции)** - Блоки по 4 колонки на операцию:
  - Номер операции
  - Тип операции (фрезерная/токарная)
  - Количество осей
  - Время выполнения (мин)

### Пример структуры:
```
| A        | B  | C          | D       | E               | F | G          | H | I   |
|----------|----|-----------|---------|-----------------|----|------------|---|-----|
| DRW-001  | 10 | 31.12.2025 | Высокий | Фрезерная      | 1  | Фрезерная  | 3 | 120 |
| DRW-002  | 5  | 15.01.2026 | Средний | Токарная       | 1  | Токарная   | 2 | 90  |
```

## 🚀 Использование в Frontend

### 1. Анализ файла перед импортом:
```javascript
// Загрузка и анализ файла
const analyzeFile = async (file) => {
  const formData = new FormData();
  formData.append('excel', file);
  
  const response = await fetch('/api/enhanced-orders/analyze-excel', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  // Показываем пользователю список всех найденных заказов
  displayOrdersList(result.data.orders);
  
  // Показываем статистику по цветам
  displayColorStatistics(result.data.colorStatistics);
  
  // Показываем рекомендуемые фильтры
  displayRecommendedFilters(result.data.recommendedFilters);
};
```

### 2. Выборочный импорт:
```javascript
// Импорт выбранных заказов
const importSelected = async (file, selectedOrders, colorFilters) => {
  const formData = new FormData();
  formData.append('excel', file);
  formData.append('selectedOrders', JSON.stringify(selectedOrders));
  formData.append('colorFilters', JSON.stringify(colorFilters));
  formData.append('clearExisting', 'false');
  formData.append('skipDuplicates', 'true');
  
  const response = await fetch('/api/enhanced-orders/import-selected-orders', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    showSuccessMessage(result.message);
    refreshOrdersList();
  } else {
    showErrorMessage(result.message);
  }
};
```

## 🛡️ Обработка ошибок

### Типичные ошибки:
- **Неправильный формат файла** - только .xlsx, .xls поддерживаются
- **Поврежденный файл** - файл не может быть прочитан
- **Пустой файл** - нет данных для импорта
- **Дублирующиеся номера чертежей** - конфликт при импорте
- **Неправильный формат данных** - некорректные даты или числа

### Пример обработки:
```javascript
try {
  const result = await importSelected(file, selected, filters);
  
  if (result.success) {
    console.log('Успешно импортировано:', result.data.created);
    if (result.data.errors.length > 0) {
      console.warn('Ошибки при импорте:', result.data.errors);
    }
  } else {
    console.error('Ошибка импорта:', result.message);
  }
} catch (error) {
  console.error('Сетевая ошибка:', error);
}
```

---

**Дата обновления:** 2025-06-09
**Версия API:** Enhanced Orders v2.0
