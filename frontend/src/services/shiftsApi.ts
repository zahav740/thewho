/**
 * @file: shiftsApi.ts
 * @description: API для работы со сменами
 * @dependencies: api, shift.types
 * @created: 2025-01-28
 */
import api from './api';
import {
  ShiftRecord,
  CreateShiftRecordDto,
  UpdateShiftRecordDto,
  ShiftsFilter,
  ShiftStatistics,
} from '../types/shift.types';

export const shiftsApi = {
  // Получить все записи смен
  getAll: async (filter?: ShiftsFilter): Promise<ShiftRecord[]> => {
    const response = await api.get('/shifts', { params: filter });
    return response.data;
  },

  // Получить запись смены по ID
  getById: async (id: number): Promise<ShiftRecord> => {
    const response = await api.get(`/shifts/${id}`);
    return response.data;
  },

  // Создать запись смены
  create: async (data: CreateShiftRecordDto): Promise<ShiftRecord> => {
    console.log('shiftsApi.create: Отправляемые данные:', data);
    const response = await api.post('/shifts', data);
    return response.data;
  },

  // Обновить запись смены
  update: async (id: number, data: UpdateShiftRecordDto): Promise<ShiftRecord> => {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data;
  },

  // Удалить запись смены
  delete: async (id: number): Promise<void> => {
    await api.delete(`/shifts/${id}`);
  },

  // Получить статистику по сменам
  getStatistics: async (filter?: ShiftsFilter): Promise<ShiftStatistics> => {
    const response = await api.get('/shifts/statistics', { params: filter });
    return response.data;
  },

  // Получить смены по дате
  getByDate: async (date: string): Promise<ShiftRecord[]> => {
    const response = await api.get(`/shifts/by-date/${date}`);
    return response.data;
  },

  // Получить смены по оператору
  getByOperator: async (operator: string): Promise<ShiftRecord[]> => {
    const response = await api.get(`/shifts/by-operator/${operator}`);
    return response.data;
  },
};
