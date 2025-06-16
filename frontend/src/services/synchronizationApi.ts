/**
 * @file: synchronizationApi.ts
 * @description: API для работы с синхронизацией между Production и Shifts
 * @dependencies: axios
 * @created: 2025-06-15
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

export interface SynchronizationStatus {
  operationId: number;
  machineId: number;
  operationStatus: string;
  hasShiftRecords: boolean;
  totalProduced: number;
  targetQuantity: number;
  progress: number;
  lastSyncAt: Date;
}

export interface AssignOperationRequest {
  operationId: number;
  machineId: number;
}

export interface AssignOperationResponse {
  success: boolean;
  message: string;
  data: {
    operationId: number;
    machineId: number;
    assignedAt: Date;
    syncedWithShifts: boolean;
    synchronizationStatus: SynchronizationStatus;
  };
  error?: string;
}

export interface SyncStatusResponse {
  success: boolean;
  operationId: number;
  status: SynchronizationStatus;
  timestamp: Date;
  error?: string;
}

export const synchronizationApi = {
  /**
   * 🆕 Назначить операцию с полной синхронизацией
   */
  async assignOperationWithSync(request: AssignOperationRequest): Promise<AssignOperationResponse> {
    try {
      console.log('🔗 API: Назначение операции с синхронизацией:', request);
      
      const response = await axios.post(`${API_BASE_URL}/sync/assign-operation`, request);
      
      console.log('✅ API: Операция успешно назначена и синхронизирована:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API: Ошибка назначения операции с синхронизацией:', error);
      throw error;
    }
  },

  /**
   * 🆕 Назначить операцию через planning (новый метод)
   */
  async assignOperationThroughPlanning(request: AssignOperationRequest): Promise<AssignOperationResponse> {
    try {
      console.log('🔗 API: Назначение операции через planning с синхронизацией:', request);
      
      const response = await axios.post(`${API_BASE_URL}/planning/assign-operation`, request);
      
      console.log('✅ API: Операция успешно назначена через planning:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API: Ошибка назначения операции через planning:', error);
      throw error;
    }
  },

  /**
   * 📊 Получить статус синхронизации операции
   */
  async getSynchronizationStatus(operationId: number): Promise<SyncStatusResponse> {
    try {
      console.log(`📊 API: Получение статуса синхронизации операции ${operationId}`);
      
      const response = await axios.get(`${API_BASE_URL}/sync/status/${operationId}`);
      
      console.log(`✅ API: Статус синхронизации получен:`, response.data);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API: Ошибка получения статуса синхронизации операции ${operationId}:`, error);
      throw error;
    }
  },

  /**
   * 📊 Получить статус синхронизации через planning
   */
  async getSyncStatusThroughPlanning(operationId: number): Promise<SyncStatusResponse> {
    try {
      console.log(`📊 API: Получение статуса синхронизации через planning операции ${operationId}`);
      
      const response = await axios.get(`${API_BASE_URL}/planning/sync-status/${operationId}`);
      
      console.log(`✅ API: Статус синхронизации через planning получен:`, response.data);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API: Ошибка получения статуса синхронизации через planning операции ${operationId}:`, error);
      throw error;
    }
  },

  /**
   * 🔄 Обновить прогресс операции
   */
  async updateOperationProgress(operationId: number): Promise<any> {
    try {
      console.log(`🔄 API: Обновление прогресса операции ${operationId}`);
      
      const response = await axios.post(`${API_BASE_URL}/sync/update-progress/${operationId}`);
      
      console.log(`✅ API: Прогресс операции обновлен:`, response.data);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API: Ошибка обновления прогресса операции ${operationId}:`, error);
      throw error;
    }
  },

  /**
   * 🔄 Принудительная синхронизация всех активных операций
   */
  async syncAllActiveOperations(): Promise<any> {
    try {
      console.log('🔄 API: Принудительная синхронизация всех операций');
      
      const response = await axios.post(`${API_BASE_URL}/sync/sync-all`);
      
      console.log('✅ API: Синхронизация всех операций завершена:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API: Ошибка принудительной синхронизации:', error);
      throw error;
    }
  },

  /**
   * 🏥 Проверка работоспособности системы синхронизации
   */
  async healthCheck(): Promise<any> {
    try {
      console.log('🏥 API: Проверка работоспособности синхронизации');
      
      const response = await axios.get(`${API_BASE_URL}/sync/health`);
      
      console.log('✅ API: Система синхронизации работает:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API: Ошибка проверки работоспособности:', error);
      throw error;
    }
  },

  /**
   * 🔄 LEGACY: Старый метод назначения операции (для совместимости)
   */
  async assignOperationLegacy(request: AssignOperationRequest): Promise<AssignOperationResponse> {
    try {
      console.log('⚠️ API: УСТАРЕВШИЙ метод назначения операции:', request);
      
      const response = await axios.post(`${API_BASE_URL}/planning/assign-operation-legacy`, request);
      
      console.log('⚠️ API: Операция назначена устаревшим методом (БЕЗ синхронизации):', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API: Ошибка устаревшего назначения операции:', error);
      throw error;
    }
  },
};

export default synchronizationApi;
