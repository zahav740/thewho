# 📊 Модуль Excel импорта - Готов к использованию

## 🚀 Быстрый запуск

1. **Запустите настройку:**
   ```batch
   SETUP-EXCEL-IMPORT.bat
   ```

2. **Или вручную:**
   ```bash
   cd backend
   npm install
   npx typeorm migration:run -d ormconfig.ts
   npm run start:dev
   ```

## ✨ Особенности

### 🔧 Дефолтное сопоставление колонок
- **C** → `drawingNumber` (Номер чертежа)
- **E** → `quantity` (Количество)  
- **G** → `deadline` (Срок выполнения)
- **K** → `priority` (Приоритет)

### 🛡️ Безопасность и валидация
- Проверка типов файлов (.xlsx, .xls)
- Ограничение размера файла (10MB)
- Дедупликация файлов по MD5 хешу
- Валидация и очистка данных

### 📈 Автоматические улучшения
- Автоматическое заполнение пустых обязательных полей
- Правильная обработка Excel дат
- Конвертация типов данных
- Фильтрация пустых строк

## 🔌 API эндпоинты

### Загрузка файла
```http
POST /api/excel-import/upload
Content-Type: multipart/form-data

- file: Excel файл
- description: Описание (опционально)
- uploadedBy: Автор загрузки (опционально)
- columnMapping: JSON маппинг колонок (опционально)
```

### Предварительный просмотр
```http
POST /api/excel-import/preview
Content-Type: multipart/form-data

- file: Excel файл
- columnMapping: JSON маппинг колонок (опционально)
```

### Список файлов
```http
GET /api/excel-import/files?page=1&limit=10
```

### Данные файла
```http
GET /api/excel-import/files/:id/data?columnMapping={"C":"drawingNumber"}
```

### Дефолтный маппинг
```http
GET /api/excel-import/default-mapping
```

### Статистика
```http
GET /api/excel-import/statistics
```

### Удаление файла
```http
DELETE /api/excel-import/files/:id
```

## 🎯 Пример использования

### Загрузка с кастомным маппингом
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'Заказы на июль 2025');
formData.append('columnMapping', JSON.stringify({
  'A': 'drawingNumber',
  'B': 'quantity',
  'C': 'deadline',
  'D': 'priority'
}));

const response = await fetch('/api/excel-import/upload', {
  method: 'POST',
  body: formData
});
```

### Получение данных с новым маппингом
```javascript
const response = await fetch('/api/excel-import/files/1/data?columnMapping=' + 
  encodeURIComponent(JSON.stringify({
    'C': 'drawingNumber',
    'E': 'quantity',
    'G': 'deadline'
  }))
);
```

## 🔄 Интеграция с заказами

Модуль автоматически интегрируется с системой заказов:

1. **Автоматическое заполнение полей:**
   - `drawingNumber`: Генерируется если пустое
   - `quantity`: По умолчанию 1
   - `deadline`: Завтра, если не указан
   - `priority`: "Средний" по умолчанию

2. **Валидация данных:**
   - Проверка на корректность дат
   - Конвертация чисел
   - Очистка строк от лишних пробелов

3. **Обработка ошибок:**
   - Логирование проблемных значений
   - Fallback к дефолтным значениям
   - Подробные сообщения об ошибках

## 🗃️ Структура базы данных

Таблица `excel_files`:
- `id` - Уникальный идентификатор
- `originalName` - Оригинальное имя файла
- `fileSize` - Размер файла в байтах
- `fileHash` - MD5 хеш для дедупликации
- `fileData` - Бинарные данные файла
- `headers` - Заголовки колонок (JSON)
- `parsedData` - Обработанные данные (JSON)
- `rowsCount` - Количество строк
- `status` - Статус обработки
- `createdAt` / `updatedAt` - Временные метки

## 🎨 Фронтенд компонент

React компонент `ExcelUploadComponent` включает:
- Drag & Drop загрузку файлов
- Настройку маппинга колонок
- Предварительный просмотр данных
- Список загруженных файлов
- Управление файлами

## 🐛 Решение проблем

### Ошибка "relation excel_files does not exist"
```bash
npx typeorm migration:run -d ormconfig.ts
```

### Ошибка "invalid input syntax for type integer: NaN"
Обновленный сервис автоматически обрабатывает такие ошибки с помощью:
- Валидации типов данных
- Конвертации значений
- Дефолтных значений для обязательных полей

### Проблемы с датами Excel
Модуль корректно обрабатывает:
- Числовые даты Excel (дни с 1900-01-01)
- Строковые даты в различных форматах
- Пустые даты (устанавливает дефолт)

## 📝 Логи и отладка

Все операции логируются:
```
[ExcelImportService] Загрузка файла: example.xlsx
[ExcelImportService] Обработано строк: 45
[ExcelImportService] Ошибок валидации: 0
```

## 🚨 Важные замечания

1. **Файлы хранятся в БД** - не занимают место на диске
2. **Дедупликация** - одинаковые файлы не загружаются повторно
3. **Безопасность** - только Excel файлы, ограничение размера
4. **Производительность** - обработка больших файлов оптимизирована
5. **Совместимость** - поддержка .xlsx и .xls форматов

---

✅ **Модуль готов к использованию!** Запустите `SETUP-EXCEL-IMPORT.bat` для начала работы.
