# PDF Integration Guide - Руководство по интеграции PDF

## 📑 Обзор

Система Production CRM теперь поддерживает загрузку, просмотр и управление PDF документами для заказов. Эта функциональность позволяет прикреплять чертежи, техническую документацию и другие PDF файлы к заказам.

## 🎯 Функциональность

### ✨ Основные возможности:
- 📁 **Загрузка PDF файлов** до 100MB для каждого заказа
- 👁️ **Встроенный просмотр PDF** в модальном окне
- 📱 **Адаптивный дизайн** для мобильных устройств
- 🔄 **Замена существующих файлов**
- 🗑️ **Удаление PDF документов**
- ⬇️ **Скачивание файлов**
- 🌐 **Поддержка многоязычности** (русский/английский)

## 🏗️ Архитектура

### Frontend компоненты:
```
src/
├── components/common/PdfUploader/
│   ├── PdfUploader.tsx          # Основной компонент загрузки PDF
│   └── index.ts                 # Экспорт компонента
├── services/
│   └── pdfApi.ts               # API для работы с PDF
├── pages/Database/components/
│   ├── OrderForm.SIMPLE.tsx    # Обновленная форма заказа с PDF
│   └── OrderForm.PDF.tsx       # Отдельная версия с полной поддержкой PDF
└── i18n/
    └── translations.ts         # Переводы для PDF функций
```

### Backend endpoints:
```
POST   /orders/:id/upload-pdf   # Загрузка PDF файла
GET    /orders/:id/pdf          # Просмотр PDF файла
DELETE /orders/:id/pdf          # Удаление PDF файла
```

## 🚀 Использование

### 1. Создание заказа с PDF

```typescript
// 1. Создайте заказ
const order = await ordersApi.create(orderData);

// 2. Загрузите PDF файл
const result = await pdfApi.uploadPdf(order.id, pdfFile);

if (result.success) {
  console.log('PDF загружен:', result.pdfPath);
}
```

### 2. Использование компонента PdfUploader

```tsx
import { PdfUploader } from 'components/common/PdfUploader';

function OrderForm() {
  const [pdfPath, setPdfPath] = useState<string>();

  const handlePdfUpload = async (file: File) => {
    const result = await pdfApi.uploadPdf(orderId, file);
    if (result.success) {
      setPdfPath(result.pdfPath);
    }
  };

  const handlePdfRemove = async () => {
    await pdfApi.deletePdf(orderId);
    setPdfPath(undefined);
  };

  return (
    <PdfUploader
      pdfPath={pdfPath}
      onUpload={handlePdfUpload}
      onRemove={handlePdfRemove}
      showPreview={true}
    />
  );
}
```

### 3. Просмотр PDF

PDF файлы автоматически отображаются в модальном окне с помощью встроенного `iframe`. Поддерживается:
- Масштабирование
- Навигация по страницам
- Полноэкранный режим
- Скачивание файла

## 📋 API Reference

### PdfUploader Props

| Prop | Тип | Описание |
|------|-----|----------|
| `pdfPath` | `string?` | Путь к текущему PDF файлу |
| `onUpload` | `(file: File) => Promise<void>` | Обработчик загрузки файла |
| `onRemove` | `() => Promise<void>` | Обработчик удаления файла |
| `loading` | `boolean` | Состояние загрузки |
| `disabled` | `boolean` | Отключить компонент |
| `showPreview` | `boolean` | Показать превью |
| `size` | `'small' \| 'default' \| 'large'` | Размер компонента |

### PDF API Methods

```typescript
// Загрузка PDF файла
pdfApi.uploadPdf(orderId: number, file: File): Promise<PdfUploadResponse>

// Получение URL для просмотра
pdfApi.getPdfUrl(orderId: number): string

// Получение URL по пути файла
pdfApi.getPdfUrlByPath(pdfPath: string): string

// Удаление PDF файла
pdfApi.deletePdf(orderId: number): Promise<PdfUploadResponse>

// Проверка доступности PDF
pdfApi.checkPdfAvailability(orderId: number): Promise<boolean>

// Скачивание PDF файла
pdfApi.downloadPdf(orderId: number, fileName?: string): Promise<void>
```

## 🎨 UI/UX особенности

### Внешний вид:
- **Карточный дизайн** с закругленными углами
- **Цветовая индикация** статуса (зеленый для загруженных файлов)
- **Прогресс бар** при загрузке
- **Анимации** при наведении и взаимодействии

### Вкладки в форме заказа:
1. **📋 Основная информация** - данные заказа и операций
2. **📄 PDF Документация** - управление PDF файлами

### Состояния компонента:
- **Пустое состояние** - предложение загрузить файл
- **Загрузка** - прогресс бар и спиннер
- **Загружен** - превью с кнопками управления
- **Ошибка** - сообщение об ошибке

## 🔧 Конфигурация

### Настройки файлов:
- **Максимальный размер**: 100MB
- **Поддерживаемые форматы**: PDF
- **Директория хранения**: `/backend/uploads/pdf/`
- **Схема именования**: `{timestamp}-{random}.pdf`

### Переменные окружения:
```bash
# Frontend
REACT_APP_API_URL=/api

# Backend
UPLOAD_DIR=./uploads/pdf
MAX_FILE_SIZE=104857600  # 100MB в байтах
```

## 🔒 Безопасность

### Валидация файлов:
- Проверка MIME типа (`application/pdf`)
- Ограничение размера файла
- Санитизация имен файлов
- Проверка расширения файла

### Права доступа:
- Загрузка: только для существующих заказов
- Просмотр: через защищенные endpoints
- Удаление: с подтверждением

## 📱 Мобильная поддержка

- **Адаптивные размеры** кнопок и полей
- **Оптимизированный просмотр** PDF на мобильных устройствах
- **Сенсорные жесты** для взаимодействия
- **Компактное отображение** на малых экранах

## 🌐 Интернационализация

### Поддерживаемые языки:
- **Русский** (ru) - основной язык
- **English** (en) - вторичный язык

### Ключевые переводы:
```typescript
'pdf.title': 'Документация PDF' | 'PDF Documentation'
'pdf.upload_button': 'Загрузить PDF' | 'Upload PDF'
'pdf.preview_title': 'Просмотр PDF документа' | 'PDF Document Preview'
// ... и другие
```

## 🐛 Отладка

### Логирование:
```typescript
// Включить детальное логирование
console.log('📁 Uploading PDF for order:', orderId);
console.log('✅ PDF uploaded successfully:', result);
console.error('❌ PDF upload error:', error);
```

### Частые проблемы:
1. **Ошибка 413 (Payload Too Large)** - файл превышает лимит
2. **Ошибка 415 (Unsupported Media Type)** - неверный формат файла
3. **Ошибка 404** - заказ не найден

## 📊 Мониторинг

### Метрики для отслеживания:
- Количество загруженных PDF файлов
- Средний размер файлов
- Частота ошибок загрузки
- Время обработки файлов

## 🔄 Обновления

### Версия 1.0 (2025-06-21):
- ✅ Базовая функциональность загрузки PDF
- ✅ Встроенный просмотр в модальных окнах
- ✅ Поддержка замены и удаления файлов
- ✅ Адаптивный дизайн
- ✅ Интернационализация

### Планы на будущее:
- 📄 Поддержка множественных файлов
- 🔍 Полнотекстовый поиск в PDF
- 📝 Аннотации и комментарии
- 🔗 Ссылки между документами
- 📋 История изменений файлов

---

**Автор**: Claude Sonnet 4  
**Дата**: 21 июня 2025  
**Версия**: 1.0
