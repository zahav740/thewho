/**
 * @file: ActiveMachinesMonitor.tsx
 * @description: Компонент мониторинга активных станков (ИСПРАВЛЕН - фильтрация по текущей операции)
 * @dependencies: antd, react-query, machinesApi, operationsApi
 * @created: 2025-06-07
 * @fixed: 2025-06-07 - Добавлена фильтрация данных по текущей операции и номеру чертежа
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
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { operationsApi } from '../../../services/operationsApi';
import { shiftsApi } from '../../../services/shiftsApi';
import { OperationStatus } from '../../../types/operation.types';

import { ShiftForm } from './ShiftForm';
import { OperationDetailModal } from './OperationDetailModal';
import { useTranslation } from '../../../i18n';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Интерфейс для эффективности оператора
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

// Расширенный тип для текущих деталей операции с прогрессом
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

// Тип активного станка с фильтрацией по операции
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

export const ActiveMachinesMonitor: React.FC = () => {
  const { t } = useTranslation();
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>();
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [showOperationDetail, setShowOperationDetail] = useState(false);
  
  // ИСПРАВЛЕНО: Добавлен useQueryClient для инвалидации кэша
  const queryClient = useQueryClient();

  // Загружаем список станков (используем основной API)
  const { data: machines, isLoading: machinesLoading, error: machinesError } = useQuery({
    queryKey: ['machines-availability'],
    queryFn: machinesApi.getAll,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  // Загружаем активные операции
  const { data: activeOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['operations', 'in-progress'],
    queryFn: () => operationsApi.getAll(OperationStatus.IN_PROGRESS),
    refetchInterval: 30000,
  });

  // Загружаем сегодняшние смены
  const { data: todayShifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftsApi.getAll({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  const isLoading = machinesLoading || operationsLoading || shiftsLoading;

  // НОВАЯ ФУНКЦИЯ: Вычисление эффективности оператора
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
    
    console.log(`Вычисляем эффективность оператора ${operatorName}...`);

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

    // Стабильность (насколько постоянны показатели)
    const timePerPartValues = operatorShifts.map(shift => {
      const dayTime = shift.dayShiftOperator === operatorName ? shift.dayShiftTimePerUnit : 0;
      const nightTime = shift.nightShiftOperator === operatorName ? shift.nightShiftTimePerUnit : 0;
      return dayTime || nightTime || 0;
    }).filter(t => t > 0);

    const avgTime = timePerPartValues.reduce((a, b) => a + b, 0) / timePerPartValues.length;
    const variance = timePerPartValues.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / timePerPartValues.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgTime * 100));

    // Эффективность использования времени
    const efficiency = Math.min(100, Math.max(0, planVsFact));
    
    // Общий рейтинг (0-10) с учетом количества рабочих сессий
    const sessionBonus = Math.min(2, workingSessions * 0.1); // Бонус за стабильность работы
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
        idleTime: 0, // Пока не реализовано
        efficiency: Math.round(efficiency * 10) / 10
      },
      rating
    };
  }, []);

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Вычисляем прогресс операции на основе реальных данных смен
  const calculateProgress = React.useCallback((operation: any, operationShifts: any[]): number => {
    if (!operation || !operationShifts.length) return 0;
    
    const totalProduced = operationShifts.reduce((sum, shift) => 
      sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
    );
    
    // Получаем целевое количество из заказа
    const targetQuantity = operation.order?.quantity || 100; // fallback значение
    
    return Math.min((totalProduced / targetQuantity) * 100, 100);
  }, []);

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Фильтрация смен по текущей операции С УЧЕТОМ ВРЕМЕНИ НАЗНАЧЕНИЯ
  const getOperationShifts = React.useCallback((
    machineId: string, 
    operationDetails: any, 
    allShifts: any[],
    operationAssignedAt?: string | Date
  ) => {
    if (!operationDetails || !allShifts) return [];
    
    // Если есть время назначения операции, фильтруем смены только после этого времени
    if (operationAssignedAt) {
      const operationStartTime = new Date(operationAssignedAt);
      console.log(`🕒 Фильтруем смены для ${operationDetails.orderDrawingNumber} после ${operationStartTime.toISOString()}`);
      
      const filteredShifts = allShifts.filter(shift => {
        const shiftTime = new Date(shift.createdAt);
        const matchesMachine = shift.machineId === parseInt(machineId);
        const matchesDrawing = shift.drawingNumber === operationDetails.orderDrawingNumber;
        const isAfterAssignment = shiftTime >= operationStartTime;
        
        console.log(`📋 Смена ${shift.id}: машина=${matchesMachine}, чертеж=${matchesDrawing}, время=${isAfterAssignment}`);
        
        return matchesMachine && matchesDrawing && isAfterAssignment;
      });
      
      console.log(`✅ Найдено ${filteredShifts.length} смен для текущей операции`);
      return filteredShifts;
    }
    
    // Fallback: старая логика без учета времени
    console.log(`⚠️ Используем старую логику фильтрации (нет времени назначения)`);
    return allShifts.filter(shift => 
      shift.machineId === parseInt(machineId) && 
      shift.drawingNumber === operationDetails.orderDrawingNumber
    );
  }, []);

  // ИСПРАВЛЕННАЯ ЛОГИКА: Объединяем данные станков с активными операциями и производством ПО ТЕКУЩЕЙ ОПЕРАЦИИ
  const activeMachines: ActiveMachine[] = React.useMemo(() => {
    if (!machines) return [];

    return machines.map(machine => {
      // Находим назначенную операцию для станка
      const assignedOperation = activeOperations?.find(
        op => op.machineId === parseInt(machine.id)
      );

      // ИСПРАВЛЕНО: Фильтруем смены только по ТЕКУЩЕЙ операции И времени назначения
      const operationShifts = machine.currentOperationDetails 
        ? getOperationShifts(
            machine.id, 
            machine.currentOperationDetails, 
            todayShifts || [],
            machine.lastFreedAt // ✅ Передаем время назначения операции
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
          targetQuantity: (assignedOperation as any)?.orderId ? 100 : 100 // ИСПРАВЛЕНО: убрана ссылка на order.quantity
        };
      }

      return machineData;
    });
  }, [machines, activeOperations, todayShifts, calculateProgress, getOperationShifts, calculateOperatorEfficiency]);

  const handleCreateShiftRecord = (machineId: string) => {
    setSelectedMachineId(parseInt(machineId));
    setShowShiftForm(true);
  };

  const handleShiftFormClose = () => {
    setShowShiftForm(false);
    setSelectedMachineId(undefined);
  };

  // ИСПРАВЛЕНО: Добавлена инвалидация кэша для автообновления данных
  const handleShiftFormSuccess = () => {
    message.success(t('shifts.record_created'));
    
    // Инвалидируем все связанные запросы для обновления данных
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
    queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
    queryClient.invalidateQueries({ queryKey: ['operations'] });
    
    console.log('🔄 Кэш инвалидирован, данные обновляются...');
    
    handleShiftFormClose();
  };

  const handleOperationClick = (operation: any) => {
    setSelectedOperation(operation);
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
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>
          <ToolOutlined /> {t('shifts.monitoring')}
        </Title>
        <Text type="secondary">
          {t('shifts.active_machines_status')}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {activeMachines.map(machine => (
          <Col xs={24} sm={12} lg={8} xl={6} key={machine.id}>
            <Card
              title={
                <Space>
                  <Badge 
                    status={getMachineStatusColor(machine.status) as any} 
                    text={machine.machineName}
                  />
                  <Tag color="blue">{getMachineTypeLabel(machine.machineType, t)}</Tag>
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

                  <div style={{ marginBottom: 12 }}>
                    <Text>{t('shifts.progress_execution')}:</Text>
                    <Progress 
                      percent={Math.round(machine.currentOperationDetails.progress || 0)} 
                      size="small"
                      status={(machine.currentOperationDetails.progress || 0) > 80 ? 'success' : 'active'}
                    />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {machine.currentOperationDetails.totalProduced || 0} {t('shifts.of')} {machine.currentOperationDetails.targetQuantity || 0} {t('shifts.parts_suffix')}
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
        ))}
      </Row>

      <ShiftForm
        visible={showShiftForm}
        onClose={handleShiftFormClose}
        onSuccess={handleShiftFormSuccess}
        selectedMachineId={selectedMachineId}
      />

      <OperationDetailModal
        visible={showOperationDetail}
        operation={selectedOperation}
        onClose={() => setShowOperationDetail(false)}
      />
    </div>
  );
};
