/**
 * @file: planningApi.ts
 * @description: API для работы с планированием производства
 * @dependencies: api
 * @created: 2025-05-28
 */
import api from './api';
import axios from 'axios';

// Создаем отдельный экземпляр axios с обработкой ошибок
const planningApiInstance = axios.create({
  baseURL: api.defaults.baseURL || 'http://localhost:3001/api',
  headers: api.defaults.headers,
});

// Добавляем обработчик ошибок
planningApiInstance.interceptors.response.use(
  response => response,
  error => {
    // Если это 404 ошибка, просто игнорируем
    if (error.response?.status === 404) {
      console.warn('Planning endpoint not found, ignoring...');
      return Promise.resolve({ data: null });
    }
    return Promise.reject(error);
  }
);

export interface PlanningRequest {
  selectedMachines: number[];
  excelData?: any;
}

export interface PlanningResult {
  selectedOrders: any[];
  operationsQueue: {
    orderId: number;
    operationId: number;
    machineId: number;
    priority: number;
    estimatedTime: number;
    startTime?: string;
    endTime?: string;
  }[];
  totalTime: number;
  calculationDate: string;
}

export interface DemoResult {
  success: boolean;
  message: string;
  result: PlanningResult;
}

export const planningApi = {
  // Запуск планирования производства
  planProduction: async (request: PlanningRequest): Promise<PlanningResult> => {
    const response = await planningApiInstance.post('/planning/plan', request);
    return response.data;
  },

  // Демонстрационное планирование
  demoPlanning: async (): Promise<DemoResult> => {
    const response = await planningApiInstance.post('/planning/demo');
    return response.data;
  },

  // Получить последние результаты планирования
  getLatestResults: async () => {
    const response = await planningApiInstance.get('/planning/results/latest');
    return response.data;
  },

  // Получить прогресс операций
  getOperationProgress: async (orderIds?: number[]) => {
    const params = orderIds ? { orderIds: orderIds.join(',') } : {};
    const response = await planningApiInstance.get('/planning/progress', { params });
    return response.data;
  },
};
