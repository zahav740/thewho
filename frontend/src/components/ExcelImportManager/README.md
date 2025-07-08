# Excel Import Manager

React компонент для управления Excel файлами в веб-приложении.

## Возможности

- 🚀 **Drag & Drop загрузка** - Перетаскивание файлов для быстрой загрузки
- 📊 **Предварительный просмотр данных** - Просмотр содержимого Excel файлов
- 🔍 **Поиск и фильтрация** - Поиск файлов по названию и фильтрация по статусу
- 📈 **Статистика в реальном времени** - Отображение общей статистики по файлам
- 🔄 **Повторная обработка** - Возможность переобработки файлов с новыми параметрами
- 📱 **Адаптивный дизайн** - Работает на всех устройствах
- ⚡ **Пагинация** - Эффективная работа с большими списками файлов

## Установка

1. Скопируйте папку `ExcelImportManager` в ваш проект
2. Убедитесь, что установлены зависимости:

```bash
npm install lucide-react
```

## Использование

### Базовое использование

```tsx
import ExcelImportManager from './components/ExcelImportManager';

function App() {
  return (
    <div className="App">
      <ExcelImportManager />
    </div>
  );
}
```

### Интеграция с существующим приложением

```tsx
import { ExcelImportService } from './components/ExcelImportManager';

// Создание экземпляра сервиса
const excelService = new ExcelImportService();

// Загрузка файла программно
async function uploadFile(file: File) {
  try {
    const result = await excelService.uploadFile(file, {
      description: 'Загружено программно',
      maxRows: 5000,
      skipEmptyRows: true,
    });
    console.log('Файл загружен:', result);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
}

// Получение списка файлов
async function getFiles() {
  try {
    const files = await excelService.getFiles(1, 20);
    console.log('Файлы:', files);
  } catch (error) {
    console.error('Ошибка получения файлов:', error);
  }
}
```

## API Endpoints

Компонент работает с следующими API endpoints:

- `POST /api/excel-import/upload` - Загрузка файла
- `GET /api/excel-import/files` - Список файлов
- `GET /api/excel-import/files/:id/data` - Данные файла
- `DELETE /api/excel-import/files/:id` - Удаление файла
- `POST /api/excel-import/files/:id/reparse` - Повторная обработка
- `GET /api/excel-import/stats` - Статистика

## Настройки загрузки

При загрузке файла можно указать следующие параметры:

- **description** - Описание файла
- **maxRows** - Максимальное количество строк для обработки (по умолчанию 10,000)
- **sheetIndex** - Индекс листа для обработки (начиная с 0)
- **skipEmptyRows** - Пропускать пустые строки (по умолчанию true)

## Компоненты

### ExcelImportManager
Основной компонент для управления файлами.

### FileUploadArea
Область загрузки файлов с поддержкой drag & drop.

### FilesTable
Таблица со списком загруженных файлов.

### FileDataViewer
Модальное окно для просмотра данных файла.

### StatusBadge
Компонент отображения статуса файла.

## Стили

Компонент использует Tailwind CSS для стилизации. Убедитесь, что Tailwind CSS подключен в вашем проекте.

### Основные классы стилей

- `bg-white` - Белый фон
- `rounded-lg` - Скругленные углы
- `border-2 border-dashed` - Пунктирная граница
- `text-blue-600` - Синий цвет текста
- `hover:bg-gray-50` - Изменение фона при наведении

## Типы данных

### ExcelFile
```typescript
interface ExcelFile {
  id: number;
  originalName: string;
  description: string;
  fileSize: number;
  rowsCount: number;
  sheetsCount: number;
  status: 'uploading' | 'parsed' | 'error' | 'processing';
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### UploadOptions
```typescript
interface UploadOptions {
  description?: string;
  maxRows?: number;
  sheetIndex?: number;
  skipEmptyRows?: boolean;
}
```

## Обработка ошибок

Компонент автоматически обрабатывает ошибки и отображает соответствующие сообщения:

- Ошибки загрузки файлов
- Ошибки сети
- Ошибки валидации
- Ошибки парсинга

## Производительность

- **Ленивая загрузка данных** - Данные файлов загружаются только при просмотре
- **Пагинация** - Список файлов загружается порциями
- **Дебаунс поиска** - Поиск выполняется с задержкой для экономии ресурсов
- **Виртуализация** - Для больших таблиц данных

## Кастомизация

### Изменение стилей

```tsx
// Переопределение цветовой схемы
const customTheme = {
  primary: 'bg-purple-600',
  secondary: 'bg-gray-100',
  success: 'bg-green-600',
  error: 'bg-red-600',
};
```

### Добавление дополнительных функций

```tsx
// Расширение функциональности
const EnhancedExcelImportManager = () => {
  const handleExport = async (fileId: number) => {
    // Логика экспорта данных
  };

  const handleShare = async (fileId: number) => {
    // Логика расшаривания файла
  };

  return (
    <ExcelImportManager 
      onExport={handleExport}
      onShare={handleShare}
    />
  );
};
```

## Мобильная адаптация

Компонент полностью адаптирован для мобильных устройств:

- Сворачиваемые колонки в таблице
- Адаптивные кнопки действий
- Оптимизированные модальные окна
- Touch-friendly интерфейс

## Тестирование

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ExcelImportManager from './ExcelImportManager';

test('загрузка файла', async () => {
  render(<ExcelImportManager />);
  
  const fileInput = screen.getByLabelText(/файл/i);
  const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  fireEvent.change(fileInput, { target: { files: [file] } });
  
  // Проверяем загрузку
});
```

## Требования

- React 16.8+
- TypeScript 4.0+
- Tailwind CSS 3.0+
- lucide-react 0.263+

## Браузерная поддержка

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Лицензия

MIT License
