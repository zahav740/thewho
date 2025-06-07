/**
 * @file: ProductionPlanningPage.tsx  
 * @description: Страница планирования производства с выбором станков (ИСПРАВЛЕНО)
 * @dependencies: machinesApi, planningApi
 * @created: 2025-05-28
 * @fixed: 2025-12-07 - JSX исправлен
 * @updated: 2025-06-07 - Исправлена ошибка JSX и улучшен дизайн
 */
import React, { useState } from 'react';
import {
  Card,
  Checkbox,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Alert,
  Spin,
  Result,
  Tag,
  Divider,
  Steps,
  Modal,
  List,
  Statistic,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { machinesApi } from '../../services/machinesApi';
import { planningApi } from '../../services/planningApi';
import { MachineAvailability } from '../../types/machine.types';

const { Title, Text, Paragraph } = Typography;

interface PlanningResult {
  selectedOrders: any[];
  operationsQueue: any[];
  totalTime: number;
  calculationDate: string;
}

const ProductionPlanningPage: React.FC = () => {
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [planningResult, setPlanningResult] = useState<PlanningResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOperationModal, setShowOperationModal] = useState(false);

  // Загрузка списка станков
  const { data: machines, isLoading: machinesLoading, error: machinesError } = useQuery({
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

  const handleMachineSelect = (machineId: string, checked: boolean) => {
    if (checked) {
      setSelectedMachines([...selectedMachines, machineId]);
    } else {
      setSelectedMachines(selectedMachines.filter(id => id !== machineId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && machines) {
      const availableMachines = machines.filter((m: MachineAvailability) => m.isAvailable);
      setSelectedMachines(availableMachines.map((m: MachineAvailability) => m.id));
    } else {
      setSelectedMachines([]);
    }
  };

  const handleStartPlanning = () => {
    if (selectedMachines.length === 0) {
      Modal.warning({
        title: 'Выберите станки',
        content: 'Для планирования необходимо выбрать хотя бы один станок',
      });
      return;
    }

    setCurrentStep(1);
    // Преобразуем string[] в number[] для API
    const machineIds = selectedMachines.map(id => parseInt(id, 10));
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
      // Реальный API вызов для назначения операции
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
        
        // Обновляем список станков чтобы отобразить изменения
        // machinesApi.invalidateQueries(); // Если используете React Query
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

  if (machinesLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Загрузка станков...</div>
      </div>
    );
  }

  if (machinesError) {
    return (
      <Result
        status="error"
        title="Ошибка загрузки"
        subTitle="Не удалось загрузить список станков"
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
        }
      />
    );
  }

  const availableMachines = machines?.filter((m: MachineAvailability) => m.isAvailable) || [];
  const isAllSelected = availableMachines.length > 0 && selectedMachines.length === availableMachines.length;
  const isIndeterminate = selectedMachines.length > 0 && selectedMachines.length < availableMachines.length;

  // Разделение станков по типам
  const millingMachines = availableMachines.filter((m: MachineAvailability) => m.machineType === 'MILLING');
  const turningMachines = availableMachines.filter((m: MachineAvailability) => m.machineType === 'TURNING');
  
  const handleSelectAllMilling = (checked: boolean) => {
    if (checked) {
      const millingIds = millingMachines.map(m => m.id);
      setSelectedMachines(prev => {
        const newSet = new Set([...prev, ...millingIds]);
        return Array.from(newSet);
      });
    } else {
      const millingIds = millingMachines.map(m => m.id);
      setSelectedMachines(prev => prev.filter(id => !millingIds.includes(id)));
    }
  };
  
  const handleSelectAllTurning = (checked: boolean) => {
    if (checked) {
      const turningIds = turningMachines.map(m => m.id);
      setSelectedMachines(prev => {
        const newSet = new Set([...prev, ...turningIds]);
        return Array.from(newSet);
      });
    } else {
      const turningIds = turningMachines.map(m => m.id);
      setSelectedMachines(prev => prev.filter(id => !turningIds.includes(id)));
    }
  };
  
  const selectedMillingCount = millingMachines.filter(m => selectedMachines.includes(m.id)).length;
  const selectedTurningCount = turningMachines.filter(m => selectedMachines.includes(m.id)).length;

  const steps = [
    {
      title: 'Выбор станков',
      description: 'Выберите доступные станки для планирования',
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        <Title level={2} style={{ marginBottom: '8px', color: '#1890ff' }}>
          <ToolOutlined /> Планирование производства
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          Выберите доступные станки для планирования операций. Система автоматически выберет 3 заказа 
          с разными приоритетами и составит оптимальную очередь операций.
        </Paragraph>

        <Steps 
          current={currentStep} 
          items={steps} 
          style={{ marginBottom: 32 }}
          size="default"
        />

        {currentStep === 0 && (
          <>
            <div style={{ marginBottom: 32 }}>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={8}>
                  <Card 
                    size="small" 
                    style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    <Statistic 
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Всего станков</span>} 
                      value={machines?.length || 0} 
                      prefix={<ToolOutlined style={{ color: 'white' }} />}
                      valueStyle={{ color: 'white' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card 
                    size="small" 
                    style={{ 
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    <Statistic 
                      title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Доступных</span>} 
                      value={availableMachines.length} 
                      prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                      valueStyle={{ color: 'white' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card 
                    size="small" 
                    style={{ 
                      background: selectedMachines.length > 0 
                        ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
                        : 'linear-gradient(135deg, #f0f0f0 0%, #d9d9d9 100%)',
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    <Statistic 
                      title={<span style={{ color: selectedMachines.length > 0 ? 'rgba(255,255,255,0.8)' : '#666' }}>Выбрано</span>} 
                      value={selectedMachines.length} 
                      prefix={<InfoCircleOutlined style={{ color: selectedMachines.length > 0 ? 'white' : '#666' }} />}
                      valueStyle={{ color: selectedMachines.length > 0 ? 'white' : '#666' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Alert
              message="Рекомендации по выбору станков"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li><strong>Фрезерные 4-осевые:</strong> Doosan Yashana, Doosan Hadasha, Doosan 3, Pinnacle Gdola</li>
                  <li><strong>Фрезерные 3-осевые:</strong> Mitsubishi (+ любые 4-осевые станки)</li>
                  <li><strong>Токарные:</strong> Okuma, JohnFord</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 32, borderRadius: '8px' }}
            />

            {/* Фрезерные станки */}
            <Card
              title={
                <Space size="large">
                  <Space>
                    <ToolOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                    <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>
                      Фрезерные станки
                    </span>
                    <Tag color="blue" style={{ borderRadius: '20px', padding: '4px 12px' }}>
                      {millingMachines.length} доступно
                    </Tag>
                  </Space>
                  <Checkbox
                    indeterminate={selectedMillingCount > 0 && selectedMillingCount < millingMachines.length}
                    checked={selectedMillingCount === millingMachines.length && millingMachines.length > 0}
                    onChange={(e) => handleSelectAllMilling(e.target.checked)}
                  >
                    <span style={{ fontWeight: '500' }}>
                      Выбрать все ({selectedMillingCount}/{millingMachines.length})
                    </span>
                  </Checkbox>
                </Space>
              }
              size="small"
              style={{ 
                marginBottom: 24, 
                borderColor: '#1890ff',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {millingMachines.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {millingMachines.map((machine: MachineAvailability) => (
                    <Col key={machine.id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        size="small"
                        hoverable
                        style={{
                          borderColor: selectedMachines.includes(machine.id) ? '#1890ff' : '#e8e8e8',
                          backgroundColor: selectedMachines.includes(machine.id) ? '#e6f7ff' : '#fff',
                          boxShadow: selectedMachines.includes(machine.id) 
                            ? '0 4px 12px rgba(24, 144, 255, 0.15)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.06)',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                        }}
                        styles={{
                          body: { padding: '16px' }
                        }}
                      >
                        <Checkbox
                          checked={selectedMachines.includes(machine.id)}
                          onChange={(e) => handleMachineSelect(machine.id, e.target.checked)}
                          style={{ marginBottom: 12, width: '100%' }}
                        >
                          <strong style={{ color: '#1890ff', fontSize: '14px' }}>
                            {machine.machineName}
                          </strong>
                        </Checkbox>
                        
                        <div style={{ marginBottom: 12 }}>
                          <Tag 
                            color="blue" 
                            icon={<ToolOutlined />}
                            style={{ borderRadius: '16px' }}
                          >
                            Фрезерный
                          </Tag>
                        </div>
                        
                        {machine.lastFreedAt && (
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                            <ClockCircleOutlined style={{ marginRight: '4px' }} /> 
                            Освобожден: {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
                          </Text>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <ToolOutlined style={{ fontSize: '32px', marginBottom: '16px', color: '#d9d9d9' }} />
                  <div style={{ fontSize: '16px' }}>Нет доступных фрезерных станков</div>
                </div>
              )}
            </Card>

            {/* Токарные станки */}
            <Card
              title={
                <Space size="large">
                  <Space>
                    <ToolOutlined rotate={90} style={{ color: '#52c41a', fontSize: '18px' }} />
                    <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '16px' }}>
                      Токарные станки
                    </span>
                    <Tag color="green" style={{ borderRadius: '20px', padding: '4px 12px' }}>
                      {turningMachines.length} доступно
                    </Tag>
                  </Space>
                  <Checkbox
                    indeterminate={selectedTurningCount > 0 && selectedTurningCount < turningMachines.length}
                    checked={selectedTurningCount === turningMachines.length && turningMachines.length > 0}
                    onChange={(e) => handleSelectAllTurning(e.target.checked)}
                  >
                    <span style={{ fontWeight: '500' }}>
                      Выбрать все ({selectedTurningCount}/{turningMachines.length})
                    </span>
                  </Checkbox>
                </Space>
              }
              size="small"
              style={{ 
                marginBottom: 24, 
                borderColor: '#52c41a',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {turningMachines.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {turningMachines.map((machine: MachineAvailability) => (
                    <Col key={machine.id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        size="small"
                        hoverable
                        style={{
                          borderColor: selectedMachines.includes(machine.id) ? '#52c41a' : '#e8e8e8',
                          backgroundColor: selectedMachines.includes(machine.id) ? '#f6ffed' : '#fff',
                          boxShadow: selectedMachines.includes(machine.id) 
                            ? '0 4px 12px rgba(82, 196, 26, 0.15)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.06)',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                        }}
                        styles={{
                          body: { padding: '16px' }
                        }}
                      >
                        <Checkbox
                          checked={selectedMachines.includes(machine.id)}
                          onChange={(e) => handleMachineSelect(machine.id, e.target.checked)}
                          style={{ marginBottom: 12, width: '100%' }}
                        >
                          <strong style={{ color: '#52c41a', fontSize: '14px' }}>
                            {machine.machineName}
                          </strong>
                        </Checkbox>
                        
                        <div style={{ marginBottom: 12 }}>
                          <Tag 
                            color="green" 
                            icon={<ToolOutlined rotate={90} />}
                            style={{ borderRadius: '16px' }}
                          >
                            Токарный
                          </Tag>
                        </div>
                        
                        {machine.lastFreedAt && (
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                            <ClockCircleOutlined style={{ marginRight: '4px' }} /> 
                            Освобожден: {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
                          </Text>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <ToolOutlined rotate={90} style={{ fontSize: '32px', marginBottom: '16px', color: '#d9d9d9' }} />
                  <div style={{ fontSize: '16px' }}>Нет доступных токарных станков</div>
                </div>
              )}
            </Card>

            {/* Общий чекбокс для всех станков */}
            <Card 
              size="small" 
              style={{ 
                backgroundColor: '#fafafa', 
                borderRadius: '8px',
                border: '1px dashed #d9d9d9'
              }}
            >
              <Space>
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  <strong style={{ fontSize: '16px' }}>Выбрать все доступные станки</strong>
                </Checkbox>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  (Выбрано: <strong>{selectedMachines.length}</strong> из <strong>{availableMachines.length}</strong> станков)
                </Text>
              </Space>
            </Card>

            <Divider style={{ margin: '32px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartPlanning}
                  disabled={selectedMachines.length === 0}
                  loading={planningMutation.isPending}
                  style={{ 
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    minWidth: '240px'
                  }}
                >
                  Запустить планирование ({selectedMachines.length} станков)
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
                Анализ заказов, операций и составление оптимальной очереди
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
                style={{ borderRadius: '8px' }}
              >
                Просмотреть детали
              </Button>,
              <Button 
                key="restart"
                size="large"
                onClick={() => {
                  setCurrentStep(0);
                  setPlanningResult(null);
                  setSelectedMachines([]);
                }}
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
      </Card>

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
              📋 Очередь операций
            </Title>
            <List
              dataSource={planningResult.operationsQueue}
              renderItem={(operation, index) => {
                // Найдем заказ для этой операции
                const order = planningResult.selectedOrders.find(o => o.id === operation.orderId);
                const drawingNumber = order?.drawingNumber || `Заказ #${operation.orderId}`;
                
                // Найдем станок для получения названия
                const assignedMachine = machines?.find(m => m.id === operation.machineId.toString());
                const machineName = assignedMachine?.machineName || `Станок #${operation.machineId}`;
                
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
                            <Tag 
                              color="green" 
                              style={{ 
                                borderRadius: '16px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              🎯 Приоритет {operation.priority}
                            </Tag>
                            <Tag 
                              color="orange" 
                              style={{ 
                                borderRadius: '16px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ⏱️ {formatTime(operation.estimatedTime)}
                            </Tag>
                            <Tag 
                              color="purple" 
                              style={{ 
                                borderRadius: '16px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              🏭 {machineName}
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
                      {(() => {
                        const assignedMachine = machines?.find(m => m.id === selectedOperation.machineId.toString());
                        return assignedMachine?.machineName || `#${selectedOperation.machineId}`;
                      })()}
                    </Tag>
                  </div>
                </Card>
              </Col>
            </Row>

            {selectedOperation.startTime && selectedOperation.endTime && (
              <Card 
                size="small" 
                title="Плановое время выполнения" 
                style={{ marginBottom: 24, borderRadius: '8px' }}
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <div>
                      <strong>Начало:</strong> 
                      <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                        {new Date(selectedOperation.startTime).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <strong>Окончание:</strong> 
                      <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                        {new Date(selectedOperation.endTime).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            <Alert
              message="Подтверждение назначения"
              description={
                <div>
                  После нажатия "Назначить в работу" операция{' '}
                  <strong>{selectedOperation.operationNumber || selectedOperation.operationId}</strong>{' '}
                  будет назначена на станок{' '}
                  <strong>
                    {(() => {
                      const assignedMachine = machines?.find(m => m.id === selectedOperation.machineId.toString());
                      return assignedMachine?.machineName || `#${selectedOperation.machineId}`;
                    })()}
                  </strong>{' '}
                  для выполнения.
                </div>
              }
              type="info"
              showIcon
              style={{ borderRadius: '8px' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionPlanningPage;
