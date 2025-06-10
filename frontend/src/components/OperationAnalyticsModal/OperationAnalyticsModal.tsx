/**
 * @file: OperationAnalyticsModal.tsx
 * @description: Модальное окно с полной аналитикой операции (ИСПРАВЛЕНО - добавлены печать и экспорт)
 * @dependencies: antd, react-query, shiftsApi, operationsApi
 * @created: 2025-06-09
 * @updated: 2025-06-10 - Добавлены функции печати и экспорта
 */
import React, { useState } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Progress,
  Statistic,
  Divider,
  Alert,
  Table,
  Tabs,
  Badge,
  Timeline,
  Button,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  ToolOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../../services/shiftsApi';
import { operationsApi } from '../../services/operationsApi';
import { operatorsApi } from '../../services/operatorsApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface OperationAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  machine: any;
}

interface ShiftAnalytics {
  totalQuantity: number;
  totalTime: number;
  averageTimePerUnit: number;
  dayShiftData: any[];
  nightShiftData: any[];
  setupData: any[];
  efficiency: number;
  estimatedCompletion: Date | null;
  workingDaysLeft: number;
}

export const OperationAnalyticsModal: React.FC<OperationAnalyticsModalProps> = ({
  visible,
  onClose,
  machine,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  // Загрузка данных смен для этого станка
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', 'machine', machine?.id],
    queryFn: () => shiftsApi.getByMachine(machine?.id),
    enabled: visible && !!machine?.id,
  });

  // Загрузка информации об операции
  const { data: operationInfo, isLoading: operationLoading } = useQuery({
    queryKey: ['operation', machine?.currentOperationId],
    queryFn: () => operationsApi.getById(machine?.currentOperationId),
    enabled: visible && !!machine?.currentOperationId,
  });

  // Вычисление аналитики
  const analytics = React.useMemo<ShiftAnalytics>(() => {
    if (!shifts || !machine?.currentOperationDetails) {
      return {
        totalQuantity: 0,
        totalTime: 0,
        averageTimePerUnit: 0,
        dayShiftData: [],
        nightShiftData: [],
        setupData: [],
        efficiency: 0,
        estimatedCompletion: null,
        workingDaysLeft: 0,
      };
    }

    const orderQuantity = machine.currentOperationDetails.orderQuantity || 0;
    const totalShifts = shifts.length;
    
    let totalQuantity = 0;
    let totalTime = 0;
    let setupTime = 0;
    
    const dayShiftData: any[] = [];
    const nightShiftData: any[] = [];
    const setupData: any[] = [];

    shifts.forEach((shift: any) => {
      if (shift.dayShiftQuantity) {
        totalQuantity += shift.dayShiftQuantity;
        totalTime += (shift.dayShiftQuantity * (shift.dayShiftTimePerUnit || 0));
        dayShiftData.push({
          date: shift.date,
          quantity: shift.dayShiftQuantity,
          operator: shift.dayShiftOperator,
          timePerUnit: shift.dayShiftTimePerUnit,
          totalTime: shift.dayShiftQuantity * (shift.dayShiftTimePerUnit || 0),
        });
      }
      
      if (shift.nightShiftQuantity) {
        totalQuantity += shift.nightShiftQuantity;
        totalTime += (shift.nightShiftQuantity * (shift.nightShiftTimePerUnit || 0));
        nightShiftData.push({
          date: shift.date,
          quantity: shift.nightShiftQuantity,
          operator: shift.nightShiftOperator,
          timePerUnit: shift.nightShiftTimePerUnit,
          totalTime: shift.nightShiftQuantity * (shift.nightShiftTimePerUnit || 0),
        });
      }
      
      if (shift.setupTime) {
        setupTime += shift.setupTime;
        setupData.push({
          date: shift.date,
          time: shift.setupTime,
          operator: shift.setupOperator,
        });
      }
    });

    const averageTimePerUnit = totalQuantity > 0 ? totalTime / totalQuantity : 0;
    const remainingQuantity = Math.max(0, orderQuantity - totalQuantity);
    const efficiency = orderQuantity > 0 ? (totalQuantity / orderQuantity) * 100 : 0;

    // Расчет приблизительного времени окончания (исключая пятницу и субботу)
    let estimatedCompletion = null;
    let workingDaysLeft = 0;

    if (remainingQuantity > 0 && averageTimePerUnit > 0) {
      const remainingTimeMinutes = remainingQuantity * averageTimePerUnit;
      const workingHoursPerDay = 16; // 2 смены по 8 часов
      const workingMinutesPerDay = workingHoursPerDay * 60;
      
      const daysNeeded = Math.ceil(remainingTimeMinutes / workingMinutesPerDay);
      
      // Подсчитываем рабочие дни (исключая пятницу и субботу)
      const currentDate = new Date();
      let addedDays = 0;
      let workingDaysCount = 0;
      
      while (workingDaysCount < daysNeeded) {
        addedDays++;
        const checkDate = new Date(currentDate);
        checkDate.setDate(currentDate.getDate() + addedDays);
        
        const dayOfWeek = checkDate.getDay(); // 0 = воскресенье, 5 = пятница, 6 = суббота
        if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Не пятница и не суббота
          workingDaysCount++;
        }
      }
      
      estimatedCompletion = new Date(currentDate);
      estimatedCompletion.setDate(currentDate.getDate() + addedDays);
      workingDaysLeft = workingDaysCount;
    }

    return {
      totalQuantity,
      totalTime,
      averageTimePerUnit,
      dayShiftData,
      nightShiftData,
      setupData,
      efficiency,
      estimatedCompletion,
      workingDaysLeft,
    };
  }, [shifts, machine]);

  // Функция расчета эффективности смены
  const calculateShiftEfficiency = (shift: any): number => {
    const estimatedTime = machine?.currentOperationDetails?.estimatedTime || 20;
    if (shift.timePerUnit && shift.timePerUnit > 0) {
      return Math.round((estimatedTime / shift.timePerUnit) * 100);
    }
    return 0;
  };

  // Функция печати
  const handlePrint = () => {
    window.print();
  };

  // Функция экспорта
  const handleExport = async () => {
    if (!machine?.currentOperationDetails?.orderDrawingNumber) {
      message.error('Номер чертежа не определен');
      return;
    }

    setExporting(true);
    try {
      // Подготавливаем данные для экспорта
      const exportData = {
        operation: {
          number: machine?.currentOperationDetails?.operationNumber || 0,
          type: machine?.currentOperationDetails?.operationType || '',
          drawing: machine?.currentOperationDetails?.orderDrawingNumber || '',
          machine: machine?.machineName || '',
          exportDate: new Date().toISOString()
        },
        progress: {
          totalProduced: analytics.totalQuantity,
          target: machine?.currentOperationDetails?.orderQuantity || 0,
          progress: analytics.efficiency,
          remaining: Math.max(0, (machine?.currentOperationDetails?.orderQuantity || 0) - analytics.totalQuantity)
        },
        time: {
          totalWorkingTime: analytics.totalTime,
          averageTimePerUnit: analytics.averageTimePerUnit,
          setupTime: analytics.setupData.reduce((sum, setup) => sum + setup.time, 0),
          estimatedCompletion: analytics.estimatedCompletion?.toISOString() || null,
          workingDaysLeft: analytics.workingDaysLeft
        },
        shifts: {
          dayShifts: analytics.dayShiftData,
          nightShifts: analytics.nightShiftData,
          setupRecords: analytics.setupData,
          totalShifts: analytics.dayShiftData.length + analytics.nightShiftData.length
        }
      };

      // Создаем CSV-строку
      const csvHeader = 'Дата,Тип_смены,Количество,Оператор,Время_на_деталь,Общее_время,Эффективность\n';
      const csvRows = [
        ...analytics.dayShiftData.map(shift => 
          `${shift.date},Дневная,${shift.quantity},${shift.operator},${shift.timePerUnit},${shift.totalTime},${calculateShiftEfficiency(shift)}`
        ),
        ...analytics.nightShiftData.map(shift => 
          `${shift.date},Ночная,${shift.quantity},${shift.operator},${shift.timePerUnit},${shift.totalTime},${calculateShiftEfficiency(shift)}`
        )
      ].join('\n');

      const csvContent = csvHeader + csvRows;

      // Скачиваем файл
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics_${machine.machineName}_${machine.currentOperationDetails.orderDrawingNumber}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Файл аналитики успешно экспортирован');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      message.error('Ошибка при экспорте данных');
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0 мин';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours === 0) {
      return `${remainingMinutes} мин`;
    } else if (remainingMinutes === 0) {
      return `${hours} ч`;
    } else {
      return `${hours} ч ${remainingMinutes} мин`;
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return '#52c41a';
    if (efficiency >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 70) return 'active';
    return 'exception';
  };

  const shiftsColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <Text strong style={{ color: '#1890ff' }}>{quantity} шт.</Text>
      ),
    },
    {
      title: 'Оператор',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: string) => (
        <Space>
          <UserOutlined />
          {operator || 'Не указан'}
        </Space>
      ),
    },
    {
      title: 'Время/деталь',
      dataIndex: 'timePerUnit',
      key: 'timePerUnit',
      render: (time: number) => formatTime(time || 0),
    },
    {
      title: 'Общее время',
      dataIndex: 'totalTime',
      key: 'totalTime',
      render: (time: number) => (
        <Text strong>{formatTime(time || 0)}</Text>
      ),
    },
  ];

  const setupColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Время наладки',
      dataIndex: 'time',
      key: 'time',
      render: (time: number) => (
        <Text strong style={{ color: '#fa8c16' }}>{formatTime(time)}</Text>
      ),
    },
    {
      title: 'Оператор',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: string) => (
        <Space>
          <SettingOutlined />
          {operator || 'Не указан'}
        </Space>
      ),
    },
  ];

  if (!machine) return null;

  const orderDetails = machine.currentOperationDetails;
  const remainingQuantity = Math.max(0, (orderDetails?.orderQuantity || 0) - analytics.totalQuantity);

  return (
    <Modal
      title={
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <ToolOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Аналитика операции - {machine.machineName}
              </span>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<PrinterOutlined />} 
                size="small"
                onClick={handlePrint}
                title="Печать отчета"
              >
                Печать
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                size="small"
                onClick={handleExport}
                loading={exporting}
                title="Экспорт в CSV"
              >
                Экспорт
              </Button>
            </Space>
          </Col>
        </Row>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Закрыть
        </Button>
      ]}
      style={{ top: 20 }}
    >
      {shiftsLoading || operationLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Загрузка аналитики...</div>
        </div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Space>
                <LineChartOutlined />
                Обзор
              </Space>
            }
            key="overview"
          >
            {/* Основная информация об операции */}
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Title level={4}>📋 Информация об операции</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Чертёж: </Text>
                      <Text>{orderDetails?.orderDrawingNumber || 'Не указан'}</Text>
                    </div>
                    <div>
                      <Text strong>Операция: </Text>
                      <Tag color="blue">#{orderDetails?.operationNumber}</Tag>
                      <Tag color="green">{orderDetails?.operationType}</Tag>
                    </div>
                    <div>
                      <Text strong>Приоритет: </Text>
                      <Tag color={orderDetails?.orderPriority === 1 ? 'red' : orderDetails?.orderPriority === 2 ? 'orange' : 'green'}>
                        {orderDetails?.orderPriority || 'Не указан'}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Дедлайн: </Text>
                      <Text>{orderDetails?.orderDeadline ? new Date(orderDetails.orderDeadline).toLocaleDateString('ru-RU') : 'Не указан'}</Text>
                    </div>
                  </Space>
                </Col>
                <Col span={12}>
                  <Title level={4}>📊 Прогресс выполнения</Title>
                  <div style={{ marginBottom: 16 }}>
                    <Progress
                      percent={Math.round(analytics.efficiency)}
                      status={getEfficiencyStatus(analytics.efficiency)}
                      strokeColor={getEfficiencyColor(analytics.efficiency)}
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Выполнено"
                        value={analytics.totalQuantity}
                        suffix={`/ ${orderDetails?.orderQuantity || 0} шт.`}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Осталось"
                        value={remainingQuantity}
                        suffix="шт."
                        valueStyle={{ color: remainingQuantity > 0 ? '#fa8c16' : '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {/* Прогноз завершения */}
            <Card style={{ marginBottom: 16 }}>
              <Title level={4}>🎯 Прогноз завершения</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Среднее время/деталь"
                      value={analytics.averageTimePerUnit.toFixed(1)}
                      suffix="мин"
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Рабочих дней осталось"
                      value={analytics.workingDaysLeft}
                      suffix="дн."
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: analytics.workingDaysLeft <= 3 ? '#ff4d4f' : '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Ожидаемое завершение:</Text>
                    </div>
                    {analytics.estimatedCompletion ? (
                      <Text style={{ fontSize: '16px', color: '#1890ff', fontWeight: 'bold' }}>
                        {analytics.estimatedCompletion.toLocaleDateString('ru-RU')}
                      </Text>
                    ) : (
                      <Text type="secondary">Недостаточно данных</Text>
                    )}
                  </Card>
                </Col>
              </Row>
              
              {analytics.estimatedCompletion && (
                <Alert
                  style={{ marginTop: 16 }}
                  message="📅 Расчет учитывает рабочие дни"
                  description="Исключены пятница и суббота. Расчет основан на средней производительности."
                  type="info"
                  showIcon
                />
              )}
            </Card>

            {/* Общая статистика */}
            <Row gutter={16}>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Общее время работы"
                    value={formatTime(analytics.totalTime)}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Время наладки"
                    value={formatTime(analytics.setupData.reduce((sum, setup) => sum + setup.time, 0))}
                    prefix={<SettingOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Дневных смен"
                    value={analytics.dayShiftData.length}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Ночных смен"
                    value={analytics.nightShiftData.length}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <UserOutlined />
                Дневные смены
                <Badge count={analytics.dayShiftData.length} />
              </Space>
            }
            key="day-shifts"
          >
            <Card title="📅 История дневных смен">
              {analytics.dayShiftData.length > 0 ? (
                <Table
                  dataSource={analytics.dayShiftData}
                  columns={shiftsColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="date"
                  size="small"
                />
              ) : (
                <Empty description="Нет данных о дневных сменах" />
              )}
            </Card>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <UserOutlined />
                Ночные смены
                <Badge count={analytics.nightShiftData.length} />
              </Space>
            }
            key="night-shifts"
          >
            <Card title="🌙 История ночных смен">
              {analytics.nightShiftData.length > 0 ? (
                <Table
                  dataSource={analytics.nightShiftData}
                  columns={shiftsColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="date"
                  size="small"
                />
              ) : (
                <Empty description="Нет данных о ночных сменах" />
              )}
            </Card>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <SettingOutlined />
                Наладка
                <Badge count={analytics.setupData.length} />
              </Space>
            }
            key="setup"
          >
            <Card title="🔧 История наладки">
              {analytics.setupData.length > 0 ? (
                <Table
                  dataSource={analytics.setupData}
                  columns={setupColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="date"
                  size="small"
                />
              ) : (
                <Empty description="Нет данных о наладке" />
              )}
            </Card>
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
};