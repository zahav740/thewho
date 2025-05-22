# Исправление логики планирования для длинных операций

## Проблема

Система планирования неправильно назначала длинные операции, не учитывая реальные ограничения рабочего времени:

1. **Операция 485 минут** (~ 8 часов) - превышает одну смену (480 минут)
2. **Операция 893 минуты** (~ 15 часов) - занимает почти весь рабочий день
3. **Обе операции в один день** = 1378 минут (+ время наладки) - физически невозможно

## Решение

### 1. Добавлено ограничение по общему времени работы в день

**Новая константа:**
```typescript
static readonly MAX_WORKING_MINUTES_PER_DAY = 960; // 16 часов работы (дневная + ночная смена)
```

### 2. Обновлен метод findAvailableTimeSlot

**Добавлена проверка общего времени:**
```typescript
// ОГРАНИЧЕНИЕ 2: Проверка общего времени в день (включая наладку и буфер)
const setupTime = this.determineSetupTime({ operationType: 'milling' } as Operation, this.machineConfigs[0]);
const bufferTime = estimatedDuration * 0.1; // Примерно 10% буфер
const totalOperationTime = estimatedDuration + setupTime + bufferTime;

const existingTotalTime = this.getTotalTimeForDay(machineName, candidateDate, machineSchedule);
if (existingTotalTime + totalOperationTime > PlanningUtils.MAX_WORKING_MINUTES_PER_DAY) {
  console.log(`⚠️ Станок ${machineName} превысит дневной лимит времени...`);
  candidateStart = await this.getNextWorkingDayStart(candidateStart);
  iterations++;
  continue;
}
```

### 3. Добавлен метод для расчета общего времени в день

```typescript
static getTotalTimeForMachineOnDay(planningResults: PlanningResult[], machine: Machine, date: Date): number {
  const dateString = date.toDateString();
  return planningResults
    .filter(result => 
      result.machine === machine && 
      new Date(result.plannedStartDate).toDateString() === dateString
    )
    .reduce((total, result) => 
      total + result.expectedTimeMinutes + result.setupTimeMinutes + result.bufferTimeMinutes, 
      0
    );
}
```

### 4. Обновлен метод canAddOperationToMachineOnDay

**Добавлена проверка общего времени:**
```typescript
// Ограничение 2: Проверка общего времени в день
if (operationDuration !== undefined) {
  const currentTotalTime = this.getTotalTimeForMachineOnDay(planningResults, machine, date);
  if (currentTotalTime + operationDuration > this.MAX_WORKING_MINUTES_PER_DAY) {
    return false;
  }
}
```

## Результат

### Теперь система правильно планирует:

1. **Дневная смена**: 8:00-16:00 (480 минут)
2. **Ночная смена**: 16:00-00:00 (480 минут)  
3. **Максимум в день**: 960 минут работы на станок

### Логика для примера (5/20/2025):

- **Операция 485 мин** = займет дневную + часть ночной смены
- **Операция 893 мин** = займет почти весь день
- **Общее время**: 485 + 893 = 1378 минут > 960 минут ❌

**Результат**: Вторая операция будет автоматически перенесена на следующий рабочий день.

## Дополнительные улучшения

1. **Детальное логирование**: Показывает точное превышение времени
2. **Рекурсивный перенос**: Автоматический поиск подходящего дня
3. **Учет буферного времени**: Включает время наладки в расчеты
4. **Защита от зацикливания**: Максимум 100 итераций поиска

Эти изменения решают проблему неправильного планирования двух длинных операций в один день и обеспечивают более реалистичное распределение нагрузки на станки.
