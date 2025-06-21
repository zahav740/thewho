# ⚡ БЫСТРОЕ РЕШЕНИЕ ПРОБЛЕМЫ "НЕ ВИЖУ ПРЕВЬЮ PDF"

## 🎯 3 простых шага для исправления:

### ШАГ 1: Создать тестовый PDF файл
```bash
# Запустите в корне проекта:
СОЗДАТЬ-ТЕСТОВЫЙ-PDF.bat    # Для Windows
# или
bash create-test-pdf.sh     # Для Linux/Mac
```

### ШАГ 2: Проверить backend эндпоинт
Откройте браузер и перейдите по адресу:
```
http://localhost:5100/api/orders/pdf/test-document.pdf
```

**Ожидаемый результат:** Должен открыться PDF файл  
**Если ошибка 404:** Backend не настроен правильно  
**Если файл открывается:** Проблема в frontend компоненте  

### ШАГ 3: Проверить консоль браузера
1. Откройте форму заказа (Редактировать существующий заказ)
2. Перейдите на вкладку "📄 PDF Документация"  
3. Загрузите любой PDF файл
4. Нажмите на превью или кнопку "Просмотр"
5. Откройте DevTools (F12) и проверьте консоль на ошибки

## 🔧 Быстрые исправления:

### Исправление A: Если backend не работает
```bash
cd backend
npm install
npm run start
# Проверьте, что сервер запущен на порту 5100
```

### Исправление B: Если frontend показывает ошибки
```bash
cd frontend
npm install
npm start
# Проверьте консоль браузера на ошибки TypeScript
```

### Исправление C: Если PDF не загружается в iframe
Добавьте в `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
});
```

## 🎯 Проверочные URL для тестирования:

1. **Backend API:** http://localhost:5100/api/orders
2. **Тестовый PDF:** http://localhost:5100/api/orders/pdf/test-document.pdf  
3. **Frontend:** http://localhost:3000

## 📋 Чек-лист работающей системы:

- [ ] ✅ Backend запущен на порту 5100
- [ ] ✅ Frontend запущен на порту 3000  
- [ ] ✅ Директория `backend/uploads/pdf/` существует
- [ ] ✅ Тестовый PDF файл создан и доступен
- [ ] ✅ В форме заказа есть вкладка "PDF Документация"
- [ ] ✅ Можно загрузить PDF файл
- [ ] ✅ Кнопка просмотра PDF работает
- [ ] ✅ Модальное окно с PDF открывается
- [ ] ✅ В iframe отображается содержимое PDF

## 🚨 Если ничего не работает:

### Аварийное решение - замена iframe на ссылку:
В файле `PdfUploader.tsx` замените iframe на:
```jsx
<div style={{ textAlign: 'center', padding: '50px' }}>
  <Button 
    type="primary" 
    size="large"
    icon={<DownloadOutlined />}
    onClick={() => window.open(getPdfUrl(pdfPath), '_blank')}
  >
    Открыть PDF в новой вкладке
  </Button>
</div>
```

### Альтернативное решение - Google PDF Viewer:
```jsx
const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(getPdfUrl(pdfPath))}&embedded=true`;

<iframe src={googleViewerUrl} ... />
```

## 📞 Последний вариант:

Если PDF превью критично, используйте библиотеку react-pdf:
```bash
npm install react-pdf
```

---

**90% проблем решается правильной настройкой backend эндпоинтов и CORS политики!**
