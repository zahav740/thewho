/**
 * @file: OperationCompletionNotification.tsx
 * @description: Система уведомлений о завершении операций с интеграцией планирования
 * @dependencies: antd, react-query, PlanningModal
 * @created: 2025-06-12
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Card,
  Progress,
  Tag,
  Alert,
  Statistic,
  Row,
  Col,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PlanningModal from '../PlanningModal/PlanningModal';

const { Title, Text } = Typography;

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

interface OperationCompletionNotificationProps {
  completedOperations: CompletionCheckResult[];
  onClearNotifications: () => void;
  machines?: any[]; // Для интеграции с планированием
}

export type { OperationCompletionNotificationProps };

// API функции
const completionApi = {
  handleCompletion: async (operationId: number, action: 'close' | 'continue' | 'plan', completedQuantity: number) => {
    const response = await fetch('/api/operations/completion/handle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationId,
        action,
        completedQuantity
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка при обработке завершения');
    return data;
  }
};

const OperationCompletionNotification: React.FC<OperationCompletionNotificationProps> = ({
  completedOperations,
  onClearNotifications,
  machines = []
}) => {
  const queryClient = useQueryClient();
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [planningModalVisible, setPlanningModalVisible] = useState(false);
  const [selectedMachineForPlanning, setSelectedMachineForPlanning] = useState<any>(null);

  // Мутация для обработки завершения
  const handleCompletionMutation = useMutation({
    mutationFn: ({ operationId, action, completedQuantity }: any) =>
      completionApi.handleCompletion(operationId, action, completedQuantity),
    onSuccess: (data, variables) => {
      message.success(data.message);
      
      // Обновляем ВСЕ связанные данные
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machines-with-progress'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['active-operations'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'in-progress'] });
      queryClient.invalidateQueries({ queryKey: ['shift-records'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      
      // Принудительно обновляем все кэши
      queryClient.refetchQueries({ queryKey: ['machines'] });
      queryClient.refetchQueries({ queryKey: ['operations'] });
      queryClient.refetchQueries({ queryKey: ['shifts'] });
      
      console.log('🔄 Полное обновление данных после завершения операции');

      // Если нужно открыть планирование
      if (data.shouldOpenPlanning && data.machineId) {
        const machine = machines.find(m => m.id === data.machineId || m.id === data.machineId.toString());
        if (machine) {
          setSelectedMachineForPlanning(machine);
          setPlanningModalVisible(true);
        }
      }

      // Переходим к следующему уведомлению или закрываем
      handleNextNotification();
    },
    onError: (error: any) => {
      message.error(`Ошибка: ${error.message}`);
    }
  });

  const currentOperation = completedOperations[currentNotificationIndex];
  const hasNotifications = completedOperations.length > 0;

  const handleNextNotification = () => {
    if (currentNotificationIndex < completedOperations.length - 1) {
      setCurrentNotificationIndex(currentNotificationIndex + 1);
    } else {
      // Все уведомления просмотрены
      onClearNotifications();
      setCurrentNotificationIndex(0);
    }
  };

  const handleAction = (action: 'close' | 'continue' | 'plan') => {
    if (!currentOperation) return;
    
    handleCompletionMutation.mutate({
      operationId: currentOperation.operationId,
      action,
      completedQuantity: currentOperation.completedQuantity
    });
  };

  // Сброс индекса при изменении списка уведомлений
  useEffect(() => {
    if (completedOperations.length === 0) {
      setCurrentNotificationIndex(0);
    }
  }, [completedOperations.length]);

  if (!hasNotifications) {
    return null;
  }

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'MILLING': return '#1890ff';
      case 'TURNING': return '#52c41a';
      default: return '#722ed1';
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'MILLING': return 'Фрезерная';
      case 'TURNING': return 'Токарная';
      default: return type;
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Операция выполнена! ({currentNotificationIndex + 1} из {completedOperations.length})
            </span>
          </Space>
        }
        open={hasNotifications}
        onCancel={() => {
          onClearNotifications();
          setCurrentNotificationIndex(0);
        }}
        width={700}
        style={{ borderRadius: '12px' }}
        footer={null}
        closable={true}
        maskClosable={false}
      >
        {currentOperation && (
          <div>
            {/* Информационная карточка */}
            <Alert
              message="🎉 Операция достигла планового количества!"
              description={`Накопленное количество составляет ${currentOperation.completedQuantity} из ${currentOperation.plannedQuantity} деталей. Выберите дальнейшее действие.`}
              type="success"
              showIcon
              style={{ marginBottom: 24, borderRadius: '8px' }}
            />

            {/* Детали операции */}
            <Card
              style={{ 
                marginBottom: 24,
                borderColor: getOperationTypeColor(currentOperation.operationInfo.operationType),
                borderWidth: 2,
                borderRadius: '12px'
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Card 
                    size="small" 
                    title={<Space><FileTextOutlined />Заказ</Space>}
                    style={{ height: '100%', borderRadius: '8px' }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>Чертеж:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                          {currentOperation.orderInfo.drawingNumber}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text strong>Плановое количество:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                          {currentOperation.orderInfo.quantity} шт.
                        </Tag>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card 
                    size="small" 
                    title={<Space><ToolOutlined />Операция</Space>}
                    style={{ height: '100%', borderRadius: '8px' }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>Номер операции:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag 
                          color={getOperationTypeColor(currentOperation.operationInfo.operationType)}
                          style={{ fontSize: '14px', padding: '4px 8px' }}
                        >
                          #{currentOperation.operationInfo.operationNumber}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <Text strong>Тип операции:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {getOperationTypeText(currentOperation.operationInfo.operationType)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Прогресс выполнения */}
            <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
              <Row gutter={24} align="middle">
                <Col span={16}>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      Прогресс выполнения
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={currentOperation.progress}
                        size="default"
                        status="success"
                        format={(percent) => `${currentOperation.completedQuantity}/${currentOperation.plannedQuantity}`}
                      />
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Выполнено"
                    value={currentOperation.completedQuantity}
                    suffix={`/ ${currentOperation.plannedQuantity}`}
                    valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Объяснение действий */}
            <Card 
              title="Выберите действие:"
              style={{ marginBottom: 24, borderRadius: '8px' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  description={
                    <div>
                      <p><strong>🔒 Закрыть:</strong> Завершить операцию и сохранить результат в архиве. Накопленные данные смен будут обнулены.</p>
                      <p><strong>▶️ Продолжить:</strong> Продолжить накопление деталей сверх планового количества.</p>
                      <p><strong>📋 Спланировать:</strong> Закрыть текущую операцию и открыть окно планирования для выбора новой операции.</p>
                    </div>
                  }
                  showIcon={false}
                  style={{ borderRadius: '8px' }}
                />
              </Space>
            </Card>

            {/* Кнопки действий */}
            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAction('close')}
                  loading={handleCompletionMutation.isPending}
                  style={{ 
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    borderRadius: '8px',
                    minWidth: '140px'
                  }}
                >
                  Закрыть
                </Button>

                <Button
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleAction('continue')}
                  loading={handleCompletionMutation.isPending}
                  style={{ 
                    borderRadius: '8px',
                    minWidth: '140px'
                  }}
                >
                  Продолжить
                </Button>

                <Button
                  type="default"
                  size="large"
                  icon={<SettingOutlined />}
                  onClick={() => handleAction('plan')}
                  loading={handleCompletionMutation.isPending}
                  style={{ 
                    backgroundColor: '#722ed1',
                    borderColor: '#722ed1',
                    color: 'white',
                    borderRadius: '8px',
                    minWidth: '140px'
                  }}
                >
                  Спланировать
                </Button>
              </Space>
            </div>

            {/* Индикатор количества уведомлений */}
            {completedOperations.length > 1 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Осталось уведомлений: {completedOperations.length - currentNotificationIndex - 1}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Интеграция с модальным окном планирования */}
      <PlanningModal
        visible={planningModalVisible}
        onCancel={() => {
          setPlanningModalVisible(false);
          setSelectedMachineForPlanning(null);
        }}
        selectedMachine={selectedMachineForPlanning}
      />
    </>
  );
};

export default OperationCompletionNotification;
