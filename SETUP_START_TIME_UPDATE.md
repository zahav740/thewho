# Добавлено поле ввода времени начала наладки

## Обзор обновления

В SetupCompletionModal добавлено дополнительное поле для ввода фактического времени начала наладки. Это позволяет еще более точно корректировать планы производства на основе реальных данных.

## Новые возможности

### 1. Поле ввода времени начала наладки
- **Тип поля**: `<input type="time">`
- **Автоматическая инициализация**: Заполняется плановым временем начала по умолчанию
- **Валидация**: Обязательное поле для заполнения
- **Формат**: HH:MM (24-часовой формат)

### 2. Расширенная информационная панель
- Отображение планового времени начала операции
- Сравнение с фактическим временем начала
- Визуальные подсказки для пользователя

### 3. Улучшенное перепланирование
- Учет фактического времени начала при пересчете операций
- Обновление времени начала текущей операции
- Каскадное обновление всех зависимых операций

### 4. Обратная совместимость
- Поддержка старого API (только время наладки)
- Поддержка нового API (объект с временем наладки и временем начала)
- Плавный переход между форматами данных

## Изменения в компонентах

### SetupCompletionModal
```tsx
// Новое состояние
const [actualStartTime, setActualStartTime] = useState('');

// Автоматическая инициализация времени начала
React.useEffect(() => {
  if (planningResult && !actualStartTime) {
    const plannedStart = new Date(planningResult.plannedStartDate);
    const timeString = plannedStart.toTimeString().slice(0, 5);
    setActualStartTime(timeString);
  }
}, [planningResult, actualStartTime]);

// Обновленная логика отправки
const setupCompletionData = {
  actualSetupTime: setupTimeNumber,
  actualStartTime
};
```

### ProductionPlanner
```typescript
// Обновленная сигнатура метода
public async markSetupCompleted(
  resultId: string, 
  actualSetupTime: number, 
  existingResults: PlanningResult[],
  allOrders: Order[],
  actualStartTime?: string  // Новый параметр
): Promise<{ ... }>

// Обновление времени начала операции
if (actualStartTime) {
  const plannedDate = new Date(updated.plannedStartDate);
  const [hours, minutes] = actualStartTime.split(':').map(Number);
  const actualStartDate = new Date(plannedDate);
  actualStartDate.setHours(hours, minutes, 0, 0);
  updated.plannedStartDate = actualStartDate.toISOString();
}
```

### useProductionPlanning
```typescript
// Поддержка обоих форматов данных
const markSetupCompleted = useCallback(async (
  resultId: string, 
  setupData: { actualSetupTime: number; actualStartTime: string } | number
) => {
  // Обработка разных форматов для обратной совместимости
  let actualSetupTime: number;
  let actualStartTime: string | undefined;
  
  if (typeof setupData === 'number') {
    actualSetupTime = setupData;
    actualStartTime = undefined;
  } else {
    actualSetupTime = setupData.actualSetupTime;
    actualStartTime = setupData.actualStartTime;
  }
  // ...
});
```

## Пользовательский интерфейс

### Улучшения в модальном окне:
1. **Время начала наладки**:
   - Поле ввода времени типа `time`
   - Подсказка с плановым временем начала
   - Автоматическое заполнение плановым временем

2. **Время наладки**:
   - Существующее поле остается без изменений
   - Показ разности между плановым и фактическим временем
   - Процентные отклонения

3. **Информационная панель**:
   - Добавлена строка с плановым временем начала
   - Более детальная информация об операции

4. **Валидация формы**:
   - Оба поля (время начала и время наладки) обязательны
   - Кнопка отправки активна только при заполнении всех полей

## Локализация

Добавлены новые ключи переводов:
```typescript
"actual_start_time": "Фактическое время начала наладки",
"planned_start_time": "Плановое время начала",
"enter_start_time": "Укажите время начала наладки",
"setup_start_and_duration_updated": "Обновлено время начала и длительность наладки",
"time_and_start_considered": "Учтено время наладки и время начала"
```

## Преимущества обновления

1. **Повышенная точность**: Учет не только длительности наладки, но и фактического времени начала
2. **Лучшее планирование**: Более точные расчеты времени завершения операций
3. **Улучшенная аналитика**: Больше данных для анализа отклонений от плана
4. **Гибкость**: Возможность корректировать как время выполнения, так и время начала
5. **Обратная совместимость**: Существующий код продолжает работать без изменений

## Использование

1. Откройте модальное окно завершения наладки
2. Проверьте автоматически заполненное время начала (можно изменить при необходимости)
3. Введите фактическое время наладки в минутах
4. Нажмите "Сохранить и перепланировать"
5. Система автоматически пересчитает все зависимые операции с учетом обоих параметров

Обновление полностью интегрировано в существующую систему и не требует дополнительной настройки.
