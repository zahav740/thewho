/**
 * @file: ProductionPlanningPage.tsx  
 * @description: Страница планирования производства с выбором станков (ИСПРАВЛЕНО)
 * @dependencies: machinesApi, planningApi
 * @created: 2025-05-28
 * @fixed: 2025-05-28
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
  Table,
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
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { machinesApi } from '../../services/machinesApi';
import { planningApi } from '../../services/planningApi';
import { MachineAvailability } from '../../types/machine.types';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

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
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <ToolOutlined /> Планирование производства
        </Title>
        <Paragraph>
          Выберите доступные станки для планирования операций. Система автоматически выберет 3 заказа 
          с разными приоритетами и составит оптимальную очередь операций.
        </Paragraph>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        {currentStep === 0 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Space size="large">
                <Statistic 
                  title="Всего станков" 
                  value={machines?.length || 0} 
                  prefix={<ToolOutlined />}
                />
                <Statistic 
                  title="Доступных" 
                  value={availableMachines.length} 
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
                <Statistic 
                  title="Выбрано" 
                  value={selectedMachines.length} 
                  valueStyle={{ color: selectedMachines.length > 0 ? '#1890ff' : undefined }}
                  prefix={<InfoCircleOutlined />}
                />
              </Space>
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
              style={{ marginBottom: 24 }}
            />

            {/* Фрезерные станки */}
            <Card
              title={
                <Space>
                  <ToolOutlined style={{ color: '#1890ff' }} />
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>Фрезерные станки</span>
                  <Tag color="blue">{millingMachines.length} доступно</Tag>
                  <Checkbox
                    indeterminate={selectedMillingCount > 0 && selectedMillingCount < millingMachines.length}
                    checked={selectedMillingCount === millingMachines.length && millingMachines.length > 0}
                    onChange={(e) => handleSelectAllMilling(e.target.checked)}
                    style={{ marginLeft: 16 }}
                  >
                    Выбрать все фрезерные ({selectedMillingCount}/{millingMachines.length})
                  </Checkbox>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16, borderColor: '#1890ff' }}
            >
              {millingMachines.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {millingMachines.map((machine: MachineAvailability) => (
                    <Col key={machine.id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        size="small"
                        style={{
                          borderColor: selectedMachines.includes(machine.id) ? '#1890ff' : '#d9d9d9',
                          backgroundColor: selectedMachines.includes(machine.id) ? '#e6f7ff' : '#fff',
                          boxShadow: selectedMachines.includes(machine.id) ? '0 2px 8px rgba(24, 144, 255, 0.2)' : undefined,
                        }}
                        styles={{
                          body: { padding: '12px' }
                        }}
                      >
                        <Checkbox
                          checked={selectedMachines.includes(machine.id)}
                          onChange={(e) => handleMachineSelect(machine.id, e.target.checked)}
                          style={{ marginBottom: 8, width: '100%' }}
                        >
                          <strong style={{ color: '#1890ff' }}>{machine.machineName}</strong>
                        </Checkbox>
                        
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="blue" icon={<ToolOutlined />}>
                            Фрезерный
                          </Tag>
                        </div>
                        
                        {machine.lastFreedAt && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined /> Освобожден: {new Date(machine.lastFreedAt).toLocaleString()}
                          </Text>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <ToolOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                  <div>Нет доступных фрезерных станков</div>
                </div>
              )}
            </Card>

            {/* Токарные станки */}
            <Card
              title={
                <Space>
                  <ToolOutlined rotate={90} style={{ color: '#52c41a' }} />
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Токарные станки</span>
                  <Tag color="green">{turningMachines.length} доступно</Tag>
                  <Checkbox
                    indeterminate={selectedTurningCount > 0 && selectedTurningCount < turningMachines.length}
                    checked={selectedTurningCount === turningMachines.length && turningMachines.length > 0}
                    onChange={(e) => handleSelectAllTurning(e.target.checked)}
                    style={{ marginLeft: 16 }}
                  >
                    Выбрать все токарные ({selectedTurningCount}/{turningMachines.length})
                  </Checkbox>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16, borderColor: '#52c41a' }}
            >
              {turningMachines.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {turningMachines.map((machine: MachineAvailability) => (
                    <Col key={machine.id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        size="small"
                        style={{
                          borderColor: selectedMachines.includes(machine.id) ? '#52c41a' : '#d9d9d9',
                          backgroundColor: selectedMachines.includes(machine.id) ? '#f6ffed' : '#fff',
                          boxShadow: selectedMachines.includes(machine.id) ? '0 2px 8px rgba(82, 196, 26, 0.2)' : undefined,
                        }}
                        styles={{
                          body: { padding: '12px' }
                        }}
                      >
                        <Checkbox
                          checked={selectedMachines.includes(machine.id)}
                          onChange={(e) => handleMachineSelect(machine.id, e.target.checked)}
                          style={{ marginBottom: 8, width: '100%' }}
                        >
                          <strong style={{ color: '#52c41a' }}>{machine.machineName}</strong>
                        </Checkbox>
                        
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="green" icon={<ToolOutlined rotate={90} />}>
                            Токарный
                          </Tag>
                        </div>
                        
                        {machine.lastFreedAt && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined /> Освобожден: {new Date(machine.lastFreedAt).toLocaleString()}
                          </Text>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <ToolOutlined rotate={90} style={{ fontSize: '24px', marginBottom: '8px' }} />
                  <div>Нет доступных токарных станков</div>
                </div>
              )}
            </Card>

            {/* Общий чекбокс для всех станков */}
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Space>
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  <strong>Выбрать все доступные станки</strong>
                </Checkbox>
                <Text type="secondary">
                  (Выбрано: {selectedMachines.length} из {availableMachines.length} станков)
                </Text>
              </Space>
            </Card>

            <Divider />

            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartPlanning}
                disabled={selectedMachines.length === 0}
                loading={planningMutation.isPending}
              >
                Запустить планирование ({selectedMachines.length} станков)
              </Button>

              <Button
                size="large"
                icon={<InfoCircleOutlined />}
                onClick={handleDemoPlanning}
                loading={demoMutation.isPending}
              >
                Демо планирование (все станки)
              </Button>
            </Space>
          </>
        )}

        {currentStep === 1 && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Title level={4}>Выполняется планирование...</Title>
              <Text type="secondary">Анализ заказов, операций и составление оптимальной очереди</Text>
            </div>
          </div>
        )}

        {currentStep === 2 && planningResult && (
          <Result
            status="success"
            title="Планирование завершено"
            subTitle={`Обработано ${planningResult.selectedOrders.length} заказов, ${planningResult.operationsQueue.length} операций`}
            extra={[
              <Button 
                type="primary" 
                key="view"
                onClick={() => setShowResultModal(true)}
              >
                Просмотреть детали
              </Button>,
              <Button 
                key="restart"
                onClick={() => {
                  setCurrentStep(0);
                  setPlanningResult(null);
                  setSelectedMachines([]);
                }}
              >
                Новое планирование
              </Button>,
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              <Statistic
                title="Общее время выполнения"
                value={formatTime(planningResult.totalTime)}
                valueStyle={{ color: '#3f8600' }}
                prefix={<ClockCircleOutlined />}
              />
            </div>
          </Result>
        )}
      </Card>

      {/* Модальное окно с результатами */}
      <Modal
        title="Результаты планирования"
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowResultModal(false)}>
            Закрыть
          </Button>
        ]}
      >
        {planningResult && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Заказов"
                  value={planningResult.selectedOrders.length}
                  prefix={<InfoCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Операций"
                  value={planningResult.operationsQueue.length}
                  prefix={<ToolOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Общее время"
                  value={formatTime(planningResult.totalTime)}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>

            <Title level={4}>Очередь операций</Title>
            <List
              dataSource={planningResult.operationsQueue}
              renderItem={(operation, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${index + 1}. Операция #${operation.operationId}`}
                    description={
                      <Space>
                        <Tag color="blue">Заказ #{operation.orderId}</Tag>
                        <Tag color="green">Приоритет {operation.priority}</Tag>
                        <Tag color="orange">{formatTime(operation.estimatedTime)}</Tag>
                        <Text type="secondary">Станок #{operation.machineId}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionPlanningPage;
