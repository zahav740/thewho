/**
 * @file: operatorsApi.ts
 * @description: API для работы с операторами
 * @dependencies: api
 * @created: 2025-06-09
 */
import api from './api';

export interface Operator {
  id: number;
  name: string;
  isActive: boolean;
  operatorType: 'SETUP' | 'PRODUCTION' | 'BOTH';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperatorDto {
  name: string;
  operatorType?: 'SETUP' | 'PRODUCTION' | 'BOTH';
}

export interface UpdateOperatorDto {
  name?: string;
  isActive?: boolean;
  operatorType?: 'SETUP' | 'PRODUCTION' | 'BOTH';
}

export const operatorsApi = {
  // Получить всех операторов
  getAll: async (type?: string, active?: boolean): Promise<Operator[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (active !== undefined) params.append('active', active.toString());
    
    const response = await api.get(`/operators?${params.toString()}`);
    return response.data;
  },

  // Получить операторов наладки
  getSetupOperators: async (): Promise<Operator[]> => {
    const response = await api.get('/operators/setup');
    return response.data;
  },

  // Получить операторов производства
  getProductionOperators: async (): Promise<Operator[]> => {
    const response = await api.get('/operators/production');
    return response.data;
  },

  // Получить оператора по ID
  getById: async (id: number): Promise<Operator> => {
    const response = await api.get(`/operators/${id}`);
    return response.data;
  },

  // Создать нового оператора
  create: async (data: CreateOperatorDto): Promise<Operator> => {
    const response = await api.post('/operators', data);
    return response.data;
  },

  // Обновить оператора
  update: async (id: number, data: UpdateOperatorDto): Promise<Operator> => {
    const response = await api.put(`/operators/${id}`, data);
    return response.data;
  },

  // Удалить оператора (мягкое удаление)
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/operators/${id}`);
    return response.data;
  },
};
