/**
 * @file: operationsApi.ts
 * @description: API для работы с операциями
 * @dependencies: api, operation.types
 * @created: 2025-01-28
 */
import api from './api';
import {
  Operation,
  CreateOperationDto,
  UpdateOperationDto,
  AssignMachineDto,
  OperationStatus,
} from '../types/operation.types';

export const operationsApi = {
  // Получить все операции
  getAll: async (status?: OperationStatus): Promise<Operation[]> => {
    const response = await api.get('/operations', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  // Получить операцию по ID
  getById: async (id: number): Promise<Operation> => {
    const response = await api.get(`/operations/${id}`);
    return response.data;
  },

  // Создать новую операцию
  create: async (data: CreateOperationDto): Promise<Operation> => {
    const response = await api.post('/operations', data);
    return response.data;
  },

  // Обновить операцию
  update: async (id: number, data: UpdateOperationDto): Promise<Operation> => {
    const response = await api.put(`/operations/${id}`, data);
    return response.data;
  },

  // Назначить станок для операции
  assignMachine: async (id: number, data: AssignMachineDto): Promise<Operation> => {
    const response = await api.put(`/operations/${id}/assign-machine`, data);
    return response.data;
  },

  // Начать операцию
  start: async (id: number): Promise<Operation> => {
    const response = await api.put(`/operations/${id}/start`);
    return response.data;
  },

  // Завершить операцию
  complete: async (id: number): Promise<Operation> => {
    const response = await api.put(`/operations/${id}/complete`);
    return response.data;
  },

  // Удалить операцию
  delete: async (id: number): Promise<void> => {
    await api.delete(`/operations/${id}`);
  },

  // Получить операции по заказу
  getByOrder: async (orderId: number): Promise<Operation[]> => {
    const response = await api.get(`/operations/order/${orderId}`);
    return response.data;
  },

  // Получить операции по станку
  getByMachine: async (machineId: number): Promise<Operation[]> => {
    const response = await api.get(`/operations/machine/${machineId}`);
    return response.data;
  },
};
