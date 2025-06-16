/**
 * @file: ActiveMachinesMonitor.tsx (🆕 СИНХРОНИЗИРОВАННАЯ ВЕРСИЯ)
 * @description: Компонент мониторинга станков с полной синхронизацией Production ↔ Shifts
 * @dependencies: antd, react-query, synchronizationApi, real-time events
 * @created: 2025-06-12
 * @updated: 2025-06-15 - Добавлена полная синхронизация с Production
 */
import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Progress,
  Tag,
  Spin,
  Empty,
  Tooltip,
  Typography,
  Space,
  Badge,
  Divider,
  message,
} from 'antd';
import {
  PauseCircleOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { operationsApi } from '../../../services/operationsApi';
import { shiftsApi } from '../../../services/shiftsApi';
import { synchronizationApi } from '../../../services/synchronizationApi'; // 🆕 Новый API
import { OperationStatus } from '../../../types/operation.types';

import { ShiftForm } from './ShiftForm';
import { OperationDetailModal } from './OperationDetailModal';
import DataDiagnostics from './DataDiagnostics';
import SimpleProductionView from './SimpleProductionView';
// СТАРОЕ: import { OperationCompletionModal } from './OperationCompletionModal';
// НОВОЕ: Система автозавершения операций
import OperationCompletionNotification from '../../../components/OperationCompletionNotification';
import { OperationCompletionModal } from '../../../components/OperationCompletion';
import { useOperationCompletionCheck, useOperationCompletion } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Интерфейсы
interface ActiveMachinesMonitorProps {
  selectedOperation?: any; // Переданная операция из ProductionPage
}

interface OperatorEfficiency {
  operatorName: string;
  productivity: {
    partsPerHour: number;
    planVsFact: number;
  };
  quality: {
    averageTimePerPart: number;
    deviation: number;
  };
  stability: {
    consistency: number;
  };
  utilization: {
    workingTime: number;
    idleTime: number;
    efficiency: number;
  };
  rating: number;
}

interface ExtendedOperationDetails {
  id: number;
  operationNumber: number;
  operationType: string;
  estimatedTime: number;
  orderId: number;
  orderDrawingNumber: string;
  progress?: number;
  totalProduced?: number;
  targetQuantity?: number;
}

interface ActiveMachine {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  currentOperationDetails?: ExtendedOperationDetails;
  lastFreedAt?: Date | string;
  createdAt: string;
  updatedAt: string;
  status: 'working' | 'setup' | 'idle' | 'maintenance';
  currentOperationProduction?: {
    dayShift: { quantity: number; operator: string; efficiency: number };
    nightShift: { quantity: number; operator: string; efficiency: number };
    totalTime: number;
    operatorStats: OperatorEfficiency[];
  };
}

// Утилитарная функция для получения названия типа станка
const getMachineTypeLabel = (type: string, t: (key: string) => string): string => {
  if (!type) return t('shifts.machine_generic');
  
  const upperType = type.toUpperCase();
  if (upperType.includes('MILLING')) {
    return t('shifts.milling');
  } else if (upperType.includes('TURNING')) {
    return t('shifts.turning');
  } else if (upperType.includes('DRILLING')) {
    return t('shifts.drilling');
  } else if (upperType.includes('GRINDING')) {
    return t('shifts.grinding');
  }
  
  return t('shifts.machine_generic');
};

export const ActiveMachinesMonitor: React.FC<ActiveMachinesMonitorProps> = ({ selectedOperation: selectedOperationFromProduction }) => {
  const { t } = useTranslation();
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>();
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [selectedOperationDetail, setSelectedOperationDetail] = useState<any>(null);
  const [showOperationDetail, setShowOperationDetail] = useState(false);
  
  // 🆕 НОВОЕ: Состояние для операций из Производства через real-time события
  const [realtimeAssignedOperation, setRealtimeAssignedOperation] = useState<any>(null);
  
  // 🆕 Обработчик событий для real-time обновлений
  React.useEffect(() => {
    const handleOperationAssigned = (event: CustomEvent) => {
      console.log('📡 Получено событие о назначении операции:', event.detail);
      setRealtimeAssignedOperation(event.detail);
      
      // Обновляем все данные для отображения актуальной информации
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      
      // Показываем уведомление
      message.success(`🎉 Операция #${event.detail.operationNumber} синхронизирована!`);
    };
    
    const handleOperationCleared = () => {
      console.log('🗑️ Получено событие об очистке операции');
      setRealtimeAssignedOperation(null);
    };
    
    // Подписываемся на события
    window.addEventListener('operationAssigned', handleOperationAssigned as EventListener);
    window.addEventListener('operationCleared', handleOperationCleared);
    
    return () => {
      window.removeEventListener('operationAssigned', handleOperationAssigned as EventListener);
      window.removeEventListener('operationCleared', handleOperationCleared);
    };
  }, []);
  
  // 🆕 Определяем актуальную операцию (приоритет real-time событиям)
  const currentSelectedOperation = realtimeAssignedOperation || selectedOperationFromProduction;
  
  // Проверяем localStorage при загрузке (для совместимости)
  React.useEffect(() => {
    if (!currentSelectedOperation) {
      const savedOperation = localStorage.getItem('selectedOperation');
      if (savedOperation) {
        try {
          const operation = JSON.parse(savedOperation);
          setRealtimeAssignedOperation(operation);
          console.log('💾 Загружена операция из localStorage (совместимость):', operation);
        } catch (error) {
          console.error('Ошибка парсинга операции из localStorage:', error);
        }
      }
    }
  }, [currentSelectedOperation]);
  
  // НОВОЕ: Система уведомлений о завершении операций
  const {
    pendingNotifications,
    hasNotifications,
    clearNotifications,
    checkSpecificOperation
  } = useOperationCompletionCheck({
    enabled: true,
    checkInterval: 10000, // Проверяем каждые 10 секунд
    onOperationCompleted: (completedOps) => {
      // Показываем системное уведомление
      message.success(`🎉 Операция ${completedOps[0]?.operationInfo.operationNumber} завершена!`);
    }
  });

  // НОВОЕ: Основная система завершения операций
  const {
    completionModalVisible,
    currentCompletedOperation,
    pendingCompletions,
    handleCloseOperation,
    handleContinueOperation,
    handlePlanNewOperation,
    handleCloseModal,
    isClosing,
    isContinuing,
    isArchiving,
  } = useOperationCompletion({
    checkInterval: 8000, // Проверяем каждые 8 секунд (чуть чаще)
    targetQuantity: 30,
    onOperationClosed: (operation) => {
      console.log('📋 Операция закрыта:', operation.operationNumber);
      // Обновляем все данные
      queryClient.invalidateQueries({ queryKey: ['machines'] }); // ИСПРАВЛЕНО
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    },
    onOperationContinued: (operation) => {
      console.log('▶️ Операция продолжена:', operation.operationNumber);
    },
    onNewOperationPlanned: (operation) => {
      console.log('🚀 Планируем новую операцию для станка:', operation.machineName);
      // Обновляем данные и открываем планирование
      queryClient.invalidateQueries({ queryKey: ['machines'] }); // ИСПРАВЛЕНО
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      // Здесь можно добавить открытие модального окна планирования
    },
  });
  
  const queryClient = useQueryClient();

  // Загрузка данных
  const { data: machines, isLoading: machinesLoading, error: machinesError } = useQuery({
    queryKey: ['machines'], // ИСПРАВЛЕНО: используем тот же ключ что и в ProductionPage
    queryFn: machinesApi.getAllWithStatus, // Используем новый API
    refetchInterval: 3000, // Уменьшаем до 3 секунд
    staleTime: 1000, // Данные считаются свежими 1 секунду
  });

  const { data: activeOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['operations', 'in-progress'],
    queryFn: () => operationsApi.getAll(OperationStatus.IN_PROGRESS),
    refetchInterval: 5000,
  });

  const { data: todayShifts, isLoading: shiftsLoading, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftsApi.getAll({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
    refetchInterval: 3000,
  });

  const isLoading = machinesLoading || operationsLoading || shiftsLoading;

  // Функция расчета эффективности оператора
  const calculateOperatorEfficiency = React.useCallback((
    operatorName: string, 
    shifts: any[], 
    operation: any
  ): OperatorEfficiency => {
    const operatorShifts = shifts.filter(shift => 
      shift.dayShiftOperator === operatorName || shift.nightShiftOperator === operatorName
    );

    if (operatorShifts.length === 0) {
      return {
        operatorName,
        productivity: { partsPerHour: 0, planVsFact: 0 },
        quality: { averageTimePerPart: 0, deviation: 0 },
        stability: { consistency: 0 },
        utilization: { workingTime: 0, idleTime: 0, efficiency: 0 },
        rating: 0
      };
    }

    // Собираем данные по сменам оператора
    let totalParts = 0;
    let totalTime = 0;
    let workingSessions = 0;

    operatorShifts.forEach(shift => {
      if (shift.dayShiftOperator === operatorName) {
        totalParts += shift.dayShiftQuantity || 0;
        totalTime += (shift.dayShiftQuantity || 0) * (shift.dayShiftTimePerUnit || 0);
        workingSessions++;
      }
      if (shift.nightShiftOperator === operatorName) {
        totalParts += shift.nightShiftQuantity || 0;
        totalTime += (shift.nightShiftQuantity || 0) * (shift.nightShiftTimePerUnit || 0);
        workingSessions++;
      }
    });

    // Вычисляем метрики
    const partsPerHour = totalTime > 0 ? (totalParts / (totalTime / 60)) : 0;
    const averageTimePerPart = totalParts > 0 ? (totalTime / totalParts) : 0;
    const planTimePerPart = operation?.estimatedTime || 0;
    const deviation = planTimePerPart > 0 ? ((averageTimePerPart - planTimePerPart) / planTimePerPart * 100) : 0;
    const planVsFact = planTimePerPart > 0 ? (planTimePerPart / averageTimePerPart * 100) : 0;

    // Стабильность
    const timePerPartValues = operatorShifts.map(shift => {
      const dayTime = shift.dayShiftOperator === operatorName ? shift.dayShiftTimePerUnit : 0;
      const nightTime = shift.nightShiftOperator === operatorName ? shift.nightShiftTimePerUnit : 0;
      return dayTime || nightTime || 0;
    }).filter(t => t > 0);

    const avgTime = timePerPartValues.reduce((a, b) => a + b, 0) / timePerPartValues.length;
    const variance = timePerPartValues.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / timePerPartValues.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgTime * 100));

    const efficiency = Math.min(100, Math.max(0, planVsFact));
    const sessionBonus = Math.min(2, workingSessions * 0.1);
    const rating = Math.round(
      (Math.min(10, partsPerHour) + 
       Math.min(10, efficiency / 10) + 
       Math.min(10, consistency / 10) + sessionBonus) / 3
    );

    return {
      operatorName,
      productivity: {
        partsPerHour: Math.round(partsPerHour * 100) / 100,
        planVsFact: Math.round(planVsFact * 10) / 10
      },
      quality: {
        averageTimePerPart: Math.round(averageTimePerPart * 10) / 10,
        deviation: Math.round(deviation * 10) / 10
      },
      stability: {
        consistency: Math.round(consistency * 10) / 10
      },
      utilization: {
        workingTime: totalTime,
        idleTime: 0,
        efficiency: Math.round(efficiency * 10) / 10
      },
      rating
    };
  }, []);

  // Функция расчета прогресса операции
  const calculateProgress = React.useCallback((operation: any, operationShifts: any[]): number => {
    if (!operation || !operationShifts.length) return 0;
    
    const totalProduced = operationShifts.reduce((sum, shift) => 
      sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
    );
    
    const targetQuantity = 30; // TODO: Получать из базы данных
    
    return Math.min((totalProduced / targetQuantity) * 100, 100);
  }, []);

  // Фильтрация смен по операции
  const getOperationShifts = React.useCallback((
    machineId: string, 
    operationDetails: any, 
    allShifts: any[]
  ) => {
    if (!operationDetails || !allShifts) {
      console.log(`❌ Нет деталей операции или смен`);
      return [];
    }
    
    console.log(`🔍 Фильтруем смены для станка ${machineId}, операция: ${operationDetails.orderDrawingNumber}`);
    console.log(`📊 Всего смен для фильтрации: ${allShifts.length}`);
    
    const filteredShifts = allShifts.filter(shift => {
      const matchesMachine = shift.machineId === parseInt(machineId);
      
      // Проверяем разные варианты поля с номером чертежа
      const drawingNumberField = shift.drawingNumber || shift.drawingnumber || shift.orderDrawingNumber;
      const matchesDrawing = drawingNumberField === operationDetails.orderDrawingNumber;
      
      console.log(`📋 Смена ${shift.id}:`, {
        machineId: shift.machineId,
        matchesMachine,
        drawingNumber: drawingNumberField,
        expectedDrawing: operationDetails.orderDrawingNumber,
        matchesDrawing,
        shiftDate: shift.date
      });
      
      return matchesMachine && matchesDrawing;
    });
    
    console.log(`✅ Найдено ${filteredShifts.length} смен для текущей операции`);
    
    return filteredShifts;
  }, []);

  // Основная логика объединения данных станков
  const activeMachines: ActiveMachine[] = React.useMemo(() => {
    if (!machines) return [];

    return machines.map(machine => {
      // Находим назначенную операцию для станка
      const assignedOperation = activeOperations?.find(
        op => op.machineId === parseInt(machine.id)
      );

      // Фильтруем смены по текущей операции
      const operationShifts = machine.currentOperationDetails 
        ? getOperationShifts(
            machine.id, 
            machine.currentOperationDetails, 
            todayShifts || []
          )
        : [];

      console.log(`🔍 Станок ${machine.machineName}:`, {
        currentOperation: machine.currentOperationDetails?.orderDrawingNumber,
        totalShifts: todayShifts?.filter(s => s.machineId === parseInt(machine.id)).length || 0,
        operationShifts: operationShifts.length,
        operationShiftsData: operationShifts
      });

      // Вычисляем производство только по ТЕКУЩЕЙ операции
      const currentOperationProduction = operationShifts.reduce((acc, shift) => {
        const dayQuantity = shift.dayShiftQuantity || 0;
        const nightQuantity = shift.nightShiftQuantity || 0;
        const dayTime = dayQuantity * (shift.dayShiftTimePerUnit || 0);
        const nightTime = nightQuantity * (shift.nightShiftTimePerUnit || 0);

        return {
          dayShift: {
            quantity: acc.dayShift.quantity + dayQuantity,
            operator: shift.dayShiftOperator || acc.dayShift.operator,
            efficiency: 0 // Будем вычислять ниже
          },
          nightShift: {
            quantity: acc.nightShift.quantity + nightQuantity,
            operator: shift.nightShiftOperator || acc.nightShift.operator,
            efficiency: 0 // Будем вычислять ниже
          },
          totalTime: acc.totalTime + dayTime + nightTime,
          operatorStats: [] // Будем заполнять ниже
        };
      }, {
        dayShift: { quantity: 0, operator: '-', efficiency: 0 },
        nightShift: { quantity: 0, operator: 'Аркадий', efficiency: 0 },
        totalTime: 0,
        operatorStats: []
      });

      // Вычисляем статистику операторов для текущей операции
      if (operationShifts.length > 0 && assignedOperation) {
        const uniqueOperators = new Set<string>();
        operationShifts.forEach(shift => {
          if (shift.dayShiftOperator) uniqueOperators.add(shift.dayShiftOperator);
          if (shift.nightShiftOperator) uniqueOperators.add(shift.nightShiftOperator);
        });

        currentOperationProduction.operatorStats = Array.from(uniqueOperators)
          .map(operator => calculateOperatorEfficiency(operator, operationShifts, assignedOperation))
          .filter(stat => stat.productivity.partsPerHour > 0);

        // Обновляем эффективность смен
        const dayOperatorStats = currentOperationProduction.operatorStats.find(
          (s: OperatorEfficiency) => s.operatorName === currentOperationProduction.dayShift.operator
        );
        const nightOperatorStats = currentOperationProduction.operatorStats.find(
          (s: OperatorEfficiency) => s.operatorName === currentOperationProduction.nightShift.operator
        );

        currentOperationProduction.dayShift.efficiency = dayOperatorStats?.utilization.efficiency || 0;
        currentOperationProduction.nightShift.efficiency = nightOperatorStats?.utilization.efficiency || 0;
      }

      // Создаем объект активного станка
      const machineData: ActiveMachine = {
        id: machine.id,
        machineName: machine.machineName,
        machineType: machine.machineType,
        isAvailable: machine.isAvailable,
        currentOperationId: machine.currentOperationId,
        lastFreedAt: machine.lastFreedAt ? 
          (typeof machine.lastFreedAt === 'string' ? 
            new Date(machine.lastFreedAt) : 
            machine.lastFreedAt) : 
          undefined,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
        status: assignedOperation ? 
          (!machine.isAvailable ? 'working' : 'setup') : 
          'idle',
        currentOperationProduction,
      };

      // Если есть детали операции из API, добавляем их с прогрессом
      if (machine.currentOperationDetails) {
        const totalProduced = operationShifts.reduce((sum, shift) => 
          sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
        );

        machineData.currentOperationDetails = {
          ...machine.currentOperationDetails,
          progress: calculateProgress(assignedOperation, operationShifts),
          totalProduced,
          targetQuantity: 30 // Пока фиксированное значение
        };
      }

      return machineData;
    });
  }, [machines, activeOperations, todayShifts, calculateProgress, getOperationShifts, calculateOperatorEfficiency]);

  const handleCreateShiftRecord = (machineId: string) => {
    setSelectedMachineId(parseInt(machineId));
    setShowShiftForm(true);
  };

  const handleForceRefresh = async () => {
    // 🆕 Используем новый API для принудительной синхронизации
    try {
      await synchronizationApi.syncAllActiveOperations();
      message.success('🔄 Синхронизация завершена!');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      message.warning('Обновляем данные обычным способом...');
    }
    
    // Обычное обновление
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['machines'] }); // ИСПРАВЛЕНО
    queryClient.invalidateQueries({ queryKey: ['operations'] });
    message.info('Данные обновляются...');
  };

  const handleShiftFormClose = () => {
    setShowShiftForm(false);
    setSelectedMachineId(undefined);
  };

  const handleShiftFormSuccess = () => {
    message.success(t('shifts.record_created'));
    
    // Инвалидируем все связанные запросы для обновления данных
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['machines'] }); // ИСПРАВЛЕНО
    queryClient.invalidateQueries({ queryKey: ['operations'] });
    
    // Принудительно обновляем данные смен
    refetchShifts();
    
    console.log('🔄 Кэш инвалидирован и данные принудительно обновлены!');
    
    handleShiftFormClose();
  };

  const handleOperationClick = (operation: any) => {
    setSelectedOperationDetail(operation);
    setShowOperationDetail(true);
  };

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'green';
      case 'setup': return 'orange';
      case 'maintenance': return 'red';
      default: return 'default';
    }
  };

  const getMachineStatusText = (status: string) => {
    switch (status) {
      case 'working': return t('shifts.working');
      case 'setup': return t('shifts.setup');
      case 'maintenance': return t('shifts.maintenance');
      default: return t('shifts.idle');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>{t('shifts.loading_machines')}</Text>
        </div>
      </div>
    );
  }

  if (machinesError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">{t('shifts.machines_error')}</Text>
      </div>
    );
  }

  if (activeMachines.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>
            {t('shifts.no_active_machines')}.<br />
            {t('shifts.check_machine_settings')}.
          </span>
        }
      />
    );
  }

  return (
    <div>
      {/* ОТЛАДОЧНЫЕ КОМПОНЕНТЫ */}
      <SimpleProductionView />
      
      {/* 🆕 НОВОЕ: Отображение выбранной операции с real-time обновлениями */}
      {currentSelectedOperation && (
        <Card 
          style={{ 
            marginBottom: 16,
            borderColor: currentSelectedOperation.syncedWithShifts ? '#52c41a' : '#faad14',
            backgroundColor: currentSelectedOperation.syncedWithShifts ? '#f6ffed' : '#fffbe6',
            borderRadius: '12px',
            borderWidth: 2
          }}
          size="small"
          extra={
            <Space>
              {currentSelectedOperation.syncedWithShifts && (
                <Tag color="green" style={{ fontSize: '10px' }}>
                  ✅ Синхронизировано
                </Tag>
              )}
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setRealtimeAssignedOperation(null);
                  localStorage.removeItem('selectedOperation');
                  window.dispatchEvent(new CustomEvent('operationCleared'));
                  console.log('🗑️ Операция очищена из мониторинга смен');
                }}
              >
                Очистить
              </Button>
            </Space>
          }
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Text strong style={{ color: currentSelectedOperation.syncedWithShifts ? '#52c41a' : '#faad14', fontSize: '16px' }}>
                  🎆 Операция назначена в Производстве:
                </Text>
                <Text strong style={{ fontSize: '16px' }}>
                  #{currentSelectedOperation.operationNumber}
                </Text>
                <Text type="secondary">
                  для станка {currentSelectedOperation.machineName}
                </Text>
              </Space>
            </Col>
            <Col>
              {currentSelectedOperation.syncedWithShifts ? (
                <Tag color="success" style={{ fontSize: '12px' }}>
                  ✅ Отображено в карточке станка
                </Tag>
              ) : (
                <Tag color="warning" style={{ fontSize: '12px' }}>
                  ⚠️ Требует синхронизации
                </Tag>
              )}
            </Col>
          </Row>
          
          {currentSelectedOperation.synchronizationStatus && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
              Прогресс синхронизации: {currentSelectedOperation.synchronizationStatus.progress.toFixed(1)}% 
              ({currentSelectedOperation.synchronizationStatus.totalProduced}/{currentSelectedOperation.synchronizationStatus.targetQuantity})
            </div>
          )}
        </Card>
      )}
        
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>
              <ToolOutlined /> {t('shifts.monitoring')}
            </Title>
            <Text type="secondary">
              {t('shifts.active_machines_status')}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<SyncOutlined />}
                onClick={handleForceRefresh}
                type="default"
              >
                🆕 Синхронизировать данные
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Автообновление: 3-5 сек
              </Text>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        {activeMachines.map(machine => {
          // 🆕 Проверяем, соответствует ли станок выбранной операции (с поддержкой real-time)
          const isSelectedMachine = currentSelectedOperation && 
            machine.machineName === currentSelectedOperation.machineName;
          
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={machine.id}>
              <Card
                title={
                  <Space>
                    <Badge 
                      status={getMachineStatusColor(machine.status) as any} 
                      text={machine.machineName}
                    />
                    <Tag color="blue">{getMachineTypeLabel(machine.machineType, t)}</Tag>
                    {/* 🆕 НОВОЕ: Индикатор выбранной операции */}
                    {isSelectedMachine && (
                      <Tag color="success" style={{ fontSize: '10px' }}>
                        🎆 ВЫБРАНО
                      </Tag>
                    )}
                  </Space>
                }
                extra={
                  <Tag color={getMachineStatusColor(machine.status)}>
                    {getMachineStatusText(machine.status)}
                  </Tag>
                }
                actions={[
                  <Tooltip title={t('shifts.shift_record')}>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => handleCreateShiftRecord(machine.id)}
                    >
                      {t('shifts.shift_record')}
                    </Button>
                  </Tooltip>
                ]}
                size="small"
                style={{
                  // 🆕 НОВОЕ: Подсвечиваем карточку выбранного станка
                  borderColor: isSelectedMachine ? '#52c41a' : undefined,
                  borderWidth: isSelectedMachine ? 2 : 1,
                  backgroundColor: isSelectedMachine ? '#f6ffed' : undefined,
                  boxShadow: isSelectedMachine ? '0 4px 16px rgba(82, 196, 26, 0.3)' : undefined
                }}
              >
              {machine.currentOperationDetails ? (
                <div>
                  <div 
                    style={{ 
                      marginBottom: 12, 
                      cursor: 'pointer',
                      padding: '8px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff'
                    }}
                    onClick={() => handleOperationClick(machine.currentOperationDetails)}
                  >
                    <Text strong>{t('shifts.current_operation')}:</Text>
                    <br />
                    <Text>{t('form.operation')} {machine.currentOperationDetails.operationNumber}</Text>
                    <br />
                    <Text type="secondary">
                      {machine.currentOperationDetails.orderDrawingNumber}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      <BarChartOutlined /> {t('shifts.click_for_analytics')}
                    </Text>
                  </div>

                  {/* ИСПРАВЛЕННОЕ: Улучшенный индикатор прогресса с проверкой завершения */}
                  <div style={{ marginBottom: 12 }}>
                    <Text>{t('shifts.progress_execution')}:</Text>
                    <Progress 
                      percent={Math.round(machine.currentOperationDetails.progress || 0)} 
                      size="small"
                      status={(machine.currentOperationDetails.progress || 0) >= 100 ? 'success' : 'active'}
                      strokeColor={(machine.currentOperationDetails.progress || 0) >= 100 ? '#52c41a' : undefined}
                    />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {machine.currentOperationDetails.totalProduced || 0} {t('shifts.of')} {machine.currentOperationDetails.targetQuantity || 0} {t('shifts.parts_suffix')}
                      {(machine.currentOperationDetails.progress || 0) >= 100 && (
                        <Tag color="green" style={{ marginLeft: 8, fontSize: '10px' }}>
                          ✅ ВЫПОЛНЕНО
                        </Tag>
                      )}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>
                      <ClockCircleOutlined /> {t('form.time')}: {machine.currentOperationDetails.estimatedTime}{t('shifts.minutes')}
                    </Text>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <Text strong>{t('shifts.production_by_operation')}:</Text>
                    <br />
                    <Tag color="purple" style={{ fontSize: '10px', marginBottom: '8px' }}>
                      📋 {machine.currentOperationDetails.orderDrawingNumber}
                    </Tag>
                    {/* НОВОЕ: Индикатор новой операции */}
                    {(machine.currentOperationProduction?.dayShift.quantity || 0) === 0 && 
                     (machine.currentOperationProduction?.nightShift.quantity || 0) === 0 && (
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <Tag color="green" style={{ fontSize: '11px' }}>
                          🆕 НОВАЯ ОПЕРАЦИЯ
                        </Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          Производство еще не началось
                        </Text>
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                            <Text type="secondary">{t('shifts.day')}</Text>
                            <br />
                            <Text strong style={{ fontSize: '18px' }}>
                              {machine.currentOperationProduction?.dayShift.quantity || 0}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {machine.currentOperationProduction?.dayShift.operator || '-'}
                            </Text>
                            {(machine.currentOperationProduction?.dayShift.efficiency || 0) > 0 && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: '10px', color: (machine.currentOperationProduction?.dayShift.efficiency || 0) > 80 ? '#52c41a' : '#faad14' }}>
                                  ⚡ {(machine.currentOperationProduction?.dayShift.efficiency || 0).toFixed(0)}%
                                </Text>
                              </>
                            )}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f6f6f6', borderRadius: '4px' }}>
                            <Text type="secondary">{t('shifts.night')}</Text>
                            <br />
                            <Text strong style={{ fontSize: '18px' }}>
                              {machine.currentOperationProduction?.nightShift.quantity || 0}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {machine.currentOperationProduction?.nightShift.operator || 'Аркадий'}
                            </Text>
                            {(machine.currentOperationProduction?.nightShift.efficiency || 0) > 0 && (
                              <>
                                <br />
                                <Text type="secondary" style={{ fontSize: '10px', color: (machine.currentOperationProduction?.nightShift.efficiency || 0) > 80 ? '#52c41a' : '#faad14' }}>
                                  ⚡ {(machine.currentOperationProduction?.nightShift.efficiency || 0).toFixed(0)}%
                                </Text>
                              </>
                            )}
                          </div>
                        </Col>
                      </Row>
                      
                      {/* НОВОЕ: Общая сумма выполненного объема */}
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px', 
                        backgroundColor: '#f0f9ff', 
                        borderRadius: '8px',
                        border: '2px solid #1890ff'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                            📊 ОБЩИЙ ОБЪЕМ
                          </Text>
                          <br />
                          <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                            {((machine.currentOperationProduction?.dayShift.quantity || 0) + 
                              (machine.currentOperationProduction?.nightShift.quantity || 0))}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
                            деталей
                          </Text>
                          <br />
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              День: {machine.currentOperationProduction?.dayShift.quantity || 0} + 
                              Ночь: {machine.currentOperationProduction?.nightShift.quantity || 0}
                            </Text>
                          </div>
                          {/* 🆕 Индикатор синхронизации */}
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '10px', color: '#52c41a' }}>
                              🔄 Синхронизируется автоматически
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <PauseCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">{t('shifts.machine_idle')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {t('shifts.no_assigned_operations')}
                    </Text>
                  </div>
                </div>
              )}
            </Card>
          </Col>
          );
        })}
      </Row>

      <ShiftForm
        visible={showShiftForm}
        onClose={handleShiftFormClose}
        onSuccess={handleShiftFormSuccess}
        selectedMachineId={selectedMachineId}
      />

      <OperationDetailModal
        visible={showOperationDetail}
        operation={selectedOperationDetail}
        onClose={() => setShowOperationDetail(false)}
      />

      {/* НОВОЕ: Система уведомлений о завершении операций */}
      <OperationCompletionNotification
        completedOperations={pendingNotifications}
        onClearNotifications={clearNotifications}
        machines={activeMachines || []}
      />

      {/* НОВОЕ: Модальное окно завершения операций */}
      <OperationCompletionModal
        visible={completionModalVisible}
        completedOperation={currentCompletedOperation}
        onClose={handleCloseModal}
        onCloseOperation={handleCloseOperation}
        onContinueOperation={handleContinueOperation}
        onPlanNewOperation={handlePlanNewOperation}
        loading={isClosing || isContinuing || isArchiving}
      />
    </div>
  );
};

export default ActiveMachinesMonitor;
