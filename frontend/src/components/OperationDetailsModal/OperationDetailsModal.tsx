/**
 * @file: OperationDetailsModal.tsx
 * @description: Модальное окно с деталями активной операции (Ant Design)
 * @created: 2025-06-07
 */
import React, { useState } from 'react';
import {
  Modal,
  Typography,
  Row,
  Col,
  Card,
  Table,
  Progress,
  Tag,
  Tabs,
  Button,
  Alert,
  Divider,
  Space
} from 'antd';
import {
  PrinterOutlined,
  RiseOutlined,
  UserOutlined,
  DashboardOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface OperationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  operationData: {
    operationNumber: number;
    drawingNumber: string;
    operationType: string;
    totalQuantityPlanned: number;
    totalQuantityProduced: number;
    startDate: Date;
    estimatedCompletion: Date;
    machines: MachineStatistic[];
    operators: OperatorStatistic[];
  } | null;
}

interface MachineStatistic {
  machineId: number;
  machineName: string;
  quantityProduced: number;
  workingTime: number; // в минутах
  efficiency: number;
  status: 'working' | 'setup' | 'idle' | 'maintenance';
}

interface OperatorStatistic {
  operatorName: string;
  shift: 'DAY' | 'NIGHT';
  quantityProduced: number;
  partsPerHour: number;
  timePerPart: number;
  efficiency: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'F';
}

