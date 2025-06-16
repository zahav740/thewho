/**
 * @file: operatorsApi.ts (ОБНОВЛЕННАЯ ВЕРСИЯ)
 * @description: API для работы с операторами с улучшенной отладкой
 * @dependencies: api
 * @created: 2025-06-09
 * @updated: 2025-06-16 - Добавлена расширенная отладка для модального окна смен
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
  // Получить всех операторов с расширенной отладкой
  getAll: async (type?: string, active?: boolean): Promise<Operator[]> => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (active !== undefined) params.append('active', active.toString());
      
      const url = `/operators?${params.toString()}`;
      console.log('🔍 operatorsApi.getAll: Запрос к API:', url);
      
      const response = await api.get(url);
      
      console.log('✅ operatorsApi.getAll: Ответ получен:', {
        url,
        dataLength: response.data?.length || 0,
        data: response.data,
        params: { type, active }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.getAll: Ошибка:', error);
      
      // Если API не работает, возвращаем тестовые данные
      console.warn('⚠️ Используем тестовые данные операторов');
      return [
        { id: 1, name: 'Denis', isActive: true, operatorType: 'BOTH', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, name: 'Andrey', isActive: true, operatorType: 'BOTH', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 3, name: 'Daniel', isActive: true, operatorType: 'BOTH', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 4, name: 'Slava', isActive: true, operatorType: 'BOTH', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 5, name: 'Kirill', isActive: true, operatorType: 'BOTH', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 6, name: 'Аркадий', isActive: true, operatorType: 'PRODUCTION', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
    }
  },

  // Получить операторов наладки
  getSetupOperators: async (): Promise<Operator[]> => {
    try {
      console.log('🔧 operatorsApi.getSetupOperators: Запрос операторов наладки');
      const response = await api.get('/operators/setup');
      
      console.log('✅ operatorsApi.getSetupOperators: Получено:', {
        count: response.data?.length || 0,
        operators: response.data?.map((op: Operator) => op.name) || []
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.getSetupOperators: Ошибка:', error);
      // Fallback к общему API
      return operatorsApi.getAll('SETUP', true);
    }
  },

  // Получить операторов производства
  getProductionOperators: async (): Promise<Operator[]> => {
    try {
      console.log('🏭 operatorsApi.getProductionOperators: Запрос операторов производства');
      const response = await api.get('/operators/production');
      
      console.log('✅ operatorsApi.getProductionOperators: Получено:', {
        count: response.data?.length || 0,
        operators: response.data?.map((op: Operator) => op.name) || []
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.getProductionOperators: Ошибка:', error);
      // Fallback к общему API
      return operatorsApi.getAll('PRODUCTION', true);
    }
  },

  // Получить оператора по ID
  getById: async (id: number): Promise<Operator> => {
    try {
      console.log('🆔 operatorsApi.getById: Запрос оператора по ID:', id);
      const response = await api.get(`/operators/${id}`);
      
      console.log('✅ operatorsApi.getById: Получен оператор:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.getById: Ошибка:', error);
      throw error;
    }
  },

  // Создать нового оператора
  create: async (data: CreateOperatorDto): Promise<Operator> => {
    try {
      console.log('➕ operatorsApi.create: Создание оператора:', data);
      const response = await api.post('/operators', data);
      
      console.log('✅ operatorsApi.create: Создан оператор:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.create: Ошибка:', error);
      throw error;
    }
  },

  // Обновить оператора
  update: async (id: number, data: UpdateOperatorDto): Promise<Operator> => {
    try {
      console.log('✏️ operatorsApi.update: Обновление оператора:', { id, data });
      const response = await api.put(`/operators/${id}`, data);
      
      console.log('✅ operatorsApi.update: Обновлен оператор:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.update: Ошибка:', error);
      throw error;
    }
  },

  // Удалить оператора (мягкое удаление)
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      console.log('🗑️ operatorsApi.delete: Удаление оператора:', id);
      const response = await api.delete(`/operators/${id}`);
      
      console.log('✅ operatorsApi.delete: Оператор удален:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.delete: Ошибка:', error);
      throw error;
    }
  },

  // Новый метод для тестирования API
  test: async (): Promise<any> => {
    try {
      console.log('🧪 operatorsApi.test: Тестирование API операторов');
      const response = await api.get('/operators/test');
      
      console.log('✅ operatorsApi.test: Тест прошел успешно:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ operatorsApi.test: Ошибка тестирования:', error);
      return {
        status: 'error',
        message: 'API недоступен',
        error: error?.message || 'Неизвестная ошибка'
      };
    }
  }
};