/**
 * @file: useGlobalSync.ts
 * @description: Хук для глобальной синхронизации данных между компонентами
 * @dependencies: react-query
 * @created: 2025-06-12
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { message } from 'antd';
import { QUERY_KEYS, invalidateOperationRelatedQueries, forceRefreshCriticalData } from '../utils/queryKeys';

interface GlobalSyncOptions {
  /**
   * Включить автоматическую синхронизацию при изменениях
   */
  enableAutoSync?: boolean;
  
  /**
   * Интервал принудительного обновления (в мс)
   */
  forceRefreshInterval?: number;
  
  /**
   * Показывать уведомления о синхронизации
   */
  showNotifications?: boolean;
}

export const useGlobalSync = (options: GlobalSyncOptions = {}) => {
  const queryClient = useQueryClient();
  
  const {
    enableAutoSync = true,
    forceRefreshInterval = 10000, // 10 секунд
    showNotifications = false
  } = options;

  /**
   * Синхронизировать все данные после операций с планированием
   */
  const syncAfterPlanning = useCallback(async () => {
    console.log('🔄 Синхронизация после планирования операции...');
    
    if (showNotifications) {
      message.loading('Синхронизация данных...', 1);
    }
    
    // Инвалидируем все связанные ключи
    invalidateOperationRelatedQueries(queryClient);
    
    // Принудительное обновление через секунду
    setTimeout(() => {
      forceRefreshCriticalData(queryClient);
      
      if (showNotifications) {
        message.success('Данные синхронизированы между секциями', 2);
      }
    }, 1000);
    
    // Дополнительное обновление через 3 секунды для гарантии
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
    }, 3000);
    
  }, [queryClient, showNotifications]);

  /**
   * Синхронизировать данные смен
   */
  const syncShifts = useCallback(() => {
    console.log('🔄 Синхронизация данных смен...');
    
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHIFTS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });
    
    // Принудительное обновление
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });
    }, 500);
    
  }, [queryClient]);

  /**
   * Полная синхронизация всех компонентов
   */
  const fullSync = useCallback(() => {
    console.log('🚀 Полная синхронизация всех компонентов...');
    
    if (showNotifications) {
      message.loading('Полная синхронизация...', 2);
    }
    
    // Инвалидируем ВСЕ ключи
    Object.values(QUERY_KEYS).forEach(key => {
      if (Array.isArray(key)) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    });
    
    // Принудительное обновление критически важных данных
    setTimeout(() => {
      forceRefreshCriticalData(queryClient);
      
      if (showNotifications) {
        message.success('Полная синхронизация завершена', 3);
      }
    }, 1000);
    
  }, [queryClient, showNotifications]);

  /**
   * Принудительная перезагрузка конкретного компонента
   */
  const forceRefreshComponent = useCallback((component: 'production' | 'shifts' | 'both') => {
    console.log(`🔄 Принудительная перезагрузка компонента: ${component}`);
    
    switch (component) {
      case 'production':
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES });
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS });
        break;
        
      case 'shifts':
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });
        break;
        
      case 'both':
        forceRefreshCriticalData(queryClient);
        break;
    }
  }, [queryClient]);

  // Автоматическая синхронизация через интервалы
  useEffect(() => {
    if (enableAutoSync && forceRefreshInterval > 0) {
      const interval = setInterval(() => {
        console.log('⏰ Автоматическая синхронизация по расписанию');
        forceRefreshCriticalData(queryClient);
      }, forceRefreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [enableAutoSync, forceRefreshInterval, queryClient]);

  return {
    syncAfterPlanning,
    syncShifts,
    fullSync,
    forceRefreshComponent,
  };
};

export default useGlobalSync;
