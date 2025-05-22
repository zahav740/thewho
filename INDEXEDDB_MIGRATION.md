# 🚀 Переход на IndexedDB для увеличения объема хранения

## Что изменилось

Вместо localStorage (ограничение ~5-10MB) теперь используется **IndexedDB**, который может хранить **гигабайты данных**.

## Как внедрить

### 1. Замените AppContext

Замените импорт в вашем `src/App.tsx` или главном файле:

```tsx
// Было:
import { AppProvider } from './context/AppContext';

// Стало:
import { AppProvider } from './context/AppContextIndexedDB';
```

### 2. Добавьте компонент информации о хранилище (опционально)

В любое место где хотите показать статистику:

```tsx
import StorageInfo from './components/StorageInfo';

// В компоненте:
<StorageInfo />
```

## Преимущества IndexedDB

| Characteristic | localStorage | IndexedDB |
|---------------|--------------|-----------|
| **Размер** | ~5-10MB | Несколько GB |
| **Производительность** | Синхронная | Асинхронная |
| **Типы данных** | Только строки | Любые типы |
| **Транзакции** | Нет | Есть |
| **Индексы** | Нет | Есть |

## Автоматическая миграция

При первом запуске:
1. ✅ Инициализируется IndexedDB
2. ✅ Данные автоматически мигрируют из localStorage  
3. ✅ localStorage очищается после миграции
4. ✅ Показывается статус миграции

## Fallback на localStorage

Если IndexedDB недоступен:
- Автоматически откатывается на localStorage
- Приложение продолжает работать
- Показывается предупреждение о ограничениях

## Проверка размера данных

```javascript
// В консоли браузера
navigator.storage.estimate().then(estimate => {
  console.log('Квота:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
  console.log('Использовано:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('Доступно:', ((estimate.quota - estimate.usage) / 1024 / 1024).toFixed(2), 'MB');
});
```

## Альтернативные решения

### 1. Web Storage API (будущее)
```javascript
// Экспериментальный API для увеличения квоты
navigator.storage.persist().then(granted => {
  if (granted) {
    console.log('Постоянное хранилище получено');
  }
});
```

### 2. File System Access API
```javascript
// Сохранение в файловую систему (только Chrome)
const fileHandle = await window.showSaveFilePicker({
  suggestedName: 'backup.json',
  types: [{
    description: 'JSON files',
    accept: { 'application/json': ['.json'] }
  }]
});
```

### 3. Сжатие данных
```bash
npm install lz-string
```

```javascript
import LZString from 'lz-string';

// Сжимать перед сохранением
const compressed = LZString.compress(JSON.stringify(data));
localStorage.setItem('key', compressed);

// Разжимать при загрузке  
const data = JSON.parse(LZString.decompress(localStorage.getItem('key')));
```

## Итоговый объем хранения

После внедрения IndexedDB:
- **До**: ~5-10 MB (localStorage)
- **После**: ~2-10 GB (IndexedDB)
- **Увеличение**: в **200-1000 раз** больше! 🎉

## Мониторинг

Компонент `StorageInfo` показывает:
- 📊 Текущий размер базы данных
- 💾 Доступное место
- 📈 Процент использования квоты
- ✅ Статус миграции