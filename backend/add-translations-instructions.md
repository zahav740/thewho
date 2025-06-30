# Добавление переводов для секций Active Operations и Calendar

## 📋 Что добавлено

### 🎯 Active Operations (25 переводов)
- Заголовки страницы и подзаголовки
- Статистические карточки и метрики
- Фильтры и поиск операций  
- Информация о карточках операций
- Приоритеты операций (низкий, средний, высокий, срочный)
- Статусы операций (выполняется, ожидает, завершена, приостановлена)
- Действия с операциями (пауза, возобновление, завершение, переназначение)
- Уведомления и сообщения

### 📅 Calendar (46 переводов)
- Заголовки страницы календаря
- Виды календаря (месяц, неделя, день, список)
- Навигация по календарю
- События и операции
- Планирование операций
- Временные метки
- Фильтры календаря
- Модальные окна
- Статусы в календаре
- Сообщения системы
- Дни недели (краткие формы)
- Названия месяцев

## 🚀 Как использовать

### Способ 1: Автоматический скрипт (рекомендуется)

1. Установите зависимости (если еще не установлены):
```bash
npm install axios
```

2. Запустите скрипт загрузки:
```bash
node add-active-operations-calendar-translations.js
```

Скрипт автоматически:
- Загрузит все 71 перевод на сервер
- Проверит корректность загрузки
- Выведет статистику по категориям

### Способ 2: Ручная загрузка через API

1. Скопируйте содержимое из JSON файлов
2. Отправьте POST запрос на endpoint:
```
POST https://kasuf.xyz/api/translations/bulk-upsert
```

### Способ 3: Через админ-панель переводов

1. Откройте https://kasuf.xyz/translations
2. Используйте функцию "Массовый импорт"
3. Вставьте JSON данные из файлов

## 📊 Статистика переводов

| Секция | Количество | Категории |
|--------|------------|-----------|
| Active Operations | 25 | Интерфейс, фильтры, статусы, действия |
| Calendar | 46 | Навигация, планирование, временные зоны |
| **Всего** | **71** | UI компоненты |

## ✅ Проверка результата

После загрузки переводов вы можете:

1. Проверить в браузере: https://kasuf.xyz/translations
2. Использовать API: `GET https://kasuf.xyz/api/translations/client`
3. Переключить язык на сайте и убедиться, что новые тексты переводятся

## 🔧 Структура ключей

### Active Operations
```
active_operations.
├── page_title, page_subtitle
├── stats.* (статистика)
├── filters.* (фильтры)
├── card.* (карточки операций)  
├── priority.* (приоритеты)
├── status.* (статусы)
├── actions.* (действия)
└── notifications.* (уведомления)
```

### Calendar
```
calendar.
├── page_title, page_subtitle
├── views.* (виды календаря)
├── navigation.* (навигация)
├── event.* (события)
├── planning.* (планирование)
├── time.* (время)
├── filters.* (фильтры)
├── modal.* (модальные окна)
├── status.* (статусы)
├── messages.* (сообщения)
├── days.* (дни недели)
└── months.* (месяцы)
```

## 🎯 Использование в коде

### React с i18next
```javascript
import { useTranslation } from 'react-i18next';

function ActiveOperationsPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('active_operations.page_title')}</h1>
      <p>{t('active_operations.page_subtitle')}</p>
      <button>{t('active_operations.actions.pause')}</button>
    </div>
  );
}
```

### Прямое обращение к API
```javascript
// Получение всех переводов
const response = await fetch('/api/translations/client');
const translations = await response.json();

// Использование
const title = translations.ru['active_operations.page_title']; // "Мониторинг активных операций"
const titleEn = translations.en['active_operations.page_title']; // "Active Operations Monitoring"
```

## 🔄 Обновление переводов

Для обновления существующих переводов:

1. Отредактируйте файлы JSON
2. Перезапустите скрипт `add-active-operations-calendar-translations.js`
3. Переводы обновятся автоматически (используется upsert)

## 📞 Поддержка

При возникновении проблем:
1. Проверьте доступность API: `GET https://kasuf.xyz/api/health`
2. Убедитесь в корректности JSON структуры
3. Проверьте логи сервера для диагностики ошибок