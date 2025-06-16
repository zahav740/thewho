/**
 * @file: queryKeys.ts
 * @description: Централизованное управление ключами React Query
 * @created: 2025-06-12
 */

export const QUERY_KEYS = {
  // Станки
  MACHINES: ['machines'],
  MACHINES_AVAILABILITY: ['machines-availability'],
  MACHINES_WITH_STATUS: ['machines-with-status'],
  MACHINES_WITH_PROGRESS: ['machines-with-progress'],

  // Операции
  OPERATIONS: ['operations'],
  OPERATIONS_IN_PROGRESS: ['operations', 'in-progress'],
  OPERATIONS_ASSIGNED: ['operations', 'assigned'],
  OPERATION_PROGRESS: (operationId: string) => ['operation-progress', operationId],
  OPERATIONS_COMPLETED_CHECK: ['completed-operations-check'],

  // Смены
  SHIFTS: ['shifts'],
  SHIFTS_TODAY: ['shifts', 'today'],
  SHIFTS_BY_DATE: (date: string) => ['shifts', date],

  // Планирование
  PLANNING: ['planning'],
  SYSTEM_ANALYSIS: ['system-analysis'],

  // Производственные метрики
  PRODUCTION_METRICS: ['production-metrics'],
  ACTIVE_OPERATIONS: ['active-operations'],
  DASHBOARD: ['dashboard'],

  // Заказы
  ORDERS: ['orders'],
  ORDERS_ACTIVE: ['orders', 'active'],
} as const;

/**
 * Функция для инвалидации всех связанных ключей при изменении операций
 */
export const invalidateOperationRelatedQueries = (queryClient: any) => {
  // Инвалидируем все ключи, связанные со станками
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MACHINES });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MACHINES_WITH_STATUS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MACHINES_WITH_PROGRESS });

  // Инвалидируем все ключи, связанные с операциями
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OPERATIONS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OPERATIONS_ASSIGNED });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.OPERATIONS_COMPLETED_CHECK });

  // Инвалидируем смены
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHIFTS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });

  // Инвалидируем метрики
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTION_METRICS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACTIVE_OPERATIONS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });

  console.log('🔄 Инвалидированы все ключи, связанные с операциями');
};

/**
 * Функция для принудительного обновления критически важных данных
 */
export const forceRefreshCriticalData = (queryClient: any) => {
  // Принудительно перезагружаем критически важные данные
  queryClient.refetchQueries({ queryKey: QUERY_KEYS.MACHINES_AVAILABILITY });
  queryClient.refetchQueries({ queryKey: QUERY_KEYS.OPERATIONS_IN_PROGRESS });
  queryClient.refetchQueries({ queryKey: QUERY_KEYS.SHIFTS_TODAY });

  console.log('🚀 Принудительно обновлены критически важные данные');
};

export default QUERY_KEYS;
