# Компонент автокомплита для номера чертежа

## Описание

Компонент `DrawingNumberAutocomplete` предоставляет интерактивное поле ввода с функционалом автокомплита для номеров чертежей. Он интегрирован с контекстом приложения для получения существующих номеров чертежей.

## Особенности

- ✅ Автокомплит с поиском по вводу
- ✅ Отображение существующих номеров чертежей из базы заказов
- ✅ Дополнительная информация о существующих заказах (количество, приоритет, операции)
- ✅ Навигация с клавиатуры (стрелки, Enter, Escape)
- ✅ Подсветка совпадающего текста
- ✅ Кнопка очистки поля
- ✅ Сортировка: сначала существующие номера, затем новые примеры
- ✅ Счетчик результатов
- ✅ Сообщение при отсутствии результатов

## Использование

```tsx
import DrawingNumberAutocomplete from './DrawingNumberAutocomplete';

function MyForm() {
  const [drawingNumber, setDrawingNumber] = useState('');

  return (
    <DrawingNumberAutocomplete
      value={drawingNumber}
      onChange={setDrawingNumber}
      onBlur={() => {}}
      error={error}
      required
    />
  );
}
```

## Props

- `value: string` - текущее значение поля
- `onChange: (value: string) => void` - функция обновления значения
- `onBlur?: () => void` - функция при потере фокуса
- `error?: string` - текст ошибки для отображения
- `placeholder?: string` - текст плейсхолдера (по умолчанию: "Введите номер чертежа")
- `required?: boolean` - обязательность поля

## Интеграция с react-hook-form

Компонент уже интегрирован в форму заказа через `Controller` из react-hook-form:

```tsx
<Controller
  control={control}
  name="drawingNumber"
  rules={{ required: 'Обязательное поле' }}
  render={({ field }) => (
    <DrawingNumberAutocomplete
      value={field.value || ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={errors.drawingNumber?.message}
      required
    />
  )}
/>
```

## Управление с клавиатуры

- **Стрелка вниз/вверх** - навигация по списку предложений
- **Enter** - выбор текущего предложения
- **Escape** - закрытие списка предложений

## Источники данных

Компонент получает данные из двух источников:

1. **Существующие номера чертежей** - из контекста приложения через `getAllDrawingNumbers()`
2. **Примеры номеров** - предустановленные примеры для новых чертежей

## Настройка

Для изменения списка примеров номеров чертежей отредактируйте массив `exampleSuggestions` в компоненте:

```tsx
const exampleSuggestions = [
  'DWG-001-2025',
  'DWG-002-2025',
  // добавьте новые примеры здесь
];
```

## Расширение функционала

Для добавления новых функций (например, API-запросы для получения номеров чертежей):

1. Добавьте новый источник данных в useEffect
2. Обновьте логику сортировки и фильтрации в handleInputChange
3. При необходимости добавьте индикатор загрузки

## Стили

Компонент использует Tailwind CSS классы. Основные стили:

- Поле ввода: `border-gray-300`, `focus:ring-blue-500`
- Выделенный элемент: `bg-blue-50`, `text-blue-700`
- Ошибка: `border-red-300`, `focus:ring-red-500`
- Существующий заказ: `bg-blue-100`, `text-blue-600`
