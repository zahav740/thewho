/**
 * @file: operationSelectionApi.ts
 * @description: API для выбора операций пользователем
 * @created: 2025-06-07
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Получить доступные операции для выбора
export const getAvailableOperations = async (machineIds?: number[]) => {
  const params = new URLSearchParams();
  if (machineIds && machineIds.length > 0) {
    params.append('machineIds', machineIds.join(','));
  }
  
  const url = `${API_BASE_URL}/api/planning/available-operations${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Ошибка при получении доступных операций');
  }
  
  return response.json();
};

// Планирование с выбранными операциями
export const planWithSelectedOperations = async (request: {
  selectedMachines: number[];
  selectedOperations: { operationId: number; machineId: number; }[];
}) => {
  const response = await fetch(`${API_BASE_URL}/api/planning/plan-selected`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при выполнении планирования');
  }
  
  return response.json();
};

// Получить детали операции
export const getOperationDetails = async (operationId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/planning/operation-details/${operationId}`);
  
  if (!response.ok) {
    throw new Error('Ошибка при получении деталей операции');
  }
  
  return response.json();
};

// Назначить операцию на станок
export const assignOperation = async (operationId: number, machineId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/planning/assign-operation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationId,
      machineId,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при назначении операции');
  }
  
  return response.json();
};

// Экспорт всех методов
export const operationSelectionApi = {
  getAvailableOperations,
  planWithSelectedOperations,
  getOperationDetails,
  assignOperation,
};

export default operationSelectionApi;
