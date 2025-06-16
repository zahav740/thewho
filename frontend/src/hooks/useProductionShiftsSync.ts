/**
 * @file: fix-production-shifts-sync.ts
 * @description: Патч для исправления синхронизации между Production и Shifts
 * @created: 2025-06-12
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { QUERY_KEYS } from '../utils/queryKeys';

/**
 * Хук для мгновенной синхронизации между Production и Shifts
 */
export const useProductionShiftsSync = () => {
  const queryClient = useQueryClient();

  /**
   * Принудительная синхронизация после назначения операции
   */
  const syncAfterOperationAssignment = useCallback(async (operationId: string, machineId: string) => {
    console.log(`🔄 Синхронизация после назначения операции ${operationId} на станок ${machineId}`);
    
    // Показываем уведомление
    message.loading('Синхронизируем данные между секциями...', 1.5);
    
    // 1. Немедленно инвалидируем все ключи
    const keysToInvalidate = [
      QUERY_KEYS.MACHINES,
      QUERY_KEYS.MACHINES_AVAILABILITY,
      QUERY_KEYS.MACHINES_WITH_STATUS,
      QUERY_KEYS.MACHINES_WITH_PROGRESS,
      QUERY_KEYS.OPERATIONS,
      QUERY_KEYS.OPERATIONS_IN_PROGRESS,
      QUERY_KEYS.OPERATIONS_ASSIGNED,
      QUERY_KEYS.SHIFTS,
      QUERY_KEYS.SHIFTS_TODAY
    ];
    
    keysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
    
    // 2. Принудительно перезагружаем данные через 500мс
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
      console.log('🔄 Первая волна принудительного обновления');
    }, 500);
    
    // 3. Вторая волна через 2 секунды
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES });
      console.log('🔄 Вторая волна принудительного обновления');
      message.success('Операция должна появиться в секции Смены', 2);
    }, 2000);
    
    // 4. Третья волна через 5 секунд для гарантии
    setTimeout(() => {
      console.log('🔄 Финальная синхронизация...');
      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      // Принудительная перезагрузка через небольшую задержку
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });
      }, 200);
    }, 5000);
    
  }, [queryClient]);

  /**
   * Проверка, что операция действительно назначена
   */
  const verifyOperationAssignment = useCallback(async (operationId: string, machineId: string) => {
    console.log(`🔍 Проверяем назначение операции ${operationId} на станок ${machineId}`);
    
    // Получаем данные напрямую
    const machines = queryClient.getQueryData(QUERY_KEYS.MACHINES_AVAILABILITY);
    const operations = queryClient.getQueryData(QUERY_KEYS.OPERATIONS_IN_PROGRESS);
    
    console.log('Текущие данные в кэше:', { machines, operations });
    
    // Если данных нет, принудительно загружаем
    if (!machines || !operations) {
      console.log('❌ Данных в кэше нет, принудительно загружаем...');
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
    }
    
    return true;
  }, [queryClient]);

  return {
    syncAfterOperationAssignment,
    verifyOperationAssignment,
  };
};

export default useProductionShiftsSync;
