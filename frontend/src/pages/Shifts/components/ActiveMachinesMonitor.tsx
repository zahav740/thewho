/**
 * @file: ActiveMachinesMonitor.tsx
 * @description: Компонент мониторинга активных станков и выполнения заказов
 * @dependencies: antd, react-query, machinesApi, operationsApi
 * @created: 2025-06-07
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
import { useQuery } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { operationsApi } from '../../../services/operationsApi';
import { OperationStatus } from '../../../types/operation.types';
import { ShiftForm } from './ShiftForm';

const { Title, Text } = Typography;

interface ActiveMachine {
  id: string;
  name: string;
  type: string;
  status: 'working' | 'setup' | 'idle' | 'maintenance';
  currentOperation?: {
    id: number;
    operationNumber: number;
    orderDrawingNumber: string;
    operationType: string;
    estimatedTime: number;
    progress: number;
    startedAt?: string;
    operator?: string;
  };
  todayProduction?: {
    dayShift: { quantity: number; operator: string };
    nightShift: { quantity: number; operator: string };
    totalTime: number;
  };
}

export const ActiveMachinesMonitor: React.FC = () => {
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>();
  const [showShiftForm, setShowShiftForm] = useState(false);

  // Загружаем список станков
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
  });

  // Загружаем активные операции
  const { data: activeOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['operations', 'in-progress'],
    queryFn: () => operationsApi.getAll(OperationStatus.IN_PROGRESS),
  });

  const isLoading = machinesLoading || operationsLoading;

  // Объединяем данные станков с активными операциями
  const activeMachines: ActiveMachine[] = React.useMemo(() => {
    if (!machines || !activeOperations) return [];

    return machines
      .filter(machine => machine.isAvailable)
      .map(machine => {
        // Находим назначенную операцию для станка
        const assignedOperation = activeOperations.find(
          op => op.machineId === Number(machine.id)
        );

        const machineData: ActiveMachine = {
          id: machine.id,
          name: machine.machineName || `Станок-${machine.id}`,
          type: getMachineTypeLabel(machine.machineType),
          status: assignedOperation ? 'working' : 'idle',
        };

        if (assignedOperation) {
          machineData.currentOperation = {
            id: assignedOperation.id,
            operationNumber: assignedOperation.operationNumber,
            orderDrawingNumber: assignedOperation.orderDrawingNumber || 'Не указан',
            operationType: assignedOperation.operationType || 'Не указан',
            estimatedTime: assignedOperation.estimatedTime || 0,
            progress: Math.random() * 100, // Временно случайный прогресс
            startedAt: assignedOperation.createdAt,
          };
        }

        // Временные данные о производстве за сегодня
        machineData.todayProduction = {
          dayShift: { quantity: Math.floor(Math.random() * 50), operator: 'Иванов И.И.' },
          nightShift: { quantity: Math.floor(Math.random() * 40), operator: 'Аркадий' },
          totalTime: Math.floor(Math.random() * 480), // минуты
        };

        return machineData;
      });
  }, [machines, activeOperations]);

  const handleCreateShiftRecord = (machineId: string) => {
    setSelectedMachineId(machineId);
    setShowShiftForm(true);
  };

  const handleShiftFormClose = () => {
    setShowShiftForm(false);
    setSelectedMachineId(undefined);
  };

  const handleShiftFormSuccess = () => {
    message.success('Запись смены создана успешно');
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

  if (activeMachines.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>
            Нет активных станков.<br />
            Проверьте настройки станков и назначенные операции.
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
                    text={machine.name}
                  />
                  <Tag color="blue">{machine.type}</Tag>
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
              {machine.currentOperation ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>Текущая операция:</Text>
                    <br />
                    <Text>Операция {machine.currentOperation.operationNumber}</Text>
                    <br />
                    <Text type="secondary">
                      Чертёж: {machine.currentOperation.orderDrawingNumber}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>Прогресс выполнения:</Text>
                    <Progress 
                      percent={Math.round(machine.currentOperation.progress)} 
                      size="small"
                      status={machine.currentOperation.progress > 80 ? 'success' : 'active'}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text>
                      <ClockCircleOutlined /> Время: {machine.currentOperation.estimatedTime}мин
                    </Text>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <Text strong>Производство сегодня:</Text>
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
        // Если у нас есть выбранный станок, передаем его ID для предзаполнения
        selectedMachineId={selectedMachineId ? Number(selectedMachineId) : undefined}
      />
    </div>
  );
};

// Утилитарная функция для получения названия типа станка
const getMachineTypeLabel = (type: string): string => {
  if (!type) return 'Станок';
  
  const lowerType = type.toLowerCase();
  if (lowerType.includes('milling') || lowerType.includes('фрез')) {
    return 'Фрезерный';
  } else if (lowerType.includes('turning') || lowerType.includes('токар')) {
    return 'Токарный';
  } else if (lowerType.includes('drilling') || lowerType.includes('сверл')) {
    return 'Сверлильный';
  }
  
  return 'Станок';
};
