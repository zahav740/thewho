# Исправление: Сохранение данных планирования

## Проблема

❌ **Данные планирования исчезали при обновлении страницы**
- Все запланированные операции терялись
- Алерты о дедлайнах исчезали
- Приходилось заново создавать планирование

## Решение

✅ **Автоматическое сохранение в localStorage**

### 1. Сохранение данных в localStorage

```typescript
// Загружаем данные при инициализации
const [planningResults, setPlanningResults] = useState<PlanningResult[]>(() => {
  const saved = localStorage.getItem(PLANNING_RESULTS_KEY);
  return saved ? JSON.parse(saved) : [];
});

// Автоматически сохраняем при изменении
useEffect(() => {
  localStorage.setItem(PLANNING_RESULTS_KEY, JSON.stringify(planningResults));
}, [planningResults]);
```

### 2. Функция очистки планирования

```typescript
const clearPlanning = useCallback(() => {
  setPlanningResults([]);
  setAlerts([]);
  localStorage.removeItem(PLANNING_RESULTS_KEY);
  localStorage.removeItem(PLANNING_ALERTS_KEY);
}, []);
```

### 3. Предупреждения о перезаписи

При нажатии кнопок планирования теперь показывается предупреждение:

```typescript
if (planningResults.length > 0) {
  const confirmed = window.confirm(
    `У вас уже есть ${planningResults.length} запланированных операций.\n\n` +
    `Новое планирование заменит все существующие данные.\n\n` +
    `Продолжить?`
  );
  if (!confirmed) return;
}
```

### 4. Автоматическая очистка устаревших данных

```typescript
useEffect(() => {
  // Проверяем актуальность запланированных операций
  if (planningResults.length > 0 && orders.length > 0) {
    const validResults = planningResults.filter(result => {
      const order = orders.find(o => o.id === result.orderId);
      if (!order) return false;
      
      const operation = order.operations.find(op => op.id === result.operationId);
      return !!operation;
    });
    
    if (validResults.length !== planningResults.length) {
      if (validResults.length === 0) {
        clearPlanning(); // Все устарело
      } else {
        setPlanningResults(validResults); // Только актуальные
      }
    }
  }
}, [orders, planningResults, clearPlanning]);
```

## Новые возможности

### ✨ Кнопка "Очистить планирование"

- Появляется только когда есть запланированные операции
- Требует подтверждения перед очисткой
- Полностью очищает данные из памяти и localStorage

### ✨ Защита от случайной потери данных

- Предупреждение при создании нового плана поверх существующего
- Автоматическая очистка только когда данные больше не актуальны
- Возможность восстановления после перезагрузки страницы

## Ключи localStorage

```typescript
const PLANNING_RESULTS_KEY = 'planningResults';
const PLANNING_ALERTS_KEY = 'planningAlerts';
```

Данные сохраняются в браузере пользователя и восстанавливаются при следующем посещении.

## Сценарии использования

### 🔄 Обновление страницы
1. Пользователь создает планирование
2. Обновляет страницу (F5 или закрытие/открытие)
3. ✅ Все данные планирования сохранены и отображаются

### 🗑️ Намеренная очистка
1. Нажимает "Очистить планирование"
2. Подтверждает действие
3. ✅ Данные полностью удалены

### 🔄 Новое планирование
1. При наличии существующих данных показывается предупреждение
2. Пользователь может отменить или продолжить
3. ✅ Защита от случайной потери данных

### 🔧 Изменение заказов
1. При удалении/изменении заказов система проверяет актуальность планирования
2. Устаревшие операции удаляются автоматически
3. ✅ Планирование всегда соответствует текущим заказам

## Преимущества

- ✅ **Persistency**: Данные не теряются при перезагрузке
- ✅ **User safety**: Предупреждения о перезаписи данных
- ✅ **Data integrity**: Автоматическая очистка устаревших данных
- ✅ **Better UX**: Пользователь может продолжить работу с того же места

## Техническая реализация

### Компоненты изменены:
- `useProductionPlanning.ts` - сохранение в localStorage
- `ProductionPlanningDashboard.tsx` - кнопка очистки и предупреждения

### Новые функции:
- `clearPlanning()` - очистка всех данных планирования
- Автоматическое сохранение при каждом изменении
- Проверка актуальности данных при изменении заказов

Теперь пользователи могут быть уверены, что их работа по планированию не пропадет при обновлении страницы, а система будет предупреждать о возможной потере данных при создании нового плана.
