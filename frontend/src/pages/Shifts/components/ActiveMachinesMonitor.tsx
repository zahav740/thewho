/**
 * @file: ActiveMachinesMonitor.tsx
 * @description: Компонент мониторинга активных станков (ИСПРАВЛЕН - фильтрация по операции)
 * @dependencies: antd, react-query, machinesApi, operationsApi
 * @created: 2025-06-07
 * @fixed: 2025-06-07 - Исправлена фильтрация данных по текущей операции станка
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
  PlayCircleOutlined,
  PauseCircleOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { operationsApi } from '../../../services/operationsApi';
import { shiftsApi } from '../../../services/shiftsApi';
import { OperationStatus } from '../../../types/operation.types';
import { MachineAvailability } from '../../../types/machine.types';
import { ShiftForm } from './ShiftForm';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Расширенный тип для текущих деталей операции с прогрессом
interface ExtendedOperationDetails {
  id: number;
  operationNumber: number;
  operationType: string;
  estimatedTime: number;
  orderId: number;
  orderDrawingNumber: string;
  progress?: number; // Добавляем поле прогресса
}

// Тип активного станка без наследования для избежания конфликтов
interface ActiveMachine {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  currentOperationDetails?: ExtendedOperationDetails; // Используем расширенный тип
  lastFreedAt?: Date | string; // Гибкий тип
  createdAt: string;
  updatedAt: string;
  status: 'working' | 'setup' | 'idle' | 'maintenance';
  todayProduction?: {
    dayShift: { quantity: number; operator: string };
    nightShift: { quantity: number; operator: string };
    totalTime: number;
    currentOperationOnly: boolean; // Флаг что данные только по текущей операции
  };
}

// Утилитарная функция для получения названия типа станка
const getMachineTypeLabel = (type: string): string => {
  if (!type) return 'Станок';
  
  const upperType = type.toUpperCase();
  if (upperType.includes('MILLING')) {
    return 'Фрезерный';
  } else if (upperType.includes('TURNING')) {
    return 'Токарный';
  } else if (upperType.includes('DRILLING')) {
    return 'Сверлильный';
  } else if (upperType.includes('GRINDING')) {
    return 'Шлифовальный';
  }
  
  return 'Станок';
};

export const ActiveMachinesMonitor: React.FC = () => {
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>();
  const [showShiftForm, setShowShiftForm] = useState(false);
  
  // ИСПРАВЛЕНО: Добавлен useQueryClient для инвалидации кэша
  const queryClient = useQueryClient();

  // Загружаем список станков (используем основной API)
  const { data: machines, isLoading: machinesLoading, error: machinesError, refetch: refetchMachines } = useQuery({
    queryKey: ['machines-availability'],
    queryFn: machinesApi.getAll,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  // Загружаем активные операции
  const { data: activeOperations, isLoading: operationsLoading, refetch: refetchOperations } = useQuery({
    queryKey: ['operations', 'in-progress'],
    queryFn: () => operationsApi.getAll(OperationStatus.IN_PROGRESS),
    refetchInterval: 30000,
  });

  // Загружаем сегодняшние смены
  const { data: todayShifts, isLoading: shiftsLoading, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftsApi.getAll({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  const isLoading = machinesLoading || operationsLoading || shiftsLoading;

  // Вычисляем прогресс операции на основе реальных данных смен
  const calculateProgress = React.useCallback((operation: any, shifts: any[]): number => {
    if (!operation || !shifts.length) return 0;
    
    const totalProduced = shifts.reduce((sum, shift) => 
      sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
    );
    
    // Предполагаем, что общее количество деталей в заказе - это то количество, которое нужно произвести
    // Это упрощение, в реальности нужно получать данные о заказе
    const targetQuantity = operation.order?.quantity || 100; // fallback значение
    
    return Math.min((totalProduced / targetQuantity) * 100, 100);
  }, []);

  // ИСПРАВЛЕНО: Объединяем данные с фильтрацией по текущей операции
  const activeMachines: ActiveMachine[] = React.useMemo(() => {
    if (!machines) return [];

    console.log('🔄 Пересчитываем данные станков...');
    console.log('Всего станков:', machines.length);
    console.log('Всего смен сегодня:', todayShifts?.length || 0);

    return machines.map(machine => {
      console.log(`\n--- Обрабатываем станок ${machine.machineName} (ID: ${machine.id}) ---`);
      
      // Находим назначенную операцию для станка
      const assignedOperation = activeOperations?.find(
        op => op.machineId === parseInt(machine.id)
      );

      // ИСПРАВЛЕНО: Фильтрация смен по станку И по текущей операции
      let machineShifts = todayShifts?.filter(
        shift => shift.machineId === parseInt(machine.id)
      ) || [];

      console.log(`Всего смен для станка: ${machineShifts.length}`);

      // Если у станка есть текущая операция, фильтруем смены только по ней
      let currentOperationShifts = machineShifts;
      let showingCurrentOperationOnly = false;
      
      if (machine.currentOperationDetails?.id) {
        console.log(`Фильтруем по текущей операции ID: ${machine.currentOperationDetails.id}`);
        currentOperationShifts = machineShifts.filter(
          shift => shift.operationId === machine.currentOperationDetails?.id
        );
        showingCurrentOperationOnly = currentOperationShifts.length > 0;
        console.log(`Смен по текущей операции: ${currentOperationShifts.length}`);
      }

      // Если по текущей операции нет данных, показываем все смены станка
      const shiftsToUse = currentOperationShifts.length > 0 ? currentOperationShifts : machineShifts;
      
      console.log(`Используем смен для расчета: ${shiftsToUse.length}`);

      // Вычисляем производство за сегодня на основе отфильтрованных смен
      const todayProduction = shiftsToUse.reduce((acc, shift) => {
        console.log(`  Смена ID ${shift.id}: День=${shift.dayShiftQuantity || 0}, Ночь=${shift.nightShiftQuantity || 0}, Операция=${shift.operationId}`);
        return {
          dayShift: {
            quantity: acc.dayShift.quantity + (shift.dayShiftQuantity || 0),
            operator: shift.dayShiftOperator || acc.dayShift.operator,
          },
          nightShift: {
            quantity: acc.nightShift.quantity + (shift.nightShiftQuantity || 0),
            operator: shift.nightShiftOperator || acc.nightShift.operator,
          },
          totalTime: acc.totalTime + 
            (shift.dayShiftQuantity || 0) * (shift.dayShiftTimePerUnit || 0) +
            (shift.nightShiftQuantity || 0) * (shift.nightShiftTimePerUnit || 0),
        };
      }, {
        dayShift: { quantity: 0, operator: '-' },
        nightShift: { quantity: 0, operator: 'Аркадий' },
        totalTime: 0,
      });

      console.log(`Результат для станка ${machine.machineName}:`, {
        день: todayProduction.dayShift.quantity,
        ночь: todayProduction.nightShift.quantity,
        только_текущая_операция: showingCurrentOperationOnly
      });

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
        todayProduction: {
          ...todayProduction,
          currentOperationOnly: showingCurrentOperationOnly
        },
      };

      // Если есть детали операции из API, добавляем их с прогрессом
      if (machine.currentOperationDetails) {
        machineData.currentOperationDetails = {
          ...machine.currentOperationDetails,
          progress: calculateProgress(assignedOperation, currentOperationShifts),
        };
      }

      return machineData;
    });
  }, [machines, activeOperations, todayShifts, calculateProgress]);

  const handleCreateShiftRecord = (machineId: string) => {
    setSelectedMachineId(parseInt(machineId));
    setShowShiftForm(true);
  };

  const handleShiftFormClose = () => {
    setShowShiftForm(false);
    setSelectedMachineId(undefined);
  };

  // ИСПРАВЛЕНО: Улучшена инвалидация с принудительным обновлением
  const handleShiftFormSuccess = async () => {
    message.success('Запись смены создана успешно');
    
    console.log('🔄 Начинаем обновление данных после создания смены...');
    
    // Инвалидируем все связанные запросы
    await queryClient.invalidateQueries({ queryKey: ['shifts'] });
    await queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
    await queryClient.invalidateQueries({ queryKey: ['operations'] });
    
    // Принудительно обновляем данные
    setTimeout(async () => {
      console.log('🔄 Принудительное обновление через 500мс...');
      await refetchShifts();
      await refetchMachines();
      await refetchOperations();
    }, 500);
    
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

  const getMachineStatusText = (status: string) => {
    switch (status) {
      case 'working': return 'В работе';
      case 'setup': return 'Наладка';
      case 'maintenance': return 'Ремонт';
      default: return 'Простой';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загрузка данных о станках...</Text>
        </div>
      </div>
    );
  }

  if (machinesError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">Ошибка загрузки данных о станках</Text>
      </div>
    );
  }

  if (activeMachines.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>
            Нет активных станков.<br />
            Проверьте настройки станков в базе данных.
          </span>
        }
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>
          <ToolOutlined /> Мониторинг производства
        </Title>
        <Text type="secondary">
          Активные станки и ход выполнения заказов в реальном времени
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
                  <Tag color="blue">{getMachineTypeLabel(machine.machineType)}</Tag>
                </Space>
              }
              extra={
                <Tag color={getMachineStatusColor(machine.status)}>
                  {getMachineStatusText(machine.status)}
                </Tag>
              }
              actions={[
                <Tooltip title="Создать запись смены">
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() => handleCreateShiftRecord(machine.id)}
                  >
                    Запись смены
                  </Button>
                </Tooltip>
              ]}
              size="small"
            >
              {machine.currentOperationDetails ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>Текущая операция:</Text>
                    <br />
                    <Text>Операция {machine.currentOperationDetails.operationNumber}</Text>
                    <br />
                    <Text type="secondary">
                      {machine.currentOperationDetails.orderDrawingNumber}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>Прогресс выполнения:</Text>
                    <Progress 
                      percent={Math.round(machine.currentOperationDetails.progress || 0)} 
                      size="small"
                      status={(machine.currentOperationDetails.progress || 0) > 80 ? 'success' : 'active'}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>
                      <ClockCircleOutlined /> Время: {machine.currentOperationDetails.estimatedTime}мин
                    </Text>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <Text strong>
                      Производство сегодня
                      {machine.todayProduction?.currentOperationOnly && (
                        <Tag color="blue" style={{ marginLeft: 8, fontSize: '11px', padding: '2px 6px', lineHeight: '16px' }}>
                          по текущей операции
                        </Tag>
                      )}:
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                            <Text type="secondary">День</Text>
                            <br />
                            <Text strong style={{ fontSize: '18px' }}>
                              {machine.todayProduction?.dayShift.quantity || 0}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {machine.todayProduction?.dayShift.operator}
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f6f6f6', borderRadius: '4px' }}>
                            <Text type="secondary">Ночь</Text>
                            <br />
                            <Text strong style={{ fontSize: '18px' }}>
                              {machine.todayProduction?.nightShift.quantity || 0}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {machine.todayProduction?.nightShift.operator}
                            </Text>
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
                    <Text type="secondary">Станок простаивает</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Нет назначенных операций
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
    </div>
  );
};
