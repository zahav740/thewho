# Реализация поля "Время начала наладки" в Shift Tracking

## Обзор изменений

В разделе "Add Setup" системы отслеживания смен (Shift Tracking) было добавлено новое поле ввода "Время начала наладки" для более точной корректировки планов на основе реальных данных.

## Внесенные изменения

### 1. Обновление интерфейса Setup (types/index.ts)
```typescript
export interface Setup {
  id: string;
  drawingNumber: string;
  setupType: string;
  operationNumber: number;
  timeSpent: number;
  operator: string;
  startTime: string; // Новое поле
  date: string;
  machine: string;
}
```

### 2. Обновление состояния в ShiftsPage.tsx
```typescript
const [setups, setSetups] = useState<{
  drawingNumber: string;
  setupType: string;
  operationNumber: number;
  timeSpent: number;
  operator: string;
  startTime: string; // Новое поле
}[]>([]);
```

### 3. Добавление поля в функцию создания новой наладки
```typescript
const handleAddSetup = () => {
  setSetups([...setups, {
    drawingNumber: '',
    setupType: '',
    operationNumber: 1,
    timeSpent: 0,
    operator: operators[0] || '',
    startTime: '' // Новое поле с пустым значением по умолчанию
  }]);
};
```

### 4. Обновление UI компонента
- **Новое расположение полей**: Изменена сетка с `grid-cols-[200px_150px_80px_120px_150px_60px]` на `grid-cols-[200px_150px_80px_100px_120px_150px_60px]`
- **Новое поле ввода**:
  ```tsx
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Время начала наладки
    </label>
    <input
      type="time"
      value={setup.startTime}
      onChange={(e) => handleSetupChange(index, 'startTime', e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
  ```

### 5. Передача данных при сохранении
```typescript
addSetup({
  id: `setup-${Date.now()}-${Math.random()}`,
  drawingNumber: setup.drawingNumber,
  setupType: setup.setupType,
  operationNumber: setup.operationNumber,
  timeSpent: setup.timeSpent,
  operator: setup.operator,
  startTime: setup.startTime, // Передача нового поля
  date: shiftDate.toISOString(),
  machine: selectedMachine
});
```

## Порядок полей в интерфейсе

1. **Номер чертежа** - выбор с автозаполнением
2. **Тип наладки** - выпадающий список (3-осевая/4-осевая)
3. **Операция** - номер операции (число)
4. **Время начала наладки** - поле ввода времени (HH:MM) ⭐ **НОВОЕ**
5. **Время наладки (мин)** - длительность в минутах
6. **Оператор** - выбор из списка операторов
7. **Удалить** - кнопка удаления записи

## Технические особенности

- **Тип поля**: `<input type="time">` для удобного ввода времени
- **Формат**: HH:MM (24-часовой формат)
- **Валидация**: Поле не является обязательным, может быть пустым
- **Совместимость**: Обратная совместимость с существующими данными сохранена

## Преимущества

1. **Точное отслеживание**: Возможность фиксировать не только длительность наладки, но и время начала
2. **Лучшая аналитика**: Больше данных для анализа эффективности производства
3. **Планирование**: Корректировка планов с учетом реального времени начала работ
4. **Отчетность**: Более детальные отчеты по использованию рабочего времени

## Использование

1. Перейти в раздел "Shift Tracking"
2. Выбрать станок
3. В разделе "Setup Section" нажать "Добавить наладку"
4. Заполнить все поля, включая новое поле "Время начала наладки"
5. Сохранить данные

Поле "Время начала наладки" позволяет более точно отслеживать производственные процессы и корректировать планы на основе фактических данных.
