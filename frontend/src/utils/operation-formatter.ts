/**
 * @file: operation-formatter.ts
 * @description: Утилита для форматирования операций
 * @created: 2025-06-01
 * @updated: 2025-06-01 // Обновлено для работы с числовыми значениями machineAxes
 */

// Типы для валидации данных
interface Operation {
  id?: number | string;
  operationNumber: number | string;
  operationType: string;
  machineAxes: number | string;
  estimatedTime: number | string;
  status?: string;
  completedUnits?: number;
  [key: string]: any; // Для дополнительных полей
}

/**
 * Преобразует operationNumber в число
 */
export const formatOperationNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Преобразует machineAxes в число (3 или 4)
 * Эта функция гарантирует, что значение будет числом 3 или 4
 */
export const formatMachineAxes = (value: any): number => {
  if (value === null || value === undefined) return 3; // Значение по умолчанию
  
  // Если это строка с суффиксом "-axis", извлекаем число
  if (typeof value === 'string' && value.includes('-axis')) {
    const match = value.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      // Проверяем, что значение либо 3, либо 4
      return (num === 3 || num === 4) ? num : 3;
    }
    return 3;
  }
  
  // Для числовых значений
  if (typeof value === 'number' || typeof value === 'string') {
    const num = Number(value);
    if (!isNaN(num)) {
      // Проверяем, что значение либо 3, либо 4
      return (num === 3 || num === 4) ? num : 3;
    }
  }
  
  return 3; // Значение по умолчанию
};

/**
 * Преобразует estimatedTime в число
 */
export const formatEstimatedTime = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Универсальный форматтер для операций
 * Приводит данные к формату, который гарантированно принимает бэкенд
 */
export const formatOperation = (operation: Operation): Operation => {
  return {
    ...operation,
    // Преобразуем ID в число, если он есть
    ...(operation.id !== undefined && { id: Number(operation.id) }),
    // Всегда преобразуем operationNumber в число
    operationNumber: formatOperationNumber(operation.operationNumber),
    // Преобразуем machineAxes в число (3 или 4)
    machineAxes: formatMachineAxes(operation.machineAxes),
    // Преобразуем estimatedTime в число
    estimatedTime: formatEstimatedTime(operation.estimatedTime)
  };
};

/**
 * Форматирует массив операций
 */
export const formatOperations = (operations: Operation[] | null | undefined): Operation[] => {
  if (!operations || !Array.isArray(operations)) return [];
  return operations.map(formatOperation);
};

/**
 * Форматирует данные заказа, приводя операции к нужному формату
 */
export const formatOrderData = (data: any): any => {
  if (!data) return data;
  
  const result = { ...data };
  
  // Форматируем операции, если они есть
  if (result.operations && Array.isArray(result.operations)) {
    result.operations = formatOperations(result.operations);
  }
  
  // Преобразуем приоритет в число
  if (result.priority !== undefined) {
    result.priority = Number(result.priority);
  }
  
  return result;
};

const operationFormatter = {
  formatOperation,
  formatOperations,
  formatOrderData
};

export default operationFormatter;
