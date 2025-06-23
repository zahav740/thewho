/**
 * @file: ActiveMachinesMonitor.tsx (🎨 КОМПАКТНАЯ ВЕРСИЯ)
 * @description: Компактный профессиональный мониторинг станков с детальными модалками
 * @dependencies: antd, react-query, synchronizationApi, real-time events
 * @created: 2025-06-23
 * @updated: 2025-06-23 - Полностью переработанный компактный дизайн
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
  message,
  Modal,
  Statistic,
  Avatar,
  Descriptions,
} from 'antd';
import {
  PauseCircleOutlined,
  ToolOutlined,
  FileTextOutlined,
  SyncOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { operationsApi } from '../../../services/operationsApi';
import { shiftsApi } from '../../../services/shiftsApi';
import { synchronizationApi } from '../../../services/synchronizationApi';
import { OperationStatus } from '../../../types/operation.types';

import { ShiftForm } from './ShiftForm';
import { OperationDetailModal } from './OperationDetailModal';

// Импорт систем завершения операций
import OperationCompletionNotification from '../../../components/OperationCompletionNotification';
import { OperationCompletionModal } from '../../../components/OperationCompletion';
import { useOperationCompletionCheck, useOperationCompletion } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Интерфейсы остаются прежними
interface ActiveMachinesMonitorProps {
  selectedOperation?: any;
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

// Утилитарные функции остаются прежними
const getMachineCategory = (machine: ActiveMachine): 'milling' | 'turning' | 'unknown' => {
  const { machineName, machineType } = machine;
  const upperName = machineName?.toUpperCase() || '';
  const upperType = machineType?.toUpperCase() || '';
  
  if (upperType.includes('MILLING') || upperType.includes('MILL')) {
    return 'milling';
  }
  if (upperType.includes('TURNING') || upperType.includes('TURN')) {
    return 'turning';
  }
  
  if (upperName.includes('MITSUBISHI') || 
      upperName.includes('MAZAK') ||
      upperName.includes('HAAS') ||
      upperName.includes('DMG') ||
      upperName.includes('MAKINO') ||
      upperName.startsWith('F1') || upperName.startsWith('F2') || 
      upperName.startsWith('F3') || upperName.startsWith('F4')) {
    return 'milling';
  }
  
  if (upperName.startsWith('T1') || upperName.startsWith('T2') || 
      upperName.startsWith('T3') || upperName.startsWith('T4') ||
      upperName.includes('DOOSAN') ||
      upperName.includes('OKUMA') ||
      upperName.includes('CITIZEN')) {
    return 'turning';
  }
  
  return 'unknown';
};

const getMachineTypeLabel = (machine: ActiveMachine, t: (key: string) => string): string => {
  const category = getMachineCategory(machine);
  
  switch (category) {
    case 'milling':
      return t('shifts.milling');
    case 'turning':
      return t('shifts.turning');
    default:
      return t('shifts.machine_generic');
  }
};

// НОВЫЙ КОМПОНЕНТ: Детальное модальное окно станка
const MachineDetailModal: React.FC<{
  visible: boolean;
  machine: ActiveMachine | null;
  onClose: () => void;
  onCreateShift: () => void;
  t: (key: string) => string;
}> = ({ visible, machine, onClose, onCreateShift, t }) => {
  if (!machine) return null;

  return (
    <Modal
      title={
        <Space>
          <Avatar 
            style={{ 
              backgroundColor: machine.status === 'working' ? '#52c41a' : 
                             machine.status === 'setup' ? '#faad14' : '#d9d9d9' 
            }}
            icon={<ToolOutlined />}
          />
          <div>
            <Text strong style={{ fontSize: '18px' }}>{machine.machineName}</Text>
            <br />
            <Tag color="blue">{getMachineTypeLabel(machine, t)}</Tag>
            <Tag color={machine.status === 'working' ? 'green' : 
                       machine.status === 'setup' ? 'orange' : 'default'}>
              {machine.status === 'working' ? t('shifts.working') : 
               machine.status === 'setup' ? t('shifts.setup') : t('shifts.idle')}
            </Tag>
          </div>
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
        <Button key="shift" type="primary" icon={<FileTextOutlined />} onClick={onCreateShift}>
          {t('shifts.new_record')}
        </Button>,
      ]}
    >
      {machine.currentOperationDetails ? (
        <div>
          {/* Информация об операции */}
          <Card 
            title="🔧 Текущая операция" 
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              <Tag color="blue">
                Операция #{machine.currentOperationDetails.operationNumber}
              </Tag>
            }
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Номер чертежа">
                {machine.currentOperationDetails.orderDrawingNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Тип операции">
                {machine.currentOperationDetails.operationType}
              </Descriptions.Item>
              <Descriptions.Item label="Плановое время">
                {machine.currentOperationDetails.estimatedTime} мин
              </Descriptions.Item>
              <Descriptions.Item label="Заказ">
                #{machine.currentOperationDetails.orderId}
              </Descriptions.Item>
            </Descriptions>

            {/* Прогресс выполнения */}
            <div style={{ marginTop: 16 }}>
              <Text strong>Прогресс выполнения:</Text>
              <Progress 
                percent={Math.round(machine.currentOperationDetails.progress || 0)} 
                status={(machine.currentOperationDetails.progress || 0) >= 100 ? 'success' : 'active'}
                strokeColor={(machine.currentOperationDetails.progress || 0) >= 100 ? '#52c41a' : '#1890ff'}
              />
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <Statistic 
                    title="Выполнено" 
                    value={machine.currentOperationDetails.totalProduced || 0} 
                    suffix="шт"
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="План" 
                    value={machine.currentOperationDetails.targetQuantity || 0} 
                    suffix="шт"
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Остается" 
                    value={(machine.currentOperationDetails.targetQuantity || 0) - (machine.currentOperationDetails.totalProduced || 0)} 
                    suffix="шт"
                    valueStyle={{ color: (machine.currentOperationDetails.progress || 0) >= 100 ? '#52c41a' : '#1890ff' }}
                  />
                </Col>
              </Row>
            </div>
          </Card>

          {/* Производство по сменам */}
          <Card title="📊 Производство по сменам" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Card 
                  size="small" 
                  title="🌅 Дневная смена"
                  style={{ backgroundColor: '#f0f9ff' }}
                >
                  <Statistic 
                    title="Количество" 
                    value={machine.currentOperationProduction?.dayShift.quantity || 0}
                    suffix="шт"
                    valueStyle={{ fontSize: '24px', color: '#1890ff' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Оператор: {machine.currentOperationProduction?.dayShift.operator || '-'}
                    </Text>
                    {(machine.currentOperationProduction?.dayShift.efficiency || 0) > 0 && (
                      <div>
                        <Text type="secondary">
                          Эффективность: 
                          <span style={{ color: (machine.currentOperationProduction?.dayShift.efficiency || 0) > 80 ? '#52c41a' : '#faad14' }}>
                            {(machine.currentOperationProduction?.dayShift.efficiency || 0).toFixed(0)}%
                          </span>
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  title="🌙 Ночная смена"
                  style={{ backgroundColor: '#f6f6f6' }}
                >
                  <Statistic 
                    title="Количество" 
                    value={machine.currentOperationProduction?.nightShift.quantity || 0}
                    suffix="шт"
                    valueStyle={{ fontSize: '24px', color: '#595959' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Оператор: {machine.currentOperationProduction?.nightShift.operator || t('shifts.default_operator')}
                    </Text>
                    {(machine.currentOperationProduction?.nightShift.efficiency || 0) > 0 && (
                      <div>
                        <Text type="secondary">
                          Эффективность: 
                          <span style={{ color: (machine.currentOperationProduction?.nightShift.efficiency || 0) > 80 ? '#52c41a' : '#faad14' }}>
                            {(machine.currentOperationProduction?.nightShift.efficiency || 0).toFixed(0)}%
                          </span>
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Общий итог */}
            <Card 
              size="small" 
              style={{ 
                marginTop: 16, 
                backgroundColor: '#f0f9ff', 
                border: '2px solid #1890ff' 
              }}
            >
              <Row justify="center">
                <Col>
                  <Statistic 
                    title="📊 ОБЩИЙ ОБЪЕМ ПРОИЗВОДСТВА"
                    value={(machine.currentOperationProduction?.dayShift.quantity || 0) + (machine.currentOperationProduction?.nightShift.quantity || 0)}
                    suffix="деталей"
                    valueStyle={{ fontSize: '32px', color: '#1890ff', fontWeight: 'bold' }}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary">
                      🔄 Синхронизируется автоматически
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Card>
        </div>
      ) : (
        <Empty 
          image={<PauseCircleOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
          description={
            <div>
              <Text strong>Станок не работает</Text>
              <br />
              <Text type="secondary">Нет назначенных операций</Text>
            </div>
          }
        />
      )}
    </Modal>
  );
};

export const ActiveMachinesMonitor: React.FC<ActiveMachinesMonitorProps> = ({ selectedOperation: selectedOperationFromProduction }) => {
  const { t } = useTranslation();
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>();
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [selectedOperationDetail, setSelectedOperationDetail] = useState<any>(null);
  const [showOperationDetail, setShowOperationDetail] = useState(false);
  
  // НОВОЕ: Состояние для детального просмотра станка
  const [selectedMachineForDetail, setSelectedMachineForDetail] = useState<ActiveMachine | null>(null);
  const [showMachineDetail, setShowMachineDetail] = useState(false);
  
  // Real-time события
  const [realtimeAssignedOperation, setRealtimeAssignedOperation] = useState<any>(null);
  
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    const handleOperationAssigned = (event: CustomEvent) => {
      console.log('📡 Получено событие о назначении операции:', event.detail);
      setRealtimeAssignedOperation(event.detail);
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      message.success(`🎉 Операция #${event.detail.operationNumber} синхронизирована!`);
    };
    
    const handleOperationCleared = () => {
      console.log('🗑️ Получено событие об очистке операции');
      setRealtimeAssignedOperation(null);
    };
    
    window.addEventListener('operationAssigned', handleOperationAssigned as EventListener);
    window.addEventListener('operationCleared', handleOperationCleared);
    
    return () => {
      window.removeEventListener('operationAssigned', handleOperationAssigned as EventListener);
      window.removeEventListener('operationCleared', handleOperationCleared);
    };
  }, [queryClient]);
  
  const currentSelectedOperation = realtimeAssignedOperation || selectedOperationFromProduction;
  
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
  
  // Системы завершения операций
  const {
    pendingNotifications,
    clearNotifications,
  } = useOperationCompletionCheck({
    enabled: true,
    checkInterval: 10000,
    onOperationCompleted: (completedOps) => {
      message.success(`🎉 Операция ${completedOps[0]?.operationInfo.operationNumber} завершена!`);
    }
  });

  const {
    completionModalVisible,
    currentCompletedOperation,
    handleCloseOperation,
    handleContinueOperation,
    handlePlanNewOperation,
    handleCloseModal,
    isClosing,
    isContinuing,
    isArchiving,
  } = useOperationCompletion({
    checkInterval: 8000,
    targetQuantity: 30,
    onOperationClosed: (operation) => {
      console.log('📋 Операция закрыта:', operation.operationNumber);
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    },
    onOperationContinued: (operation) => {
      console.log('▶️ Операция продолжена:', operation.operationNumber);
    },
    onNewOperationPlanned: (operation) => {
      console.log('🚀 Планируем новую операцию для станка:', operation.machineName);
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    },
  });

  // Загрузка данных (остается прежней)
  const { data: machines, isLoading: machinesLoading, error: machinesError } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAllWithStatus,
    refetchInterval: 3000,
    staleTime: 1000,
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

  // Функции расчета остаются прежними...
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

    const partsPerHour = totalTime > 0 ? (totalParts / (totalTime / 60)) : 0;
    const averageTimePerPart = totalParts > 0 ? (totalTime / totalParts) : 0;
    const planTimePerPart = operation?.estimatedTime || 0;
    const deviation = planTimePerPart > 0 ? ((averageTimePerPart - planTimePerPart) / planTimePerPart * 100) : 0;
    const planVsFact = planTimePerPart > 0 ? (planTimePerPart / averageTimePerPart * 100) : 0;

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

  const calculateProgress = React.useCallback((operation: any, operationShifts: any[]): number => {
    if (!operation || !operationShifts.length) return 0;
    
    const totalProduced = operationShifts.reduce((sum, shift) => 
      sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
    );
    
    const targetQuantity = 30;
    
    return Math.min((totalProduced / targetQuantity) * 100, 100);
  }, []);

  const getOperationShifts = React.useCallback((
    machineId: string, 
    operationDetails: any, 
    allShifts: any[]
  ) => {
    if (!operationDetails || !allShifts) {
      return [];
    }
    
    const filteredShifts = allShifts.filter(shift => {
      const matchesMachine = shift.machineId === parseInt(machineId);
      const drawingNumberField = shift.drawingNumber || shift.drawingnumber || shift.orderDrawingNumber;
      const matchesDrawing = drawingNumberField === operationDetails.orderDrawingNumber;
      
      return matchesMachine && matchesDrawing;
    });
    
    return filteredShifts;
  }, []);

  // Основная логика объединения данных станков
  const activeMachines: ActiveMachine[] = React.useMemo(() => {
    if (!machines) return [];

    return machines.map(machine => {
      const assignedOperation = activeOperations?.find(
        op => op.machineId === parseInt(machine.id)
      );

      const operationShifts = machine.currentOperationDetails 
        ? getOperationShifts(
            machine.id, 
            machine.currentOperationDetails, 
            todayShifts || []
          )
        : [];

      const currentOperationProduction = operationShifts.reduce((acc, shift) => {
        const dayQuantity = shift.dayShiftQuantity || 0;
        const nightQuantity = shift.nightShiftQuantity || 0;
        const dayTime = dayQuantity * (shift.dayShiftTimePerUnit || 0);
        const nightTime = nightQuantity * (shift.nightShiftTimePerUnit || 0);

        return {
          dayShift: {
            quantity: acc.dayShift.quantity + dayQuantity,
            operator: shift.dayShiftOperator || acc.dayShift.operator,
            efficiency: 0
          },
          nightShift: {
            quantity: acc.nightShift.quantity + nightQuantity,
            operator: shift.nightShiftOperator || acc.nightShift.operator,
            efficiency: 0
          },
          totalTime: acc.totalTime + dayTime + nightTime,
          operatorStats: []
        };
      }, {
        dayShift: { quantity: 0, operator: '-', efficiency: 0 },
        nightShift: { quantity: 0, operator: t('shifts.default_operator'), efficiency: 0 },
        totalTime: 0,
        operatorStats: []
      });

      if (operationShifts.length > 0 && assignedOperation) {
        const uniqueOperators = new Set<string>();
        operationShifts.forEach(shift => {
          if (shift.dayShiftOperator) uniqueOperators.add(shift.dayShiftOperator);
          if (shift.nightShiftOperator) uniqueOperators.add(shift.nightShiftOperator);
        });

        currentOperationProduction.operatorStats = Array.from(uniqueOperators)
          .map(operator => calculateOperatorEfficiency(operator, operationShifts, assignedOperation))
          .filter(stat => stat.productivity.partsPerHour > 0);

        const dayOperatorStats = currentOperationProduction.operatorStats.find(
          (s: OperatorEfficiency) => s.operatorName === currentOperationProduction.dayShift.operator
        );
        const nightOperatorStats = currentOperationProduction.operatorStats.find(
          (s: OperatorEfficiency) => s.operatorName === currentOperationProduction.nightShift.operator
        );

        currentOperationProduction.dayShift.efficiency = dayOperatorStats?.utilization.efficiency || 0;
        currentOperationProduction.nightShift.efficiency = nightOperatorStats?.utilization.efficiency || 0;
      }

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

      if (machine.currentOperationDetails) {
        const totalProduced = operationShifts.reduce((sum, shift) => 
          sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
        );

        machineData.currentOperationDetails = {
          ...machine.currentOperationDetails,
          progress: calculateProgress(assignedOperation, operationShifts),
          totalProduced,
          targetQuantity: 30
        };
      }

      return machineData;
    });
  }, [machines, activeOperations, todayShifts, calculateProgress, getOperationShifts, calculateOperatorEfficiency, t]);

  // Обработчики событий
  const handleCreateShiftRecord = (machineId: string) => {
    setSelectedMachineId(parseInt(machineId));
    setShowShiftForm(true);
  };

  const handleMachineDetailView = (machine: ActiveMachine) => {
    setSelectedMachineForDetail(machine);
    setShowMachineDetail(true);
  };

  const handleForceRefresh = async () => {
    try {
      await synchronizationApi.syncAllActiveOperations();
      message.success('🔄 Синхронизация завершена!');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      message.warning('Обновляем данные обычным способом...');
    }
    
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['machines'] });
    queryClient.invalidateQueries({ queryKey: ['operations'] });
    message.info('Данные обновляются...');
  };

  const handleShiftFormClose = () => {
    setShowShiftForm(false);
    setSelectedMachineId(undefined);
  };

  const handleShiftFormSuccess = () => {
    message.success(t('shifts.record_created'));
    
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['machines'] });
    queryClient.invalidateQueries({ queryKey: ['operations'] });
    
    refetchShifts();
    
    console.log('🔄 Кэш инвалидирован и данные принудительно обновлены!');
    
    handleShiftFormClose();
  };

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'green';
      case 'setup': return 'orange';
      case 'maintenance': return 'red';
      default: return 'default';
    }
  };

  // НОВАЯ ФУНКЦИЯ: Рендер компактной карточки станка
  const renderCompactMachineCard = (machine: ActiveMachine) => {
    const isSelectedMachine = currentSelectedOperation && 
      machine.machineName === currentSelectedOperation.machineName;

    const totalProduction = (machine.currentOperationProduction?.dayShift.quantity || 0) + 
                           (machine.currentOperationProduction?.nightShift.quantity || 0);
    
    return (
      <Card
        key={machine.id}
        hoverable
        size="small"
        style={{
          borderColor: isSelectedMachine ? '#52c41a' : undefined,
          borderWidth: isSelectedMachine ? 2 : 1,
          backgroundColor: isSelectedMachine ? '#f6ffed' : undefined,
          cursor: 'pointer',
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Badge 
                status={getMachineStatusColor(machine.status) as any} 
                text={
                  <Text strong style={{ fontSize: '14px' }}>
                    {machine.machineName}
                  </Text>
                }
              />
              {isSelectedMachine && (
                <Tag color="success" style={{ fontSize: '10px' }}>
                  🎆 ВЫБРАНО
                </Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title="Посмотреть детали">
                <Button 
                  type="text" 
                  icon={<EyeOutlined />} 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMachineDetailView(machine);
                  }}
                />
              </Tooltip>
              <Tooltip title={t('shifts.new_record')}>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateShiftRecord(machine.id);
                  }}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {machine.currentOperationDetails ? (
          <div style={{ marginTop: 8 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Операция #{machine.currentOperationDetails.operationNumber}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {machine.currentOperationDetails.orderDrawingNumber}
                </Text>
              </Col>
              <Col>
                <div style={{ textAlign: 'right' }}>
                  <Text strong style={{ 
                    fontSize: '16px', 
                    color: totalProduction > 0 ? '#1890ff' : '#d9d9d9' 
                  }}>
                    {totalProduction}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px', marginLeft: '2px' }}>
                    шт
                  </Text>
                  <br />
                  <Progress 
                    percent={Math.round(machine.currentOperationDetails.progress || 0)} 
                    size="small"
                    showInfo={false}
                    strokeWidth={4}
                    status={(machine.currentOperationDetails.progress || 0) >= 100 ? 'success' : 'active'}
                  />
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <PauseCircleOutlined /> Станок не работает
            </Text>
          </div>
        )}
      </Card>
    );
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

  // Группируем станки по типам
  const millingMachines = activeMachines.filter(machine => getMachineCategory(machine) === 'milling');
  const turningMachines = activeMachines.filter(machine => getMachineCategory(machine) === 'turning');

  return (
    <div>
      {/* Отображение выбранной операции */}
      {currentSelectedOperation && (
        <Card 
          style={{ 
            marginBottom: 16,
            borderColor: currentSelectedOperation.syncedWithShifts ? '#52c41a' : '#faad14',
            backgroundColor: currentSelectedOperation.syncedWithShifts ? '#f6ffed' : '#fffbe6',
            borderRadius: '8px',
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
                <Text strong style={{ color: currentSelectedOperation.syncedWithShifts ? '#52c41a' : '#faad14' }}>
                  🎆 Операция #{currentSelectedOperation.operationNumber}
                </Text>
                <Text type="secondary">
                  для станка {currentSelectedOperation.machineName}
                </Text>
              </Space>
            </Col>
            <Col>
              {currentSelectedOperation.syncedWithShifts ? (
                <Tag color="success" style={{ fontSize: '10px' }}>
                  ✅ Отображено в карточке станка
                </Tag>
              ) : (
                <Tag color="warning" style={{ fontSize: '10px' }}>
                  ⚠️ Требует синхронизации
                </Tag>
              )}
            </Col>
          </Row>
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
                size="small"
              >
                Синхронизировать
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Автообновление: 3-5 сек
              </Text>
            </Space>
          </Col>
        </Row>
      </div>

      {/* НОВОЕ: КОМПАКТНОЕ ОТОБРАЖЕНИЕ СТАНКОВ */}
      <Row gutter={[16, 16]}>
        {/* Фрезерные станки */}
        {millingMachines.length > 0 && (
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <Text strong style={{ color: '#1890ff' }}>
                    🔧 {t('shifts.milling_machines')}
                  </Text>
                  <Badge count={millingMachines.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={[8, 8]}>
                {millingMachines.map(machine => (
                  <Col xs={24} sm={12} md={8} lg={6} key={machine.id}>
                    {renderCompactMachineCard(machine)}
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
        
        {/* Токарные станки */}
        {turningMachines.length > 0 && (
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <Text strong style={{ color: '#52c41a' }}>
                    ⚙️ {t('shifts.turning_machines')}
                  </Text>
                  <Badge count={turningMachines.length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
              }
              size="small"
            >
              <Row gutter={[8, 8]}>
                {turningMachines.map(machine => (
                  <Col xs={24} sm={12} md={8} lg={6} key={machine.id}>
                    {renderCompactMachineCard(machine)}
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
      </Row>

      {/* Модальные окна */}
      <ShiftForm
        visible={showShiftForm}
        onClose={handleShiftFormClose}
        onSuccess={handleShiftFormSuccess}
        selectedMachineId={selectedMachineId}
      />

      <MachineDetailModal
        visible={showMachineDetail}
        machine={selectedMachineForDetail}
        onClose={() => setShowMachineDetail(false)}
        onCreateShift={() => {
          if (selectedMachineForDetail) {
            setShowMachineDetail(false);
            handleCreateShiftRecord(selectedMachineForDetail.id);
          }
        }}
        t={t}
      />

      <OperationDetailModal
        visible={showOperationDetail}
        operation={selectedOperationDetail}
        onClose={() => setShowOperationDetail(false)}
      />

      {/* Системы уведомлений */}
      <OperationCompletionNotification
        completedOperations={pendingNotifications}
        onClearNotifications={clearNotifications}
        machines={activeMachines || []}
      />

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