# 🔧 ДИАГНОСТИКА PDF ПРЕВЬЮ - Пошаговое решение проблем

## 🚨 Проблема: "Не вижу превью PDF"

### 📋 Чек-лист диагностики:

#### 1. ✅ Проверка Backend
```bash
# Запустить backend сервер
cd backend
npm run start

# Проверить, что сервер работает на порту 5100
curl http://localhost:5100/api/orders
```

#### 2. ✅ Проверка директории PDF
```bash
# Проверить существование директории
ls -la backend/uploads/pdf/

# Создать директорию если нет
mkdir -p backend/uploads/pdf
```

#### 3. ✅ Проверка API endpoints
```bash
# Тест загрузки PDF (замените 123 на реальный ID заказа)
curl -X POST -F "file=@test.pdf" http://localhost:5100/api/orders/123/upload-pdf

# Тест получения PDF по имени файла
curl http://localhost:5100/api/orders/pdf/test-document.pdf
```

#### 4. ✅ Проверка Frontend
```bash
# Запустить frontend
cd frontend
npm start

# Проверить в консоли браузера на ошибки
# Открыть F12 -> Console
```

## 🔍 Пошаговая диагностика

### Шаг 1: Проверить консоль браузера
1. Откройте DevTools (F12)
2. Перейдите в Console
3. Ищите ошибки:
   - ❌ `404 Not Found` - файл PDF не найден
   - ❌ `CORS error` - проблемы с политикой CORS
   - ❌ `TypeError` - ошибки JavaScript

### Шаг 2: Проверить Network tab
1. Откройте DevTools -> Network
2. Попробуйте загрузить PDF
3. Ищите запросы к `/api/orders/pdf/`
4. Проверьте статус ответа:
   - ✅ `200 OK` - файл найден
   - ❌ `404 Not Found` - файл не найден
   - ❌ `500 Internal Server Error` - ошибка сервера

### Шаг 3: Проверить структуру URL
Убедитесь, что URL формируется правильно:
```
✅ Правильно: http://localhost:5100/api/orders/pdf/1234567-890.pdf
❌ Неправильно: http://localhost:5100/api/orders/1234567-890.pdf/pdf
```

### Шаг 4: Добавить тестовый PDF файл
```bash
# Создать тестовый PDF файл
cd backend/uploads/pdf/
echo "%PDF-1.4 Test PDF" > test-document.pdf

# Проверить доступность
curl http://localhost:5100/api/orders/pdf/test-document.pdf
```

## 🛠️ Конкретные исправления

### Исправление 1: Обновить backend controller
Файл: `backend/src/modules/orders/orders.controller.ts`

Убедитесь, что есть эндпоинт:
```typescript
@Get('pdf/:filename')
async getPdfByFilename(@Param('filename') filename: string, @Res() res: Response) {
  // ... код для отправки PDF файла
}
```

### Исправление 2: Обновить frontend API URL
Файл: `frontend/src/services/pdfApi.ts`

```typescript
getPdfUrlByPath(pdfPath: string): string {
  const baseUrl = process.env.REACT_APP_API_URL || '/api';
  return `${baseUrl}/orders/pdf/${pdfPath}`;
}
```

### Исправление 3: Проверить CORS настройки
Файл: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## 🔧 Быстрые тесты

### Тест 1: Прямой доступ к PDF
Откройте в браузере:
```
http://localhost:5100/api/orders/pdf/test-document.pdf
```
Должен открыться PDF файл или показать ошибку 404.

### Тест 2: Проверка iframe
Добавьте в любую страницу:
```html
<iframe 
  src="http://localhost:5100/api/orders/pdf/test-document.pdf" 
  width="100%" 
  height="500px"
></iframe>
```

### Тест 3: Консольный тест
В консоли браузера:
```javascript
fetch('http://localhost:5100/api/orders/pdf/test-document.pdf')
  .then(response => console.log('Status:', response.status))
  .catch(error => console.error('Error:', error));
```

## 📝 Логирование для отладки

### В Backend (orders.controller.ts):
```typescript
console.log('📄 PDF request:', { filename, fullPath, exists: fs.existsSync(fullPath) });
```

### В Frontend (PdfUploader.tsx):
```typescript
console.log('🔍 PDF URL:', getPdfUrl(pdfPath));
console.log('📋 PDF Path:', pdfPath);
```

## 🚀 Если ничего не помогает

### Альтернативный способ отображения PDF:

1. **PDF.js библиотека:**
```bash
npm install react-pdf
```

2. **Google PDF Viewer:**
```javascript
const pdfUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(getPdfUrl(pdfPath))}&embedded=true`;
```

3. **Скачивание вместо просмотра:**
```javascript
const handleView = () => {
  window.open(getPdfUrl(pdfPath), '_blank');
};
```

## ✅ Финальная проверка

Если PDF превью работает, вы должны увидеть:
1. ✅ Вкладка "PDF Документация" в форме заказа
2. ✅ Кнопка "Просмотр" у загруженного PDF
3. ✅ Модальное окно с iframe, показывающим PDF
4. ✅ Кнопки "Скачать" и "Закрыть"

## 📞 Поддержка

Если проблемы продолжаются:
1. Проверьте все логи в консоли
2. Убедитесь, что backend и frontend запущены
3. Проверьте, что файлы PDF действительно сохраняются в `uploads/pdf/`
4. Попробуйте альтернативные способы отображения PDF

---

**Помните:** PDF превью работает через iframe, который требует правильные HTTP заголовки и CORS настройки.
