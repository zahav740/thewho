/**
 * @file: ActiveMachinesMonitor.tsx
 * @description: Улучшенный монитор станков с реальным прогрессом (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @dependencies: antd, react-query, recharts
 * @created: 2025-06-11
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Progress, 
  Tag, 
  Space, 
  Button, 
  Modal, 
  InputNumber, 
  Form, 
  message,
  Statistic,
  Badge,
  Tooltip,
  Typography,
  notification
} from 'antd';
import { 
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import OperationCompletionNotification from './OperationCompletionNotification';
import { useOperationCompletionCheck } from '../hooks';

const { Text, Title } = Typography;

interface MachineWithProgress {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationDetails?: {
    id: string;
    operationNumber: number;
    operationType: string;
    estimatedTime: number;
    status: string;
    orderDrawingNumber?: string;
    orderId?: string;
  };
  progress?: {
    completedUnits: number;
    totalUnits: number;
    progressPercentage: number;
    startedAt?: string;
    lastUpdated: string;
  };
}

interface ProductionMetrics {
  totalOperations: number;
  completedOperations: number;
  inProgressOperations: number;
  pendingOperations: number;
  averageProgress: number;
  dailyProduction: number;
  machineUtilization: number;
}

// API функции
const progressApi = {
  getMetrics: async (): Promise<ProductionMetrics> => {
    const response = await fetch('/api/progress/metrics');
    const data = await response.json();
    return data.success ? data.data : null;
  },

  getActiveOperations: async (): Promise<any[]> => {
    const response = await fetch('/api/progress/active-operations');
    const data = await response.json();
    return data.success ? data.data : [];
  },

  getDashboard: async () => {
    const response = await fetch('/api/progress/dashboard');
    const data = await response.json();
    return data.success ? data.data : null;
  },

  updateProgress: async (operationId: string, completedUnits: number, totalUnits: number) => {
    const response = await fetch(`/api/progress/operation/${operationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedUnits, totalUnits })
    });
    return await response.json();
  },

  startOperation: async (operationId: string) => {
    const response = await fetch(`/api/progress/operation/${operationId}/start`, {
      method: 'POST'
    });
    return await response.json();
  },

  completeOperation: async (operationId: string) => {
    const response = await fetch(`/api/progress/operation/${operationId}/complete`, {
      method: 'POST'
    });
    return await response.json();
  }
};

const machinesApi = {
  getAll: async (): Promise<MachineWithProgress[]> => {
    const response = await fetch('/api/machines');
    if (!response.ok) throw new Error('Failed to fetch machines');
    return await response.json();
  }
};

export const ActiveMachinesMonitor: React.FC = () => {
  const queryClient = useQueryClient();
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [progressForm] = Form.useForm();

  // Система уведомлений о завершении операций
  const {
    pendingNotifications,
    hasNotifications,
    clearNotifications,
    checkSpecificOperation
  } = useOperationCompletionCheck({
    enabled: true,
    checkInterval: 30000, // Проверяем каждые 30 секунд (уменьшаем частоту)
    onOperationCompleted: (completedOps) => {
      // Показываем системное уведомление
      notification.success({
        message: 'Операция завершена!',
        description: `Операция ${completedOps[0]?.operationInfo.operationNumber} достигла планового количества`,
        placement: 'topRight',
        duration: 4
      });
    }
  });

  // Queries
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines-with-progress'],
    queryFn: machinesApi.getAll,
    refetchInterval: 5000 // Обновляем каждые 5 секунд
  });

  const { data: metrics } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: progressApi.getMetrics,
    refetchInterval: 10000 // Обновляем каждые 10 секунд
  });

  const { data: activeOperations } = useQuery({
    queryKey: ['active-operations'],
    queryFn: progressApi.getActiveOperations,
    refetchInterval: 5000
  });

  // Mutations
  const updateProgressMutation = useMutation({
    mutationFn: ({ operationId, completedUnits, totalUnits }: any) =>
      progressApi.updateProgress(operationId, completedUnits, totalUnits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-with-progress'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['active-operations'] });
      setProgressModalVisible(false);
      message.success('Прогресс обновлен успешно');
    },
    onError: (error) => {
      console.error('Ошибка обновления прогресса:', error);
      message.error('Ошибка при обновлении прогресса');
    }
  });

  const startOperationMutation = useMutation({
    mutationFn: progressApi.startOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-with-progress'] });
      message.success('Операция запущена');
    }
  });

  const completeOperationMutation = useMutation({
    mutationFn: progressApi.completeOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-with-progress'] });
      message.success('Операция завершена');
    }
  });

  // Обработчики
  const handleUpdateProgress = (operation: any) => {
    setSelectedOperation(operation);
    progressForm.setFieldsValue({
      completedUnits: operation.progress?.completedUnits || 0,
      totalUnits: operation.progress?.totalUnits || operation.totalUnits || 1
    });
    setProgressModalVisible(true);
  };

  const handleProgressSubmit = () => {
    progressForm.validateFields().then(values => {
      updateProgressMutation.mutate({
        operationId: selectedOperation.id,
        completedUnits: values.completedUnits,
        totalUnits: values.totalUnits
      });
      
      // Проверяем завершение операции после обновления
      setTimeout(() => {
        checkSpecificOperation(selectedOperation.id);
      }, 1000);
    });
  };

  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'MILLING': return '#1890ff';
      case 'TURNING': return '#52c41a';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'processing';
      case 'ASSIGNED': return 'warning';
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  const getMachineTypeText = (type: string) => {
    switch (type) {
      case 'MILLING': return 'Фрезерный';
      case 'TURNING': return 'Токарный';
      default: return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'В работе';
      case 'ASSIGNED': return 'Назначено';
      case 'COMPLETED': return 'Завершено';
      case 'PENDING': return 'Ожидает';
      default: return status;
    }
  };

  if (machinesLoading) {
    return <Card loading style={{ minHeight: 400 }} />;
  }

  return (
    <div className="machines-monitor">
      {/* Метрики производства */}
      {metrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Загрузка станков"
                value={metrics.machineUtilization}
                suffix="%"
                valueStyle={{ color: metrics.machineUtilization > 75 ? '#3f8600' : '#faad14' }}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Средний прогресс"
                value={metrics.averageProgress}
                suffix="%"
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Операций в работе"
                value={metrics.inProgressOperations}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Произведено сегодня"
                value={metrics.dailyProduction}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Сетка станков */}
      <Row gutter={[16, 16]}>
        {machines?.map((machine) => {
          const operation = machine.currentOperationDetails;
          const progress = activeOperations?.find(op => 
            op.machineName === machine.machineName
          );

          return (
            <Col span={6} key={machine.id}>
              <Card
                size="small"
                style={{
                  borderColor: getMachineTypeColor(machine.machineType),
                  borderWidth: 2,
                  minHeight: 280
                }}
                title={
                  <Space>
                    <Badge 
                      status={machine.isAvailable ? 'success' : 'processing'} 
                      text={machine.machineName}
                    />
                    <Tag color={getMachineTypeColor(machine.machineType)}>
                      {getMachineTypeText(machine.machineType)}
                    </Tag>
                  </Space>
                }
              >
                {operation ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {/* Информация об операции */}
                    <div>
                      <Text strong>Операция #{operation.operationNumber}</Text>
                      <br />
                      <Text type="secondary">{operation.orderDrawingNumber}</Text>
                    </div>

                    {/* Прогресс */}
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text>Прогресс: </Text>
                        <Text strong>
                          {progress?.completedUnits || 0}/{progress?.totalUnits || '?'}
                        </Text>
                      </div>
                      <Progress
                        percent={progress?.progressPercentage || 0}
                        size="small"
                        status={progress?.progressPercentage === 100 ? 'success' : 'active'}
                      />
                    </div>

                    {/* Статус */}
                    <div>
                      <Tag color={getStatusColor(operation.status)}>
                        {getStatusText(operation.status)}
                      </Tag>
                      <Tooltip title="Время выполнения">
                        <Tag icon={<ClockCircleOutlined />}>
                          {operation.estimatedTime}мин
                        </Tag>
                      </Tooltip>
                    </div>

                    {/* Время начала */}
                    {progress?.startedAt && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Начато: {new Date(progress.startedAt).toLocaleTimeString()}
                        </Text>
                      </div>
                    )}

                    {/* Кнопки управления */}
                    <Space size="small" style={{ width: '100%' }}>
                      {operation.status === 'ASSIGNED' && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlayCircleOutlined />}
                          onClick={() => startOperationMutation.mutate(operation.id)}
                          loading={startOperationMutation.isPending}
                          block
                        >
                          Начать
                        </Button>
                      )}
                      
                      {operation.status === 'IN_PROGRESS' && (
                        <>
                          <Button
                            size="small"
                            icon={<WarningOutlined />}
                            onClick={() => handleUpdateProgress(progress || operation)}
                            style={{ flex: 1 }}
                          >
                            Прогресс
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => completeOperationMutation.mutate(operation.id)}
                            loading={completeOperationMutation.isPending}
                            style={{ flex: 1 }}
                          >
                            Завершить
                          </Button>
                        </>
                      )}
                    </Space>
                  </Space>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Badge status="success" text="Свободен" />
                    <br />
                    <Text type="secondary">Ожидает назначения операции</Text>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Модальное окно обновления прогресса */}
      <Modal
        title="Обновление прогресса операции"
        open={progressModalVisible}
        onOk={handleProgressSubmit}
        onCancel={() => setProgressModalVisible(false)}
        confirmLoading={updateProgressMutation.isPending}
      >
        <Form form={progressForm} layout="vertical">
          <Form.Item 
            name="completedUnits" 
            label="Выполнено деталей" 
            rules={[{ required: true, min: 0 }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item 
            name="totalUnits" 
            label="Всего деталей" 
            rules={[{ required: true, min: 1 }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Система уведомлений о завершении операций */}
      <OperationCompletionNotification
        completedOperations={pendingNotifications}
        onClearNotifications={clearNotifications}
        machines={machines || []}
      />
    </div>
  );
};

export default ActiveMachinesMonitor;
