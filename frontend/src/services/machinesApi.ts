/**
 * @file: machinesApi.ts
 * @description: API для работы со станками (обновленный)
 * @dependencies: api, machine.types
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import api from './api';
import {
  Machine,
  MachineAvailability,
  CreateMachineDto,
  UpdateMachineDto,
  RecommendedOrder,
  StartOperationRequest,
  StartOperationResponse,
} from '../types/machine.types';

export const machinesApi = {
  // Новые API методы для управления доступностью
  // Получить все станки с доступностью
  getAll: async (): Promise<MachineAvailability[]> => {
    try {
      const response = await api.get('/machines');
      return response.data;
    } catch (error) {
      console.error('machinesApi.getAll error:', error);
      throw error;
    }
  },

  // Получить только доступные станки
  getAvailable: async (): Promise<MachineAvailability[]> => {
    try {
      const response = await api.get('/machines/available');
      return response.data;
    } catch (error) {
      console.error('machinesApi.getAvailable error:', error);
      throw error;
    }
  },

  // Получить станок по имени
  getByName: async (machineName: string): Promise<MachineAvailability> => {
    try {
      const response = await api.get(`/machines/${encodeURIComponent(machineName)}`);
      return response.data;
    } catch (error) {
      console.error('machinesApi.getByName error:', error);
      throw error;
    }
  },

  // Обновить доступность станка
  updateAvailability: async (machineName: string, isAvailable: boolean): Promise<MachineAvailability> => {
    try {
      const response = await api.put(`/machines/${encodeURIComponent(machineName)}/availability`, {
        isAvailable
      });
      return response.data;
    } catch (error) {
      console.error('machinesApi.updateAvailability error:', error);
      throw error;
    }
  },

  // Получить рекомендуемые операции для станка
  getSuggestedOperations: async (machineName: string): Promise<RecommendedOrder[]> => {
    try {
      const response = await api.get(`/machines/${encodeURIComponent(machineName)}/suggested-operations`);
      return response.data;
    } catch (error) {
      console.error('machinesApi.getSuggestedOperations error:', error);
      throw error;
    }
  },

  // Назначить операцию на станок
  assignOperation: async (machineName: string, operationId: string): Promise<MachineAvailability> => {
    try {
      const response = await api.post(`/machines/${encodeURIComponent(machineName)}/assign-operation`, {
        operationId
      });
      return response.data;
    } catch (error) {
      console.error('machinesApi.assignOperation error:', error);
      throw error;
    }
  },

  // Legacy методы для обратной совместимости
  legacy: {
    // Получить все станки (legacy)
    getAll: async (): Promise<Machine[]> => {
      try {
        const response = await api.get('/machines/legacy');
        return response.data;
      } catch (error) {
        console.error('machinesApi.legacy.getAll error:', error);
        throw error;
      }
    },

    // Получить станок по ID (legacy)
    getById: async (id: string): Promise<Machine> => {
      try {
        const response = await api.get(`/machines/legacy/${id}`);
        return response.data;
      } catch (error) {
        console.error('machinesApi.legacy.getById error:', error);
        throw error;
      }
    },

    // Создать новый станок (legacy)
    create: async (data: CreateMachineDto): Promise<Machine> => {
      try {
        const response = await api.post('/machines/legacy', data);
        return response.data;
      } catch (error) {
        console.error('machinesApi.legacy.create error:', error);
        throw error;
      }
    },

    // Обновить станок (legacy)
    update: async (id: string, data: UpdateMachineDto): Promise<Machine> => {
      try {
        const response = await api.put(`/machines/legacy/${id}`, data);
        return response.data;
      } catch (error) {
        console.error('machinesApi.legacy.update error:', error);
        throw error;
      }
    },

    // Переключить занятость станка (legacy)
    toggleOccupancy: async (id: string): Promise<Machine> => {
      try {
        const response = await api.put(`/machines/legacy/${id}/toggle`);
        return response.data;
      } catch (error) {
        console.error('machinesApi.legacy.toggleOccupancy error:', error);
        throw error;
      }
    },

    // Удалить станок (legacy)
    delete: async (id: string): Promise<void> => {
      try {
        await api.delete(`/machines/legacy/${id}`);
      } catch (error) {
        console.error('machinesApi.legacy.delete error:', error);
        throw error;
      }
    },
  },
};

// Новые API для работы с операциями
export const operationsApi = {
  // Запустить операцию в работу
  startOperation: async (operationId: string, request: StartOperationRequest): Promise<StartOperationResponse> => {
    try {
      const response = await api.post(`/operations/${operationId}/start`, request);
      return response.data;
    } catch (error) {
      console.error('operationsApi.startOperation error:', error);
      throw error;
    }
  },

  // Завершить операцию
  completeOperation: async (operationId: string): Promise<any> => {
    try {
      const response = await api.put(`/operations/${operationId}/complete`);
      return response.data;
    } catch (error) {
      console.error('operationsApi.completeOperation error:', error);
      throw error;
    }
  },

  // Получить активные операции
  getActiveOperations: async (): Promise<any[]> => {
    try {
      const response = await api.get('/operations/active');
      return response.data;
    } catch (error) {
      console.error('operationsApi.getActiveOperations error:', error);
      throw error;
    }
  },

  // Получить операции по станку
  getOperationsByMachine: async (machineName: string): Promise<any[]> => {
    try {
      const response = await api.get(`/operations/machine/${encodeURIComponent(machineName)}`);
      return response.data;
    } catch (error) {
      console.error('operationsApi.getOperationsByMachine error:', error);
      throw error;
    }
  },
};
