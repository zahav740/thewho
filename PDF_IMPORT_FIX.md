# 🔧 Быстрое исправление ошибок импорта PDF

## Проблема
Ошибки компиляции TypeScript из-за неправильных импортов в файлах PDF модуля.

## Решение

### 1. Замените содержимое файла pdfApi.ts
Скопируйте весь код из файла `pdfApi.FIXED.ts` в `pdfApi.ts`

### 2. Исправьте импорты в компонентах

#### В OrderForm.SIMPLE.tsx:
```typescript
// Было:
import { pdfApiFixed as pdfApi } from '../../../services/pdfApi.fixed';

// Стало:
import { pdfApi } from '../../../services/pdfApi';
```

#### В InlinePdfViewer.FIXED.tsx:
```typescript
// Было:
import { pdfApiFixed } from '../../services/pdfApi.fixed';

// Стало:
import { pdfApi } from '../../services/pdfApi';
```

#### В OrderForm.FIXED.tsx:
```typescript
// Было:
import { pdfApiFixed, PdfDuplicateConflict, PdfUploadResponse } from '../../../services/pdfApi.fixed';

// Стало:
import { pdfApi, PdfDuplicateCheck, PdfUploadResult } from '../../../services/pdfApi';
```

### 3. Обновите вызовы методов

#### В InlinePdfViewer.FIXED.tsx:
```typescript
// Было:
const isAvailable = await pdfApiFixed.checkPdfUrlAvailability(pdfUrl);
pdfApiFixed.downloadPdfByUrl(pdfUrl, fileName);

// Стало:
const result = await pdfApi.checkAvailability(pdfUrl);
const isAvailable = result.accessible;

// Для скачивания:
const link = document.createElement('a');
link.href = pdfUrl;
link.download = fileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

### 4. Основные изменения в API

- `pdfApiFixed` → `pdfApi`
- `PdfDuplicateConflict` → `PdfDuplicateCheck`
- `PdfUploadResponse` → `PdfUploadResult`
- `checkPdfUrlAvailability()` → `checkAvailability()` (возвращает объект с полем `accessible`)
- `downloadPdfByUrl()` → используйте стандартный способ через `<a>` элемент

### 5. Перезапустите приложение
```bash
npm start
```

После этих исправлений все ошибки компиляции должны исчезнуть! ✅