const OperationDetailsModal: React.FC<OperationDetailsModalProps> = ({
  open,
  onClose,
  operationData
}) => {
  const [currentTab, setCurrentTab] = useState('machines');

  if (!operationData) return null;

  const progressPercent = (operationData.totalQuantityProduced / operationData.totalQuantityPlanned) * 100;
  const isOnSchedule = new Date() <= operationData.estimatedCompletion;

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'success';
      case 'setup': return 'warning';
      case 'idle': return 'error';
      case 'maintenance': return 'processing';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working': return '🟢 Работает';
      case 'setup': return '🟡 Наладка';
      case 'idle': return '🔴 Простой';
      case 'maintenance': return '🔧 Обслуживание';
      default: return 'Неизвестно';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'success';
      case 'B': return 'processing';
      case 'C': return 'warning';
      case 'D': case 'F': return 'error';
      default: return 'default';
    }
  };

  const generateRecommendations = () => {
    const recommendations = [];
    
    // Анализируем эффективность операторов
    const lowEfficiencyOperators = operationData.operators.filter(op => op.efficiency < 80);
    if (lowEfficiencyOperators.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Низкая эффективность операторов',
        description: `Операторы ${lowEfficiencyOperators.map(op => op.operatorName).join(', ')} показывают эффективность ниже 80%. Рекомендуется дополнительное обучение.`
      });
    }

    // Анализируем загрузку станков
    const idleMachines = operationData.machines.filter(m => m.status === 'idle');
    if (idleMachines.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Простаивающие станки',
        description: `Станки ${idleMachines.map(m => m.machineName).join(', ')} простаивают. Рассмотрите возможность перераспределения загрузки.`
      });
    }

    // Проверяем выполнение плана
    if (progressPercent < 90 && !isOnSchedule) {
      recommendations.push({
        type: 'error',
        title: 'Отставание от плана',
        description: 'Операция отстает от плана. Рекомендуется увеличить смены или оптимизировать процесс.'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Колонки для таблицы станков
  const machineColumns: ColumnsType<MachineStatistic> = [
    {
      title: 'Станок',
      dataIndex: 'machineName',
      key: 'machineName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Произведено',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      render: (value: number) => `${value} дет.`,
      align: 'right'
    },
    {
      title: 'Время работы',
      dataIndex: 'workingTime',
      key: 'workingTime',
      render: (minutes: number) => `${Math.round(minutes / 60)}ч ${minutes % 60}м`,
      align: 'right'
    },
    {
      title: 'Эффективность',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => {
        let color = 'default';
        if (efficiency >= 90) color = 'success';
        else if (efficiency >= 75) color = 'warning';
        else color = 'error';
        
        return <Tag color={color}>{efficiency.toFixed(1)}%</Tag>;
      },
      align: 'right'
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    }
  ];

  // Колонки для таблицы операторов
  const operatorColumns: ColumnsType<OperatorStatistic> = [
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Смена',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift: string) => (
        <Tag color={shift === 'DAY' ? 'blue' : 'purple'}>
          {shift === 'DAY' ? 'День' : 'Ночь'}
        </Tag>
      )
    },
    {
      title: 'Произведено',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      render: (value: number) => `${value} дет.`,
      align: 'right'
    },
    {
      title: 'Дет/час',
      dataIndex: 'partsPerHour',
      key: 'partsPerHour',
      render: (value: number) => value.toFixed(1),
      align: 'right'
    },
    {
      title: 'Время/дет',
      dataIndex: 'timePerPart',
      key: 'timePerPart',
      render: (value: number) => `${value.toFixed(1)} мин`,
      align: 'right'
    },
    {
      title: 'Эффективность',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => {
        let color = 'default';
        if (efficiency >= 90) color = 'success';
        else if (efficiency >= 75) color = 'warning';
        else color = 'error';
        
        return <Tag color={color}>{efficiency.toFixed(1)}%</Tag>;
      },
      align: 'right'
    },
    {
      title: 'Рейтинг',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: string) => (
        <Tag color={getRatingColor(rating)}>{rating}</Tag>
      ),
      align: 'center'
    }
  ];

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            📋 Операция №{operationData.operationNumber} - {operationData.drawingNumber}
          </Title>
          <Text type="secondary">
            🏭 Тип: {operationData.operationType} | 📅 Период: {operationData.startDate.toLocaleDateString('ru-RU')} - {operationData.estimatedCompletion.toLocaleDateString('ru-RU')}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          Печать отчета
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Закрыть
        </Button>
      ]}
      style={{ top: 20 }}
    >
      {/* Общий прогресс операции */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>📊 Общий прогресс операции</Title>
        
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <div style={{ marginBottom: 8 }}>
              <Text>
                Выполнено: {operationData.totalQuantityProduced} из {operationData.totalQuantityPlanned} дет.
              </Text>
              <Text strong style={{ float: 'right' }}>
                {progressPercent.toFixed(1)}%
              </Text>
            </div>
            <Progress 
              percent={progressPercent} 
              status={progressPercent >= 90 ? 'success' : progressPercent >= 70 ? 'normal' : 'exception'}
              strokeWidth={12}
            />
          </Col>
          
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Text type="secondary">Статус выполнения</Text>
            <div style={{ marginTop: 8 }}>
              <Tag 
                color={isOnSchedule ? 'success' : 'error'}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {isOnSchedule ? 'В срок' : 'С опозданием'}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Табы с деталями */}
      <Tabs 
        activeKey={currentTab} 
        onChange={setCurrentTab}
        items={[
          {
            key: 'machines',
            label: (
              <span>
                <DashboardOutlined />
                Станки
              </span>
            ),
            children: (
              <>
                <Title level={5}>🏭 Статистика по станкам</Title>
                <Table
                  columns={machineColumns}
                  dataSource={operationData.machines}
                  rowKey="machineId"
                  pagination={false}
                  size="small"
                />
              </>
            )
          },
          {
            key: 'operators',
            label: (
              <span>
                <UserOutlined />
                Операторы
              </span>
            ),
            children: (
              <>
                <Title level={5}>👨‍🔧 Сравнение операторов</Title>
                <Table
                  columns={operatorColumns}
                  dataSource={operationData.operators}
                  rowKey="operatorName"
                  pagination={false}
                  size="small"
                />
              </>
            )
          },
          {
            key: 'performance',
            label: (
              <span>
                <LineChartOutlined />
                Производительность
              </span>
            ),
            children: (
              <>
                <Title level={5}>📈 График производительности</Title>
                
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Card>
                      <Title level={5}>📊 Производительность по дням</Title>
                      <div style={{ 
                        height: 200, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 6
                      }}>
                        <Text type="secondary">
                          График будет добавлен позже
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card>
                      <Title level={5}>🔥 Загрузка станков по часам</Title>
                      <div style={{ 
                        height: 200, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 6
                      }}>
                        <Text type="secondary">
                          Тепловая карта будет добавлена позже
                        </Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </>
            )
          },
          {
            key: 'recommendations',
            label: (
              <span>
                <RiseOutlined />
                Рекомендации
              </span>
            ),
            children: (
              <>
                <Title level={5}>💡 Рекомендации по оптимизации</Title>
                
                {recommendations.length === 0 ? (
                  <Alert
                    message="🎉 Отличная работа!"
                    description="Операция выполняется эффективно, критических замечаний нет."
                    type="success"
                    showIcon
                  />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {recommendations.map((rec, index) => (
                      <Alert
                        key={index}
                        message={rec.title}
                        description={rec.description}
                        type={rec.type as any}
                        showIcon
                      />
                    ))}
                  </Space>
                )}

                <Divider />

                <Title level={5}>📋 Автоматические рекомендации</Title>
                
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Card>
                      <Title level={5} style={{ color: '#1890ff' }}>
                        🎯 Оптимизация загрузки
                      </Title>
                      <Text>
                        • Перераспределить операторов между сменами<br/>
                        • Синхронизировать работу станков<br/>
                        • Оптимизировать время наладки
                      </Text>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card>
                      <Title level={5} style={{ color: '#722ed1' }}>
                        📚 Обучение персонала
                      </Title>
                      <Text>
                        • Дополнительное обучение операторов<br/>
                        • Стандартизация рабочих процессов<br/>
                        • Контроль качества выполнения операций
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default OperationDetailsModal;
