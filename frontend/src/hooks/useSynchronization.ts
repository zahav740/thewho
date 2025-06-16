/**
 * @file: useSynchronization.ts
 * @description: Хук для синхронизации данных между модулями Production и Shifts
 * @dependencies: React, useQuery, synchronizationApi
 * @created: 2025-06-15
 */
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { synchronizationApi } from '../services/synchronizationApi';

interface UseSynchronizationOptions {
  autoSync?: boolean;
  syncInterval?: number;
  onSyncSuccess?: (data: any) => void;
  onSyncError?: (error: any) => void;
}

export const useSynchronization = (options: UseSynchronizationOptions = {}) => {
  const {
    autoSync = true,
    syncInterval = 10000, // 10 секунд по умолчанию
    onSyncSuccess,
    onSyncError,
  } = options;

  const queryClient = useQueryClient();

  // Принудительная синхронизация всех данных
  const forceSyncAll = useCallback(async () => {
    try {
      console.log('🔄 Запуск принудительной синхронизации...');
      
      const result = await synchronizationApi.syncAllActiveOperations();
      
      // Обновляем все связанные запросы
      await queryClient.invalidateQueries({ queryKey: ['machines'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['operations'] });
      await queryClient.invalidateQueries({ queryKey: ['operation-progress'] });
      
      console.log('✅ Принудительная синхронизация завершена:', result);
      
      if (onSyncSuccess) {
        onSyncSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Ошибка принудительной синхронизации:', error);
      
      if (onSyncError) {
        onSyncError(error);
      }
      
      throw error;
    }
  }, [queryClient, onSyncSuccess, onSyncError]);

  // Синхронизация конкретной операции
  const syncOperation = useCallback(async (operationId: number) => {
    try {
      console.log(`🔄 Синхронизация операции ${operationId}...`);
      
      const result = await synchronizationApi.updateOperationProgress(operationId);
      
      // Обновляем связанные запросы
      await queryClient.invalidateQueries({ queryKey: ['machines'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      await queryClient.invalidateQueries({ queryKey: ['operation-progress', operationId] });
      
      console.log(`✅ Операция ${operationId} синхронизирована:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Ошибка синхронизации операции ${operationId}:`, error);
      throw error;
    }
  }, [queryClient]);

  // Получение статуса синхронизации
  const getSyncStatus = useCallback(async (operationId: number) => {
    try {
      console.log(`📊 Получение статуса синхронизации операции ${operationId}...`);
      
      const result = await synchronizationApi.getSynchronizationStatus(operationId);
      
      console.log(`✅ Статус синхронизации получен:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Ошибка получения статуса синхронизации операции ${operationId}:`, error);
      throw error;
    }
  }, []);

  // Проверка работоспособности системы синхронизации
  const checkSyncHealth = useCallback(async () => {
    try {
      console.log('🏥 Проверка работоспособности синхронизации...');
      
      const result = await synchronizationApi.healthCheck();
      
      console.log('✅ Система синхронизации работает корректно:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Система синхронизации не работает:', error);
      throw error;
    }
  }, []);

  // Автоматическая синхронизация через интервалы
  useEffect(() => {
    if (!autoSync) return;

    console.log(`🔄 Настройка автоматической синхронизации каждые ${syncInterval / 1000} секунд`);

    const intervalId = setInterval(async () => {
      try {
        await forceSyncAll();
      } catch (error) {
        console.error('❌ Ошибка автоматической синхронизации:', error);
      }
    }, syncInterval);

    return () => {
      console.log('🛑 Отключение автоматической синхронизации');
      clearInterval(intervalId);
    };
  }, [autoSync, syncInterval, forceSyncAll]);

  // Обработчики событий для real-time синхронизации
  useEffect(() => {
    const handleOperationAssigned = (event: CustomEvent) => {
      console.log('📡 Получено событие назначения операции:', event.detail);
      
      // Обновляем запросы для обеих страниц
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    };

    const handleOperationCompleted = (event: CustomEvent) => {
      console.log('📡 Получено событие завершения операции:', event.detail);
      
      // Обновляем запросы для обеих страниц
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['operation-progress'] });
    };

    const handleOperationProgress = (event: CustomEvent) => {
      console.log('📡 Получено событие прогресса операции:', event.detail);
      
      // Обновляем запросы прогресса
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['operation-progress'] });
    };

    const handleOperationCleared = () => {
      console.log('📡 Получено событие очистки операции');
      
      // Обновляем все запросы
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    };

    // Регистрируем обработчики событий
    window.addEventListener('operationAssigned', handleOperationAssigned as EventListener);
    window.addEventListener('operationCompleted', handleOperationCompleted as EventListener);
    window.addEventListener('operationProgress', handleOperationProgress as EventListener);
    window.addEventListener('operationCleared', handleOperationCleared);

    return () => {
      // Удаляем обработчики при размонтировании
      window.removeEventListener('operationAssigned', handleOperationAssigned as EventListener);
      window.removeEventListener('operationCompleted', handleOperationCompleted as EventListener);
      window.removeEventListener('operationProgress', handleOperationProgress as EventListener);
      window.removeEventListener('operationCleared', handleOperationCleared);
    };
  }, [queryClient]);

  return {
    forceSyncAll,
    syncOperation,
    getSyncStatus,
    checkSyncHealth,
  };
};

export default useSynchronization;
