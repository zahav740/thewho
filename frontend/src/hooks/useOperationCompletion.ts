/**
 * @file: useOperationCompletion.ts
 * @description: Хук для управления логикой завершения операций
 * @dependencies: react-query, operations API
 * @created: 2025-06-12
 */
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { message, notification } from 'antd';
// Временно убрали импорт переводов для устранения ошибки
// import { useTranslation } from '../i18n';

interface CompletedOperation {
  id: string;
  operationNumber: number;
  operationType: string;
  orderDrawingNumber: string;
  machineName: string;
  machineType: string;
  targetQuantity: number;
  completedQuantity: number;
  progressPercentage: number;
  estimatedTime: number;
  actualTime?: number;
  dayShiftQuantity: number;
  nightShiftQuantity: number;
  dayShiftOperator?: string;
  nightShiftOperator?: string;
  startedAt: string;
  completedAt: string;
}

interface OperationCompletionOptions {
  onOperationClosed?: (operation: CompletedOperation) => void;
  onOperationContinued?: (operation: CompletedOperation) => void;
  onNewOperationPlanned?: (operation: CompletedOperation) => void;
  checkInterval?: number;
  targetQuantity?: number;
}

// API функции для работы с завершением операций
const operationCompletionApi = {
  // Проверка завершенных операций
  checkCompletedOperations: async (): Promise<CompletedOperation[]> => {
    const response = await fetch('/api/operations/completed-check');
    const data = await response.json();
    return data.success ? data.data : [];
  },

  // Закрытие операции
  closeOperation: async (operationId: string, saveResults: boolean = true) => {
    const response = await fetch(`/api/operations/${operationId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveResults })
    });
    return await response.json();
  },

  // Продолжение операции
  continueOperation: async (operationId: string) => {
    const response = await fetch(`/api/operations/${operationId}/continue`, {
      method: 'POST',
    });
    return await response.json();
  },

  // Архивирование результатов и освобождение станка
  archiveAndFree: async (operationId: string) => {
    const response = await fetch(`/api/operations/${operationId}/archive-and-free`, {
      method: 'POST',
    });
    return await response.json();
  },

  // Получение детальной информации о завершенной операции
  getCompletionDetails: async (operationId: string): Promise<CompletedOperation> => {
    const response = await fetch(`/api/operations/${operationId}/completion-details`);
    const data = await response.json();
    return data.success ? data.data : null;
  },
};

export const useOperationCompletion = (options: OperationCompletionOptions = {}) => {
  // Временно убрали переводы
  // const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const {
    onOperationClosed,
    onOperationContinued,
    onNewOperationPlanned,
    checkInterval = 10000,
    targetQuantity = 30,
  } = options;

  // Состояние модального окна
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [currentCompletedOperation, setCurrentCompletedOperation] = useState<CompletedOperation | null>(null);
  const [pendingCompletions, setPendingCompletions] = useState<CompletedOperation[]>([]);

  // Периодическая проверка завершенных операций
  const { data: completedOperations } = useQuery({
    queryKey: ['completed-operations-check'],
    queryFn: operationCompletionApi.checkCompletedOperations,
    refetchInterval: checkInterval,
    enabled: checkInterval > 0,
  });

  // Мутации для действий с завершенными операциями
  const closeOperationMutation = useMutation({
    mutationFn: ({ operationId, saveResults }: { operationId: string; saveResults: boolean }) =>
      operationCompletionApi.closeOperation(operationId, saveResults),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machines-with-progress'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      
      message.success('Операция успешно закрыта и результат сохранен');
      
      if (currentCompletedOperation && onOperationClosed) {
        onOperationClosed(currentCompletedOperation);
      }
      
      setCompletionModalVisible(false);
      setCurrentCompletedOperation(null);
    },
    onError: (error) => {
      console.error('Ошибка при закрытии операции:', error);
      message.error('Ошибка при закрытии операции');
    },
  });

  const continueOperationMutation = useMutation({
    mutationFn: operationCompletionApi.continueOperation,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['completed-operations-check'] });
      
      message.success('Операция продолжена, результат будет накапливаться');
      
      if (currentCompletedOperation && onOperationContinued) {
        onOperationContinued(currentCompletedOperation);
      }
      
      setCompletionModalVisible(false);
      setCurrentCompletedOperation(null);
    },
    onError: (error) => {
      console.error('Ошибка при продолжении операции:', error);
      message.error('Ошибка при продолжении операции');
    },
  });

  const archiveAndFreeMutation = useMutation({
    mutationFn: operationCompletionApi.archiveAndFree,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machines-with-progress'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      
      message.success('Результат сохранен, станок освобожден');
      
      if (currentCompletedOperation && onNewOperationPlanned) {
        onNewOperationPlanned(currentCompletedOperation);
      }
      
      setCompletionModalVisible(false);
      setCurrentCompletedOperation(null);
    },
    onError: (error) => {
      console.error('Ошибка при архивировании и освобождении:', error);
      message.error('Ошибка при архивировании результатов');
    },
  });

  // Обработка новых завершенных операций
  useEffect(() => {
    if (completedOperations && completedOperations.length > 0) {
      // Фильтруем только действительно завершённые операции
      const reallyCompletedOperations = completedOperations.filter(
        op => op.progressPercentage >= 100 && op.completedQuantity >= op.targetQuantity
      );
      
      const newCompletions = reallyCompletedOperations.filter(
        op => !pendingCompletions.some(p => p.id === op.id)
      );
      
      if (newCompletions.length > 0) {
        // Обновляем список ожидающих
        setPendingCompletions(prev => [...prev, ...newCompletions]);
        
        // Показываем системное уведомление
        newCompletions.forEach(op => {
          notification.success({
            message: '🎉 Операция завершена!',
            description: `Операция ${op.operationNumber} на станке ${op.machineName} достигла планового количества`,
            placement: 'topRight',
            duration: 6,
            onClick: () => {
              handleShowCompletion(op);
            },
          });
        });
        
        // Автоматически показываем модальное окно для первой операции
        if (!completionModalVisible && newCompletions.length > 0) {
          handleShowCompletion(newCompletions[0]);
        }
      }
    }
  }, [completedOperations, pendingCompletions, completionModalVisible]);

  // Обработчики действий
  const handleShowCompletion = useCallback(async (operation: CompletedOperation) => {
    try {
      // Получаем детальную информацию об операции
      const detailedOperation = await operationCompletionApi.getCompletionDetails(operation.id);
      setCurrentCompletedOperation(detailedOperation || operation);
      setCompletionModalVisible(true);
    } catch (error) {
      console.error('Ошибка при получении деталей операции:', error);
      setCurrentCompletedOperation(operation);
      setCompletionModalVisible(true);
    }
  }, []);

  const handleCloseOperation = useCallback(() => {
    if (currentCompletedOperation) {
      closeOperationMutation.mutate({
        operationId: currentCompletedOperation.id,
        saveResults: true,
      });
    }
  }, [currentCompletedOperation, closeOperationMutation]);

  const handleContinueOperation = useCallback(() => {
    if (currentCompletedOperation) {
      continueOperationMutation.mutate(currentCompletedOperation.id);
    }
  }, [currentCompletedOperation, continueOperationMutation]);

  const handlePlanNewOperation = useCallback(() => {
    if (currentCompletedOperation) {
      archiveAndFreeMutation.mutate(currentCompletedOperation.id);
    }
  }, [currentCompletedOperation, archiveAndFreeMutation]);

  const handleCloseModal = useCallback(() => {
    setCompletionModalVisible(false);
    setCurrentCompletedOperation(null);
  }, []);

  // Функция для ручной проверки конкретной операции
  const checkSpecificOperation = useCallback(async (operationId: string) => {
    try {
      const details = await operationCompletionApi.getCompletionDetails(operationId);
      // Проверяем, что операция действительно завершена
      if (details && details.progressPercentage >= 100 && details.completedQuantity >= details.targetQuantity) {
        handleShowCompletion(details);
      } else {
        console.log('🚫 Операция ещё не завершена:', {
          operationId,
          progress: details?.progressPercentage,
          completed: details?.completedQuantity,
          target: details?.targetQuantity
        });
      }
    } catch (error) {
      console.error('Ошибка при проверке операции:', error);
    }
  }, [handleShowCompletion]);

  // Функция для очистки уведомлений
  const clearPendingCompletions = useCallback(() => {
    setPendingCompletions([]);
  }, []);

  return {
    // Состояние
    completionModalVisible,
    currentCompletedOperation,
    pendingCompletions,
    hasCompletedOperations: pendingCompletions.length > 0,
    
    // Загрузка
    isClosing: closeOperationMutation.isPending,
    isContinuing: continueOperationMutation.isPending,
    isArchiving: archiveAndFreeMutation.isPending,
    
    // Обработчики
    handleShowCompletion,
    handleCloseOperation,
    handleContinueOperation,
    handlePlanNewOperation,
    handleCloseModal,
    checkSpecificOperation,
    clearPendingCompletions,
    
    // Данные
    completedOperations: completedOperations || [],
  };
};

export default useOperationCompletion;
