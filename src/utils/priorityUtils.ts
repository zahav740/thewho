// Утилиты для работы с приоритетами
export type PriorityValue = number | string;

export interface PriorityInfo {
  value: number;
  color: string;
  textKey: string;
}

/**
 * Нормализует приоритет к числовому значению
 * 1 = Высокий, 2 = Средний, 3 = Низкий
 */
export const normalizePriority = (priority: PriorityValue): number => {
  if (typeof priority === 'number') {
    return priority;
  }
  
  const priorityStr = String(priority || '').toLowerCase();
  switch (priorityStr) {
    case 'high':
    case 'высокий':
    case '1':
      return 1;
    case 'medium':
    case 'средний':
    case '2':
      return 2;
    case 'low':
    case 'низкий':
    case '3':
      return 3;
    default:
      // Пытаемся парсить как число
      const parsed = parseInt(priorityStr);
      return isNaN(parsed) ? 2 : parsed; // По умолчанию средний
  }
};

/**
 * Получает информацию о приоритете
 */
export const getPriorityInfo = (priority: PriorityValue): PriorityInfo => {
  const normalizedPriority = normalizePriority(priority);
  
  switch (normalizedPriority) {
    case 1:
      return {
        value: 1,
        color: 'text-red-600',
        textKey: 'high'
      };
    case 2:
      return {
        value: 2,
        color: 'text-yellow-600',
        textKey: 'medium'
      };
    case 3:
      return {
        value: 3,
        color: 'text-green-600',
        textKey: 'low'
      };
    default:
      return {
        value: normalizedPriority,
        color: 'text-gray-600',
        textKey: 'unknown'
      };
  }
};

/**
 * Получает цвет для приоритета
 */
export const getPriorityColor = (priority: PriorityValue): string => {
  return getPriorityInfo(priority).color;
};

/**
 * Получает ключ перевода для приоритета
 */
export const getPriorityTextKey = (priority: PriorityValue): string => {
  return getPriorityInfo(priority).textKey;
};

/**
 * Получает отображаемый текст для приоритета (без перевода)
 */
export const getPriorityDisplayText = (priority: PriorityValue): string => {
  const info = getPriorityInfo(priority);
  
  switch (info.textKey) {
    case 'high':
      return 'Высокий';
    case 'medium':
      return 'Средний';
    case 'low':
      return 'Низкий';
    default:
      return priority ? String(priority) : 'Не указан';
  }
};
