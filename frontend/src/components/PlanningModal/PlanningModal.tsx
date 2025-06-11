/**
 * @file: PlanningModal.tsx
 * @description: Модальное окно планирования для выбранного станка
 * @dependencies: antd, planningApi, MachineAvailability
 * @created: 2025-06-07
 */
import React, { useState } from 'react';
import {
  Modal,
  Card,
  Typography,
  Row,
  Col,
  Space,
  Alert,
  Spin,
  Button,
  Tag,
  Statistic,
  List,
  Steps,
  Result,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,

} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { planningApi } from '../../services/planningApi';
import { machinesApi } from '../../services/machinesApi';
import { MachineAvailability } from '../../types/machine.types';

const { Title, Text } = Typography;

interface PlanningResult {
  selectedOrders: any[];
  operationsQueue: any[];
  totalTime: number;
  calculationDate: string;
}

interface PlanningModalProps {
  visible: boolean;
  onCancel: () => void;
  selectedMachine: MachineAvailability | null;
}

const PlanningModal: React.FC<PlanningModalProps> = ({
  visible,
  onCancel,
  selectedMachine,
}) => {
  console.log('🎯 PlanningModal render:', { visible, selectedMachine: selectedMachine?.machineName });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [planningResult, setPlanningResult] = useState<PlanningResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOperationModal, setShowOperationModal] = useState(false);

  console.log('🎯 Current state:', { currentStep, planningResult: !!planningResult, showResultModal });

  // Загрузка списка станков для получения полной информации
  useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
  });

  // Мутация для запуска планирования
  const planningMutation = useMutation({
    mutationFn: planningApi.planProduction,
    onSuccess: (result) => {
      setPlanningResult(result);
      setCurrentStep(2);
      setShowResultModal(true);
    },
    onError: (error) => {
      console.error('Ошибка планирования:', error);
    },
  });

  // Мутация для демо планирования
  const demoMutation = useMutation({
    mutationFn: planningApi.demoPlanning,
    onSuccess: (result) => {
      setPlanningResult(result.result);
      setCurrentStep(2);
      setShowResultModal(true);
    },
    onError: (error) => {
      console.error('Ошибка демо планирования:', error);
    },
  });

  const handleStartPlanning = () => {
    if (!selectedMachine) return;

    setCurrentStep(1);
    const machineIds = [parseInt(selectedMachine.id, 10)];
    planningMutation.mutate({
      selectedMachines: machineIds,
      excelData: null,
    });
  };

  const handleDemoPlanning = () => {
    setCurrentStep(1);
    demoMutation.mutate();
  };

  const handleOperationClick = (operation: any, order: any) => {
    setSelectedOperation(operation);
    setSelectedOrder(order);
    setShowOperationModal(true);
  };

  const handleAssignOperation = async () => {
    if (!selectedOperation) return;
    
    try {
      const result = await planningApi.assignOperation(
        selectedOperation.operationId, 
        selectedOperation.machineId
      );
      
      if (result.success) {
        Modal.success({
          title: 'Операция назначена',
          content: result.message,
        });
        
        setShowOperationModal(false);
      } else {
        Modal.error({
          title: 'Ошибка назначения',
          content: result.error || 'Не удалось назначить операцию',
        });
      }
      
    } catch (error) {
      console.error('Ошибка при назначении операции:', error);
      Modal.error({
        title: 'Ошибка сети',
        content: 'Не удалось связаться с сервером',
      });
    }
  };

  const formatTime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0 мин';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} мин`;
    } else if (remainingMinutes === 0) {
      return `${hours} ч`;
    } else {
      return `${hours} ч ${remainingMinutes} мин`;
    }
  };

  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'MILLING':
        return '#1890ff';
      case 'TURNING':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'TURNING':
        return <ToolOutlined rotate={90} />;
      default:
        return <ToolOutlined />;
    }
  };

  const steps = [
    {
      title: 'Выбранный станок',
      description: 'Информация о станке для планирования',
      icon: <ToolOutlined />,
    },
    {
      title: 'Планирование',
      description: 'Выполнение алгоритма планирования операций',
      icon: <PlayCircleOutlined />,
    },
    {
      title: 'Результаты',
      description: 'Просмотр результатов планирования',
      icon: <CheckCircleOutlined />,
    },
  ];

  const handleClose = () => {
    setCurrentStep(0);
    setPlanningResult(null);
    setShowResultModal(false);
    setSelectedOperation(null);
    setSelectedOrder(null);
    setShowOperationModal(false);
    onCancel();
  };

  // Сбрасываем состояние при открытии модального окна
  React.useEffect(() => {
    if (visible && selectedMachine) {
      console.log('🔄 Модальное окно открылось, сбрасываем состояние');
      console.log('🔄 Current step before reset:', currentStep);
      console.log('🔄 Planning result before reset:', planningResult);
      setCurrentStep(0);
      setPlanningResult(null);
      setShowResultModal(false);
      console.log('🔄 State reset completed');
    }
  }, [visible, selectedMachine, currentStep, planningResult]);

  if (!selectedMachine) {
    console.log('🚫 PlanningModal: No selectedMachine, returning null');
    return null;
  }

  const machineTypeColor = getMachineTypeColor(selectedMachine.machineType);

  console.log('✅ PlanningModal: Rendering modal with machine:', selectedMachine.machineName);

  return (
    <>
      <Modal
        title={
          <Space>
            <span style={{ color: machineTypeColor, fontSize: '18px' }}>
              {getMachineIcon(selectedMachine.machineType)}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Планирование для станка "{selectedMachine.machineName}"
            </span>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        width={800}
        style={{ borderRadius: '12px' }}
        footer={null}
      >
        <Steps 
          current={currentStep} 
          items={steps} 
          style={{ marginBottom: 32 }}
          size="default"
        />

        {currentStep === 0 && (
          <>
            <Alert
              message="Станок выбран для планирования"
              description={`Станок "${selectedMachine.machineName}" отмечен как свободный и готов для планирования операций.`}
              type="success"
              showIcon
              style={{ marginBottom: 24, borderRadius: '8px' }}
            />

            <Card
              style={{ 
                marginBottom: 24,
                borderColor: machineTypeColor,
                borderRadius: '12px',
                backgroundColor: `${machineTypeColor}08`
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Card 
                    size="small" 
                    style={{ 
                      backgroundColor: `${machineTypeColor}15`,
                      borderColor: machineTypeColor,
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ color: machineTypeColor, fontSize: '32px', marginBottom: '12px' }}>
                      {getMachineIcon(selectedMachine.machineType)}
                    </div>
                    <Title level={4} style={{ color: machineTypeColor, marginBottom: '8px' }}>
                      {selectedMachine.machineName}
                    </Title>
                    <Tag 
                      color={selectedMachine.machineType === 'MILLING' ? 'blue' : 'green'}
                      style={{ borderRadius: '16px', padding: '4px 12px' }}
                    >
                      {selectedMachine.machineType === 'MILLING' ? 'Фрезерный' : 'Токарный'}
                    </Tag>
                  </Card>
                </Col>
                <Col span={12}>
                  <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong style={{ fontSize: '16px' }}>Статус: </Text>
                      <Tag color="green" style={{ borderRadius: '12px' }}>
                        <CheckCircleOutlined /> Свободен
                      </Tag>
                    </div>
                    {selectedMachine.lastFreedAt && (
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Последнее освобождение:</Text>
                        <div style={{ marginTop: '4px' }}>
                          <Text type="secondary">
                            <ClockCircleOutlined style={{ marginRight: '4px' }} />
                            {new Date(selectedMachine.lastFreedAt).toLocaleString('ru-RU')}
                          </Text>
                        </div>
                      </div>
                    )}
                    <div>
                      <Text strong>Готов к планированию:</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag color="green" style={{ borderRadius: '12px' }}>
                          <CheckCircleOutlined /> Да
                        </Tag>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Alert
              message="Информация о планировании"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Реальное планирование:</strong> Система автоматически выберет 3 заказа 
                    с разными приоритетами и составит оптимальную очередь операций для выбранного станка.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Демо планирование:</strong> Использует тестовые данные для демонстрации работы алгоритма.
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 32, borderRadius: '8px' }}
            />

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartPlanning}
                  loading={planningMutation.isPending}
                  style={{ 
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    minWidth: '240px',
                    backgroundColor: machineTypeColor,
                    borderColor: machineTypeColor,
                  }}
                >
                  Запустить планирование
                </Button>

                <Button
                  size="large"
                  icon={<InfoCircleOutlined />}
                  onClick={handleDemoPlanning}
                  loading={demoMutation.isPending}
                  style={{ 
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    minWidth: '200px'
                  }}
                >
                  Демо планирование
                </Button>
              </Space>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <div style={{ textAlign: 'center', padding: '80px 50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 24 }}>
              <Title level={3} style={{ marginBottom: '8px' }}>Выполняется планирование...</Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Анализ заказов, операций и составление оптимальной очереди для станка "{selectedMachine.machineName}"
              </Text>
            </div>
          </div>
        )}

        {currentStep === 2 && planningResult && (
          <Result
            status="success"
            title="Планирование успешно завершено"
            subTitle={`Обработано ${planningResult.selectedOrders.length} заказов, ${planningResult.operationsQueue.length} операций`}
            extra={[
              <Button 
                type="primary" 
                key="view"
                size="large"
                onClick={() => setShowResultModal(true)}
                style={{ borderRadius: '8px', backgroundColor: machineTypeColor, borderColor: machineTypeColor }}
              >
                Просмотреть детали
              </Button>,
              <Button 
                key="restart"
                size="large"
                onClick={() => setCurrentStep(0)}
                style={{ borderRadius: '8px' }}
              >
                Новое планирование
              </Button>,
            ]}
          >
            <div style={{ marginBottom: 24 }}>
              <Card style={{ borderRadius: '8px', backgroundColor: '#f6ffed' }}>
                <Statistic
                  title="Общее время выполнения"
                  value={formatTime(planningResult.totalTime)}
                  valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                  prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Card>
            </div>
          </Result>
        )}
      </Modal>

      {/* Модальное окно с результатами */}
      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Результаты планирования</span>}
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        width={900}
        style={{ borderRadius: '12px' }}
        footer={[
          <Button 
            key="close" 
            size="large"
            onClick={() => setShowResultModal(false)}
            style={{ borderRadius: '8px' }}
          >
            Закрыть
          </Button>
        ]}
      >
        {planningResult && (
          <div>
            <Row gutter={24} style={{ marginBottom: 32 }}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
                  <Statistic
                    title="Заказов"
                    value={planningResult.selectedOrders.length}
                    prefix={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
                  <Statistic
                    title="Операций"
                    value={planningResult.operationsQueue.length}
                    prefix={<ToolOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
                  <Statistic
                    title="Общее время"
                    value={formatTime(planningResult.totalTime)}
                    prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Title level={4} style={{ marginBottom: '20px', color: '#262626' }}>
              📋 Очередь операций для станка "{selectedMachine.machineName}"
            </Title>
            
            {planningResult.operationsQueue && planningResult.operationsQueue.length > 0 ? (
              <List
                dataSource={planningResult.operationsQueue}
                renderItem={(operation, index) => {
                  const order = planningResult.selectedOrders.find(o => o.id === operation.orderId);
                  const drawingNumber = order?.drawingNumber || `Заказ #${operation.orderId}`;
                  
                  return (
                    <List.Item 
                      style={{ 
                        cursor: 'pointer',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        border: '1px solid #f0f0f0',
                        background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                      onClick={() => handleOperationClick(operation, order)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f6ffed';
                        e.currentTarget.style.borderColor = '#52c41a';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(82, 196, 26, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#f0f0f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            {index + 1}
                          </div>
                        }
                        title={
                          <Space wrap>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#262626' }}>
                              Чертеж {drawingNumber}
                            </span>
                            <Tag 
                              color="blue" 
                              style={{ 
                                borderRadius: '16px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              Операция {operation.operationNumber || operation.operationId}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div style={{ marginTop: '8px' }}>
                            <Space wrap size={[8, 8]}>
                              <Tag color="green" style={{ borderRadius: '16px', padding: '4px 12px', fontSize: '12px' }}>
                                🎯 Приоритет {operation.priority}
                              </Tag>
                              <Tag color="orange" style={{ borderRadius: '16px', padding: '4px 12px', fontSize: '12px' }}>
                                ⏱️ {formatTime(operation.estimatedTime)}
                              </Tag>
                              <Tag color="purple" style={{ borderRadius: '16px', padding: '4px 12px', fontSize: '12px' }}>
                                🏭 {selectedMachine.machineName}
                              </Tag>
                            </Space>
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                                💡 Нажмите для деталей и назначения
                              </Text>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Alert
                message="Нет операций для планирования"
                description={
                  <div>
                    <p style={{ marginBottom: '8px' }}>
                      Для станка "{selectedMachine.machineName}" не найдено подходящих операций.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Возможные причины:</strong> отсутствие заказов с подходящими операциями или все операции уже назначены.
                    </p>
                  </div>
                }
                type="info"
                showIcon
                style={{ 
                  borderRadius: '8px',
                  backgroundColor: '#f6ffed',
                  borderColor: '#b7eb8f'
                }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно с деталями операции */}
      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Детали операции и назначение</span>}
        open={showOperationModal}
        onCancel={() => setShowOperationModal(false)}
        width={800}
        style={{ borderRadius: '12px' }}
        footer={[
          <Button 
            key="cancel" 
            size="large"
            onClick={() => setShowOperationModal(false)}
            style={{ borderRadius: '8px' }}
          >
            Отмена
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            size="large"
            onClick={handleAssignOperation}
            style={{ borderRadius: '8px' }}
          >
            Назначить в работу
          </Button>
        ]}
      >
        {selectedOperation && selectedOrder && (
          <div>
            <Row gutter={24} style={{ marginBottom: 32 }}>
              <Col span={12}>
                <Card 
                  size="small" 
                  title="Информация о заказе"
                  style={{ borderRadius: '8px', height: '100%' }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <strong>Номер чертежа:</strong> 
                    <span style={{ marginLeft: '8px', color: '#1890ff', fontWeight: '500' }}>
                      {selectedOrder.drawingNumber}
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Приоритет:</strong> 
                    <Tag 
                      color={selectedOrder.priority === 1 ? 'red' : selectedOrder.priority === 2 ? 'orange' : 'green'}
                      style={{ marginLeft: '8px', borderRadius: '12px' }}
                    >
                      {selectedOrder.priority}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Количество:</strong> 
                    <span style={{ marginLeft: '8px', fontWeight: '500' }}>{selectedOrder.quantity} шт.</span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Срок:</strong> 
                    <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                      {new Date(selectedOrder.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {selectedOrder.workType && (
                    <div>
                      <strong>Тип работ:</strong> 
                      <span style={{ marginLeft: '8px', fontWeight: '500' }}>{selectedOrder.workType}</span>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  title="Детали операции"
                  style={{ borderRadius: '8px', height: '100%' }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <strong>Номер операции:</strong> 
                    <span style={{ marginLeft: '8px', color: '#722ed1', fontWeight: '500' }}>
                      {selectedOperation.operationNumber || selectedOperation.operationId}
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Тип операции:</strong> 
                    <Tag color="blue" style={{ marginLeft: '8px', borderRadius: '12px' }}>
                      {selectedOperation.operationType}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Время выполнения:</strong> 
                    <span style={{ marginLeft: '8px', color: '#52c41a', fontWeight: '500' }}>
                      {formatTime(selectedOperation.estimatedTime)}
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Количество осей:</strong> 
                    <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                      {selectedOperation.machineAxes || 'Не указано'}
                    </span>
                  </div>
                  <div>
                    <strong>Назначенный станок:</strong> 
                    <Tag color="purple" style={{ marginLeft: '8px', borderRadius: '12px' }}>
                      {selectedMachine.machineName}
                    </Tag>
                  </div>
                </Card>
              </Col>
            </Row>

            <Alert
              message="Подтверждение назначения"
              description={
                <div>
                  После нажатия "Назначить в работу" операция{' '}
                  <strong>{selectedOperation.operationNumber || selectedOperation.operationId}</strong>{' '}
                  будет назначена на станок <strong>{selectedMachine.machineName}</strong> для выполнения.
                </div>
              }
              type="info"
              showIcon
              style={{ borderRadius: '8px' }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default PlanningModal;