# 🚀 ЗАПУСК PDF ИНТЕГРАЦИИ - Краткое руководство

## ✅ Что было добавлено

### 📁 Новые компоненты:
1. **PdfUploader** - компонент для загрузки и управления PDF файлами
2. **pdfApi** - сервис для работы с PDF через API
3. **Обновленный OrderForm** - теперь с вкладкой "PDF Документация"
4. **Переводы** - поддержка русского и английского языков

### 🔧 Функциональность:
- ✨ Загрузка PDF файлов до 100MB
- 👁️ Встроенный просмотр PDF в модальном окне
- 🗑️ Удаление PDF файлов с подтверждением
- ⬇️ Скачивание файлов
- 📱 Адаптивный дизайн для мобильных устройств

## 🏃‍♂️ Быстрый запуск

### 1. Запуск Backend
```bash
cd backend
npm install
npm run start
# Сервер запустится на http://localhost:5100
```

### 2. Запуск Frontend
```bash
cd frontend
npm install
npm start
# Приложение откроется на http://localhost:3000
```

### 3. Тестирование PDF функций

#### 📝 Создание заказа с PDF:
1. Откройте **База данных** → **Новый заказ**
2. Заполните основную информацию на вкладке "📋 Основная информация"
3. Нажмите **Создать**
4. Откройте созданный заказ для редактирования
5. Перейдите на вкладку **"📄 PDF Документация"**
6. Загрузите PDF файл

#### 👀 Просмотр PDF:
1. После загрузки нажмите на превью PDF
2. Откроется модальное окно с полноэкранным просмотром
3. Используйте кнопки "Скачать" и "Закрыть"

#### 🔄 Замена PDF:
1. На вкладке PDF нажмите **"Заменить PDF"**
2. Выберите новый файл
3. Старый файл будет автоматически удален

#### 🗑️ Удаление PDF:
1. Нажмите кнопку удаления (🗑️) рядом с PDF
2. Подтвердите удаление в диалоговом окне

## 📋 Проверочный чек-лист

### Backend проверки:
- [ ] Сервер запускается без ошибок
- [ ] Директория `/uploads/pdf/` существует
- [ ] API endpoints отвечают:
  - `POST /orders/:id/upload-pdf`
  - `GET /orders/:id/pdf`
  - `DELETE /orders/:id/pdf`

### Frontend проверки:
- [ ] Приложение компилируется без ошибок TypeScript
- [ ] Модальное окно заказа содержит две вкладки
- [ ] Компонент PdfUploader отображается корректно
- [ ] Переводы работают на русском и английском

### Функциональные проверки:
- [ ] Загрузка PDF файла работает
- [ ] Превью PDF отображается
- [ ] Модальное окно просмотра PDF открывается
- [ ] Скачивание PDF файла работает
- [ ] Замена PDF файла работает
- [ ] Удаление PDF файла работает
- [ ] Валидация файлов (только PDF, до 100MB)

## 🐛 Возможные проблемы

### Ошибка импорта PdfUploader:
```typescript
// Если ошибка: Cannot find module 'components/common/PdfUploader'
// Проверьте, что файлы созданы правильно:
// - src/components/common/PdfUploader/PdfUploader.tsx
// - src/components/common/PdfUploader/index.ts
```

### Ошибка API:
```bash
# Если ошибка 404 на PDF endpoints
# Проверьте, что backend содержит обновленный orders.controller.ts
```

### Ошибки переводов:
```typescript
// Если переводы не работают
// Проверьте, что src/i18n/translations.ts содержит ключи 'pdf.*'
```

## 📱 Мобильное тестирование

1. Откройте приложение в режиме разработчика
2. Переключитесь на мобильное разрешение (375x667)
3. Проверьте:
   - Вкладки отображаются корректно
   - Кнопки имеют подходящий размер
   - Модальное окно PDF адаптивно

## 🌐 Тестирование переводов

1. Переключите язык интерфейса (русский ⇄ английский)
2. Проверьте, что все тексты в PDF разделе переведены:
   - Заголовки вкладок
   - Кнопки загрузки/удаления
   - Сообщения об ошибках
   - Диалоговые окна

## 📊 Логи для отладки

### В консоли браузера должны появляться:
```
🔧 OrderForm (PDF) rendered: {visible: true, orderId: 123, isEdit: true}
📁 Uploading PDF for order: 123
✅ PDF uploaded successfully: {success: true, pdfPath: "..."}
```

### В консоли сервера:
```
📁 ПРОДАКШЕН: Загрузка PDF для заказа 123
✅ PDF успешно загружен для заказа 123
```

## ⚡ Быстрые команды

```bash
# Полная перезагрузка разработки
cd frontend && npm start &
cd backend && npm run start &

# Проверка TypeScript ошибок
cd frontend && npx tsc --noEmit

# Проверка API
curl -X GET http://localhost:5100/orders
```

## 🎯 Следующие шаги

После успешного тестирования базовой функциональности можно:

1. **Добавить поддержку множественных файлов**
2. **Интегрировать PDF в список заказов** (показать иконку PDF)
3. **Добавить предварительный просмотр в карточках заказов**
4. **Создать галерею PDF файлов**
5. **Добавить поиск по содержимому PDF**

---

**Готово!** 🎉 PDF интеграция полностью настроена и готова к использованию.

Для получения полной документации см. `PDF_INTEGRATION_GUIDE.md`
