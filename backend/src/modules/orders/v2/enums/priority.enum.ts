/**
 * @file: priority.enum.ts
 * @description: Enum для приоритетов заказов V2
 * @created: 2025-07-03
 * @fixed: 2025-07-04 - изменены на числа для совместимости с DTO
 */
export enum Priority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
  URGENT = 4,
}

// Утилитарные функции для работы с приоритетами
export const getPriorityName = (priority: Priority | number): string => {
  switch (priority) {
    case Priority.HIGH:
    case 1:
      return 'Высокий';
    case Priority.MEDIUM:
    case 2:
      return 'Средний';
    case Priority.LOW:
    case 3:
      return 'Низкий';
    case Priority.URGENT:
    case 4:
      return 'Срочный';
    default:
      return 'Неизвестный';
  }
};

export const isValidPriority = (priority: number): priority is Priority => {
  return Object.values(Priority).includes(priority as Priority);
};
