/**
 * @file: useOperationCompletionCheck.ts
 * @description: Хук для автоматической проверки завершения операций
 * @dependencies: react-query
 * @created: 2025-06-12
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CompletionCheckResult {
  operationId: number;
  isCompleted: boolean;
  completedQuantity: number;
  plannedQuantity: number;
  progress: number;
  orderInfo: {
    drawingNumber: string;
    quantity: number;
  };
  operationInfo: {
    operationNumber: number;
    operationType: string;
  };
}

// API функции
const completionCheckApi = {
  checkAllActiveOperations: async (): Promise<CompletionCheckResult[]> => {
    const response = await fetch('/api/operations/completion/check-all-active');
    if (!response.ok) throw new Error('Failed to check operations');
    return await response.json();
  },

  checkOperation: async (operationId: number): Promise<CompletionCheckResult> => {
    const response = await fetch(`/api/operations/completion/check/${operationId}`);
    if (!response.ok) throw new Error('Failed to check operation');
    return await response.json();
  }
};

interface UseOperationCompletionCheckOptions {
  enabled?: boolean;
  checkInterval?: number; // в миллисекундах
  onOperationCompleted?: (completedOperations: CompletionCheckResult[]) => void;
}

export const useOperationCompletionCheck = (options: UseOperationCompletionCheckOptions = {}) => {
  const {
    enabled = true,
    checkInterval = 30000, // Увеличиваем до 30 секунд для уменьшения нагрузки
    onOperationCompleted
  } = options;

  const [notifiedOperations, setNotifiedOperations] = useState<Set<number>>(new Set());
  const [pendingNotifications, setPendingNotifications] = useState<CompletionCheckResult[]>([]);

  // Запрос для проверки всех активных операций
  const { data: completedOperations = [], isLoading, error } = useQuery({
    queryKey: ['operation-completion-check'],
    queryFn: completionCheckApi.checkAllActiveOperations,
    enabled,
    refetchInterval: checkInterval,
    refetchIntervalInBackground: true, // Проверяем даже в фоне
    staleTime: 1000, // Данные считаются свежими 1 секунду
    retry: 3, // Повторяем при ошибке
  });

  // Обработка новых завершенных операций
  useEffect(() => {
    if (!completedOperations.length) return;

    // Фильтруем только ДЕЙСТВИТЕЛЬНО завершенные операции (100% или больше)
    const reallyCompletedOperations = completedOperations.filter(
      operation => operation.isCompleted && operation.progress >= 100
    );

    if (reallyCompletedOperations.length === 0) return;

    // Фильтруем только новые завершенные операции (о которых еще не уведомляли)
    const newCompletedOperations = reallyCompletedOperations.filter(
      operation => !notifiedOperations.has(operation.operationId)
    );

    if (newCompletedOperations.length > 0) {
      console.log('🔔 Обнаружены новые завершенные операции:', newCompletedOperations);
      
      // Добавляем в список ожидающих уведомлений
      setPendingNotifications(prev => [...prev, ...newCompletedOperations]);
      
      // Помечаем как уведомленные
      setNotifiedOperations(prev => {
        const newSet = new Set(prev);
        newCompletedOperations.forEach(op => newSet.add(op.operationId));
        return newSet;
      });

      // Вызываем callback если он есть
      if (onOperationCompleted) {
        onOperationCompleted(newCompletedOperations);
      }
    }
  }, [completedOperations, notifiedOperations, onOperationCompleted]);

  // Функция для очистки уведомлений
  const clearNotifications = () => {
    setPendingNotifications([]);
  };

  // Функция для очистки конкретного уведомления
  const clearNotification = (operationId: number) => {
    setPendingNotifications(prev => 
      prev.filter(notification => notification.operationId !== operationId)
    );
  };

  // Функция для ручной проверки конкретной операции
  const checkSpecificOperation = async (operationId: number): Promise<CompletionCheckResult | null> => {
    try {
      const result = await completionCheckApi.checkOperation(operationId);
      
      // Проверяем, что операция действительно завершена
      const isReallyCompleted = result.isCompleted && 
                              result.progress >= 100 && 
                              result.completedQuantity >= result.plannedQuantity;
      
      if (isReallyCompleted && !notifiedOperations.has(operationId)) {
        setPendingNotifications(prev => [...prev, result]);
        setNotifiedOperations(prev => new Set(prev).add(operationId));
        
        if (onOperationCompleted) {
          onOperationCompleted([result]);
        }
        
        return result;
      } else if (!isReallyCompleted) {
        console.log('🚫 Операция ещё не завершена:', {
          operationId,
          isCompleted: result.isCompleted,
          progress: result.progress,
          completed: result.completedQuantity,
          planned: result.plannedQuantity
        });
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при проверке операции:', error);
      return null;
    }
  };

  // Сброс notified операций при перезагрузке страницы
  useEffect(() => {
    // Очищаем список уведомленных операций при монтировании компонента
    // Это позволит снова уведомить о завершенных операциях после перезагрузки
    setNotifiedOperations(new Set());
  }, []);

  return {
    // Данные
    completedOperations,
    pendingNotifications,
    
    // Состояние
    isLoading,
    error,
    hasNotifications: pendingNotifications.length > 0,
    notificationCount: pendingNotifications.length,
    
    // Методы
    clearNotifications,
    clearNotification,
    checkSpecificOperation,
    
    // Статистика
    stats: {
      totalCompleted: completedOperations.length,
      pendingNotifications: pendingNotifications.length,
      notifiedOperations: notifiedOperations.size
    }
  };
};

export default useOperationCompletionCheck;
