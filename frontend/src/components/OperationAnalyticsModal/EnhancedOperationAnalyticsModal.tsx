/**
 * @file: EnhancedOperationAnalyticsModal.tsx
 * @description: Полная аналитика операции с расчетом времени завершения и детальной статистикой
 * @dependencies: antd, react-query, chart.js, различные API
 * @created: 2025-06-09
 */
import React, { useState, useMemo } from 'react';
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
  List,
  Avatar,
  Rate,
  Tooltip,
  DatePicker,
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
  FireOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  PrinterOutlined,
  DownloadOutlined,
  StarOutlined,
  TeamOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface EnhancedOperationAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  machine: any;
}

interface OperationAnalytics {
  // Основная информация
  operationInfo: {
    operationNumber: number;
    operationType: string;
    drawingNumber: string;
    orderQuantity: number;
    priority: number;
    deadline: Date;
    startDate: Date;
  };
  
  // Прогресс выполнения
  progress: {
    totalProduced: number;
    remaining: number;
    progressPercent: number;
    onSchedule: boolean;
    daysOverdue: number;
  };
  
  // Временная аналитика
  timeAnalytics: {
    totalWorkingTime: number;
    totalSetupTime: number;
    averageTimePerUnit: number;
    estimatedCompletion: Date | null;
    workingDaysLeft: number;
    totalDaysWorked: number;
  };
  
  // Данные смен
  shiftsData: {
    dayShifts: ShiftRecord[];
    nightShifts: ShiftRecord[];
    setupRecords: SetupRecord[];
    totalShifts: number;
  };
  
  // Аналитика операторов
  operatorAnalytics: OperatorPerformance[];
  
  // Ежедневная производительность
  dailyPerformance: DailyPerformance[];
  
  // Рекомендации
  recommendations: Recommendation[];
}

interface ShiftRecord {
  id: number;
  date: string;
  shiftType: 'DAY' | 'NIGHT';
  quantity: number;
  timePerUnit: number;
  operator: string;
  totalTime: number;
  efficiency: number;
  quality: 'excellent' | 'good' | 'average' | 'poor';
}

interface SetupRecord {
  id: number;
  date: string;
  setupTime: number;
  operator: string;
  complexity: 'simple' | 'medium' | 'complex';
  issues?: string;
}

interface OperatorPerformance {
  operatorName: string;
  totalShifts: number;
  totalQuantity: number;
  averageTimePerUnit: number;
  efficiency: number;
  qualityRating: number;
  preferredShift: 'DAY' | 'NIGHT' | 'BOTH';
  experience: 'junior' | 'middle' | 'senior';
  setupCount: number;
}

interface DailyPerformance {
  date: string;
  plannedQuantity: number;
  actualQuantity: number;
  efficiency: number;
  dayShiftQuantity: number;
  nightShiftQuantity: number;
  setupTime: number;
  workingTime: number;
  issues: string[];
}

interface Recommendation {
  type: 'optimization' | 'warning' | 'training' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: boolean;
  estimatedImpact: string;
}

export const EnhancedOperationAnalyticsModal: React.FC<EnhancedOperationAnalyticsModalProps> = ({
  visible,
  onClose,
  machine,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  // Загрузка данных смен для этого станка
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', 'machine', machine?.id, dateRange],
    queryFn: async () => {
      // Временная заглушка - будет заменена на реальный API
      return [
        {
          id: 1,
          date: '2025-06-08',
          dayShiftQuantity: 10,
          nightShiftQuantity: 20,
          dayShiftTimePerUnit: '25.00',
          nightShiftTimePerUnit: '25.00',
          dayShiftOperator: 'Kirill',
          nightShiftOperator: 'Аркадий',
          setupTime: 220,
          setupOperator: 'Denis',
        }
      ];
    },
    enabled: visible && !!machine?.id,
  });

  // Загрузка информации об операции
  const { data: operationDetails, isLoading: operationLoading } = useQuery({
    queryKey: ['operation', machine?.currentOperationId],
    queryFn: async () => {
      // Временная заглушка
      return {
        operationNumber: machine?.currentOperationDetails?.operationNumber || 1,
        operationtype: machine?.currentOperationDetails?.operationType || 'MILLING',
        estimatedTime: machine?.currentOperationDetails?.estimatedTime || 500,
        createdAt: new Date().toISOString(),
        orderId: 1,
      };
    },
    enabled: visible && !!machine?.currentOperationId,
  });

  // Загрузка информации о заказе
  const { data: orderDetails, isLoading: orderLoading } = useQuery({
    queryKey: ['order', operationDetails?.orderId],
    queryFn: async () => {
      // Временная заглушка
      return {
        drawing_number: machine?.currentOperationDetails?.orderDrawingNumber || 'C6HP0021A',
        quantity: machine?.currentOperationDetails?.orderQuantity || 100,
        priority: machine?.currentOperationDetails?.orderPriority || 2,
        deadline: machine?.currentOperationDetails?.orderDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    },
    enabled: visible && !!operationDetails?.orderId,
  });

  // Вычисление аналитики
  const analytics = useMemo<OperationAnalytics | null>(() => {
    if (!shifts || !operationDetails || !orderDetails) return null;

    // Функция для расчета рабочих дней (исключая пятницу и субботу)
    const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
      let count = 0;
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Не пятница и не суббота
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    };

    // Функция для добавления рабочих дней
    const addWorkingDays = (startDate: Date, daysToAdd: number): Date => {
      const result = new Date(startDate);
      let addedDays = 0;
      
      while (addedDays < daysToAdd) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        
        if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Не пятница и не суббота
          addedDays++;
        }
      }
      
      return result;
    };

    // Обработка данных смен
    const dayShifts: ShiftRecord[] = [];
    const nightShifts: ShiftRecord[] = [];
    const setupRecords: SetupRecord[] = [];
    
    let totalProduced = 0;
    let totalWorkingTime = 0;
    let totalSetupTime = 0;

    shifts.forEach((shift: any) => {
      if (shift.dayShiftQuantity && shift.dayShiftQuantity > 0) {
        const dayShift: ShiftRecord = {
          id: shift.id,
          date: shift.date,
          shiftType: 'DAY',
          quantity: shift.dayShiftQuantity,
          timePerUnit: parseFloat(shift.dayShiftTimePerUnit) || 0,
          operator: shift.dayShiftOperator || 'Не указан',
          totalTime: shift.dayShiftQuantity * (parseFloat(shift.dayShiftTimePerUnit) || 0),
          efficiency: calculateEfficiency(shift.dayShiftQuantity, parseFloat(shift.dayShiftTimePerUnit) || 0),
          quality: 'good', // Можно добавить логику оценки качества
        };
        dayShifts.push(dayShift);
        totalProduced += dayShift.quantity;
        totalWorkingTime += dayShift.totalTime;
      }

      if (shift.nightShiftQuantity && shift.nightShiftQuantity > 0) {
        const nightShift: ShiftRecord = {
          id: shift.id,
          date: shift.date,
          shiftType: 'NIGHT',
          quantity: shift.nightShiftQuantity,
          timePerUnit: parseFloat(shift.nightShiftTimePerUnit) || 0,
          operator: shift.nightShiftOperator || 'Не указан',
          totalTime: shift.nightShiftQuantity * (parseFloat(shift.nightShiftTimePerUnit) || 0),
          efficiency: calculateEfficiency(shift.nightShiftQuantity, parseFloat(shift.nightShiftTimePerUnit) || 0),
          quality: 'good',
        };
        nightShifts.push(nightShift);
        totalProduced += nightShift.quantity;
        totalWorkingTime += nightShift.totalTime;
      }

      if (shift.setupTime && shift.setupTime > 0) {
        const setupRecord: SetupRecord = {
          id: shift.id,
          date: shift.date,
          setupTime: shift.setupTime,
          operator: shift.setupOperator || 'Не указан',
          complexity: shift.setupTime > 120 ? 'complex' : shift.setupTime > 60 ? 'medium' : 'simple',
        };
        setupRecords.push(setupRecord);
        totalSetupTime += setupRecord.setupTime;
      }
    });

    function calculateEfficiency(quantity: number, timePerUnit: number): number {
      // Базовое время для оценки (может быть из нормативов)
      const baseTimePerUnit = operationDetails?.estimatedTime || 0;
      const orderQuantity = orderDetails?.quantity || 1;
      const normalizedTime = baseTimePerUnit / orderQuantity;
      return normalizedTime > 0 ? Math.min(100, (normalizedTime / timePerUnit) * 100) : 85;
    }

    // Расчет аналитики операторов
    const operatorMap = new Map<string, OperatorPerformance>();
    
    [...dayShifts, ...nightShifts].forEach(shift => {
      if (!operatorMap.has(shift.operator)) {
        operatorMap.set(shift.operator, {
          operatorName: shift.operator,
          totalShifts: 0,
          totalQuantity: 0,
          averageTimePerUnit: 0,
          efficiency: 0,
          qualityRating: 4,
          preferredShift: 'DAY',
          experience: 'middle',
          setupCount: 0,
        });
      }
      
      const operator = operatorMap.get(shift.operator)!;
      operator.totalShifts++;
      operator.totalQuantity += shift.quantity;
      operator.efficiency = (operator.efficiency * (operator.totalShifts - 1) + shift.efficiency) / operator.totalShifts;
    });

    setupRecords.forEach(setup => {
      if (operatorMap.has(setup.operator)) {
        operatorMap.get(setup.operator)!.setupCount++;
      }
    });

    // Обновляем среднее время на деталь для каждого оператора
    operatorMap.forEach(operator => {
      const operatorShifts = [...dayShifts, ...nightShifts].filter(s => s.operator === operator.operatorName);
      if (operatorShifts.length > 0) {
        operator.averageTimePerUnit = operatorShifts.reduce((sum, s) => sum + s.timePerUnit, 0) / operatorShifts.length;
      }
    });

    const operatorAnalytics = Array.from(operatorMap.values());

    // Расчет времени завершения
    const remaining = Math.max(0, orderDetails.quantity - totalProduced);
    const averageTimePerUnit = totalProduced > 0 ? totalWorkingTime / totalProduced : 0;
    
    let estimatedCompletion: Date | null = null;
    let workingDaysLeft = 0;

    if (remaining > 0 && averageTimePerUnit > 0) {
      const remainingTimeMinutes = remaining * averageTimePerUnit;
      const workingHoursPerDay = 16; // 2 смены по 8 часов
      const workingMinutesPerDay = workingHoursPerDay * 60;
      
      const daysNeeded = Math.ceil(remainingTimeMinutes / workingMinutesPerDay);
      workingDaysLeft = daysNeeded;
      
      const currentDate = new Date();
      estimatedCompletion = addWorkingDays(currentDate, daysNeeded);
    }

    // Генерация рекомендаций
    const recommendations: Recommendation[] = [];

    // Анализ эффективности операторов
    const lowEfficiencyOperators = operatorAnalytics.filter(op => op.efficiency < 80);
    if (lowEfficiencyOperators.length > 0) {
      recommendations.push({
        type: 'training',
        priority: 'high',
        title: 'Низкая эффективность операторов',
        description: `Операторы ${lowEfficiencyOperators.map(op => op.operatorName).join(', ')} показывают эффективность ниже 80%. Рекомендуется дополнительное обучение.`,
        actionRequired: true,
        estimatedImpact: 'Увеличение производительности на 15-25%',
      });
    }

    // Анализ времени наладки
    const averageSetupTime = setupRecords.length > 0 ? totalSetupTime / setupRecords.length : 0;
    if (averageSetupTime > 90) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Длительное время наладки',
        description: `Среднее время наладки составляет ${Math.round(averageSetupTime)} минут. Это больше нормы в 90 минут.`,
        actionRequired: false,
        estimatedImpact: 'Экономия 2-4 часов в неделю',
      });
    }

    // Анализ выполнения плана
    const progressPercent = orderDetails.quantity > 0 ? (totalProduced / orderDetails.quantity) * 100 : 0;
    const deadline = new Date(orderDetails.deadline);
    const isOnSchedule = new Date() <= deadline;
    
    if (progressPercent < 90 && !isOnSchedule) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Отставание от плана',
        description: 'Операция отстает от плана. Рекомендуется увеличить количество смен или оптимизировать процесс.',
        actionRequired: true,
        estimatedImpact: 'Соблюдение дедлайна',
      });
    }

    // Анализ распределения нагрузки
    const dayShiftTotal = dayShifts.reduce((sum, s) => sum + s.quantity, 0);
    const nightShiftTotal = nightShifts.reduce((sum, s) => sum + s.quantity, 0);
    
    if (dayShiftTotal > nightShiftTotal * 1.5) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Неравномерная загрузка смен',
        description: 'Дневная смена загружена значительно больше ночной. Рассмотрите перераспределение нагрузки.',
        actionRequired: false,
        estimatedImpact: 'Увеличение общей производительности на 10-15%',
      });
    }

    return {
      operationInfo: {
        operationNumber: operationDetails.operationNumber,
        operationType: operationDetails.operationtype || 'Не указан',
        drawingNumber: orderDetails.drawing_number,
        orderQuantity: orderDetails.quantity,
        priority: orderDetails.priority,
        deadline: new Date(orderDetails.deadline),
        startDate: new Date(operationDetails.createdAt),
      },
      progress: {
        totalProduced,
        remaining,
        progressPercent,
        onSchedule: isOnSchedule,
        daysOverdue: !isOnSchedule ? Math.ceil((new Date().getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      },
      timeAnalytics: {
        totalWorkingTime,
        totalSetupTime,
        averageTimePerUnit,
        estimatedCompletion,
        workingDaysLeft,
        totalDaysWorked: calculateWorkingDays(new Date(operationDetails.createdAt), new Date()),
      },
      shiftsData: {
        dayShifts,
        nightShifts,
        setupRecords,
        totalShifts: dayShifts.length + nightShifts.length,
      },
      operatorAnalytics,
      dailyPerformance: [], // Можно добавить позже
      recommendations,
    };
  }, [shifts, operationDetails, orderDetails]);

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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'red';
      case 2: return 'orange';
      case 3: return 'yellow';
      default: return 'green';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Критический';
      case 2: return 'Высокий';
      case 3: return 'Средний';
      default: return 'Низкий';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <StarOutlined style={{ color: '#52c41a' }} />;
      case 'good': return <CheckCircleOutlined style={{ color: '#1890ff' }} />;
      case 'average': return <InfoCircleOutlined style={{ color: '#faad14' }} />;
      default: return <WarningOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  const shiftsColumns: ColumnsType<ShiftRecord> = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Смена',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (type: 'DAY' | 'NIGHT') => (
        <Tag color={type === 'DAY' ? 'blue' : 'purple'}>
          {type === 'DAY' ? '☀️ День' : '🌙 Ночь'}
        </Tag>
      ),
      filters: [
        { text: 'Дневная', value: 'DAY' },
        { text: 'Ночная', value: 'NIGHT' },
      ],
      onFilter: (value, record) => record.shiftType === value,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <Text strong style={{ color: '#1890ff' }}>{quantity} шт.</Text>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Оператор',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {operator}
        </Space>
      ),
    },
    {
      title: 'Время/деталь',
      dataIndex: 'timePerUnit',
      key: 'timePerUnit',
      render: (time: number) => formatTime(time),
      sorter: (a, b) => a.timePerUnit - b.timePerUnit,
    },
    {
      title: 'Общее время',
      dataIndex: 'totalTime',
      key: 'totalTime',
      render: (time: number) => (
        <Text strong>{formatTime(time)}</Text>
      ),
      sorter: (a, b) => a.totalTime - b.totalTime,
    },
    {
      title: 'Эффективность',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => (
        <Space>
          <Progress
            type="circle"
            size={40}
            percent={Math.round(efficiency)}
            status={getEfficiencyStatus(efficiency)}
            strokeColor={getEfficiencyColor(efficiency)}
          />
          <Text strong>{Math.round(efficiency)}%</Text>
        </Space>
      ),
      sorter: (a, b) => a.efficiency - b.efficiency,
    },
    {
      title: 'Качество',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality: string) => getQualityIcon(quality),
      align: 'center',
    },
  ];

  const setupColumns: ColumnsType<SetupRecord> = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Время наладки',
      dataIndex: 'setupTime',
      key: 'setupTime',
      render: (time: number) => (
        <Space>
          <SettingOutlined style={{ color: '#fa8c16' }} />
          <Text strong style={{ color: '#fa8c16' }}>{formatTime(time)}</Text>
        </Space>
      ),
    },
    {
      title: 'Оператор',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: string) => (
        <Space>
          <Avatar size="small" icon={<SettingOutlined />} />
          {operator}
        </Space>
      ),
    },
    {
      title: 'Сложность',
      dataIndex: 'complexity',
      key: 'complexity',
      render: (complexity: string) => {
        const colors: Record<string, string> = { simple: 'green', medium: 'orange', complex: 'red' };
        const texts: Record<string, string> = { simple: 'Простая', medium: 'Средняя', complex: 'Сложная' };
        return <Tag color={colors[complexity] || 'default'}>{texts[complexity] || complexity}</Tag>;
      },
    },
  ];

  const operatorColumns: ColumnsType<OperatorPerformance> = [
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (name: string, record: OperatorPerformance) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.experience === 'senior' ? '🏆 Опытный' : 
               record.experience === 'middle' ? '⚡ Средний' : '🌟 Начинающий'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Смены',
      dataIndex: 'totalShifts',
      key: 'totalShifts',
      render: (shifts: number) => (
        <Statistic value={shifts} suffix="смен" />
      ),
      sorter: (a, b) => a.totalShifts - b.totalShifts,
    },
    {
      title: 'Произведено',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      render: (quantity: number) => (
        <Text strong style={{ color: '#1890ff' }}>{quantity} шт.</Text>
      ),
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
    },
    {
      title: 'Время/деталь',
      dataIndex: 'averageTimePerUnit',
      key: 'averageTimePerUnit',
      render: (time: number) => formatTime(time),
      sorter: (a, b) => a.averageTimePerUnit - b.averageTimePerUnit,
    },
    {
      title: 'Эффективность',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => (
        <Progress
          percent={Math.round(efficiency)}
          status={getEfficiencyStatus(efficiency)}
          strokeColor={getEfficiencyColor(efficiency)}
          size="small"
        />
      ),
      sorter: (a, b) => a.efficiency - b.efficiency,
    },
    {
      title: 'Наладки',
      dataIndex: 'setupCount',
      key: 'setupCount',
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#fa8c16' }} />
      ),
      sorter: (a, b) => a.setupCount - b.setupCount,
    },
    {
      title: 'Рейтинг',
      dataIndex: 'qualityRating',
      key: 'qualityRating',
      render: (rating: number) => (
        <Rate disabled value={rating} count={5} style={{ fontSize: '14px' }} />
      ),
    },
  ];

  if (!machine || !analytics) {
    return (
      <Modal
        title="Аналитика операции"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Загрузка аналитики операции...</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <ToolOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Аналитика операции #{analytics.operationInfo.operationNumber}
              </span>
              <Tag color="blue">{machine.machineName}</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<PrinterOutlined />} size="small">
                Печать
              </Button>
              <Button icon={<DownloadOutlined />} size="small">
                Экспорт
              </Button>
            </Space>
          </Col>
        </Row>
      }
      open={visible}
      onCancel={onClose}
      width={1400}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Закрыть
        </Button>
      ]}
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane
          tab={
            <Space>
              <DashboardOutlined />
              Обзор операции
            </Space>
          }
          key="overview"
        >
          {/* Основная информация об операции */}
          <Row gutter={[24, 24]}>
            <Col span={16}>
              <Card 
                title={
                  <Space>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    Информация о заказе
                  </Space>
                }
                style={{ height: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text strong>📋 Чертёж:</Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                          {analytics.operationInfo.drawingNumber}
                        </Text>
                      </div>
                      
                      <div>
                        <Text strong>🔧 Тип операции:</Text>
                        <br />
                        <Tag color="green" style={{ fontSize: '14px' }}>
                          {analytics.operationInfo.operationType}
                        </Tag>
                      </div>
                      
                      <div>
                        <Text strong>📅 Дедлайн:</Text>
                        <br />
                        <Text style={{ 
                          color: analytics.progress.onSchedule ? '#52c41a' : '#ff4d4f',
                          fontWeight: 'bold'
                        }}>
                          {analytics.operationInfo.deadline.toLocaleDateString('ru-RU')}
                        </Text>
                        {!analytics.progress.onSchedule && (
                          <Tag color="red" style={{ marginLeft: 8 }}>
                            Просрочено на {analytics.progress.daysOverdue} дн.
                          </Tag>
                        )}
                      </div>
                    </Space>
                  </Col>
                  
                  <Col span={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text strong>⚡ Приоритет:</Text>
                        <br />
                        <Tag color={getPriorityColor(analytics.operationInfo.priority)} style={{ fontSize: '14px' }}>
                          {getPriorityText(analytics.operationInfo.priority)}
                        </Tag>
                      </div>
                      
                      <div>
                        <Text strong>📦 Количество:</Text>
                        <br />
                        <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {analytics.operationInfo.orderQuantity} шт.
                        </Text>
                      </div>
                      
                      <div>
                        <Text strong>🏁 Начало работ:</Text>
                        <br />
                        <Text>
                          {analytics.operationInfo.startDate.toLocaleDateString('ru-RU')}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined style={{ color: '#52c41a' }} />
                    Прогресс выполнения
                  </Space>
                }
                style={{ height: '100%' }}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Progress
                    type="circle"
                    size={120}
                    percent={Math.round(analytics.progress.progressPercent)}
                    status={getEfficiencyStatus(analytics.progress.progressPercent)}
                    strokeColor={getEfficiencyColor(analytics.progress.progressPercent)}
                    format={(percent) => (
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{percent}%</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>выполнено</div>
                      </div>
                    )}
                  />
                </div>
                
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic
                      title="Готово"
                      value={analytics.progress.totalProduced}
                      suffix="шт."
                      valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Осталось"
                      value={analytics.progress.remaining}
                      suffix="шт."
                      valueStyle={{ color: '#faad14', fontSize: '16px' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Прогноз завершения */}
          <Card 
            title={
              <Space>
                <CalendarOutlined style={{ color: '#722ed1' }} />
                Прогноз завершения работ
              </Space>
            }
            style={{ marginTop: 24 }}
          >
            <Alert
              message="📅 Расчет времени завершения"
              description="Прогноз основан на текущей производительности и учитывает только рабочие дни (исключены пятница и суббота)"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Среднее время/деталь"
                    value={analytics.timeAnalytics.averageTimePerUnit.toFixed(1)}
                    suffix="мин"
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Рабочих дней осталось"
                    value={analytics.timeAnalytics.workingDaysLeft}
                    suffix="дн."
                    prefix={<CalendarOutlined />}
                    valueStyle={{ 
                      color: analytics.timeAnalytics.workingDaysLeft <= 3 ? '#ff4d4f' : 
                             analytics.timeAnalytics.workingDaysLeft <= 7 ? '#faad14' : '#52c41a' 
                    }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Всего отработано"
                    value={analytics.timeAnalytics.totalDaysWorked}
                    suffix="дн."
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>🎯 Ожидаемое завершение:</Text>
                  </div>
                  {analytics.timeAnalytics.estimatedCompletion ? (
                    <Text style={{ 
                      fontSize: '18px', 
                      color: '#722ed1', 
                      fontWeight: 'bold' 
                    }}>
                      {analytics.timeAnalytics.estimatedCompletion.toLocaleDateString('ru-RU')}
                    </Text>
                  ) : (
                    <Text type="secondary">Недостаточно данных</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Общая статистика времени */}
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Время работы"
                  value={formatTime(analytics.timeAnalytics.totalWorkingTime)}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Время наладки"
                  value={formatTime(analytics.timeAnalytics.totalSetupTime)}
                  prefix={<SettingOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Всего смен"
                  value={analytics.shiftsData.totalShifts}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Наладок"
                  value={analytics.shiftsData.setupRecords.length}
                  prefix={<SettingOutlined />}
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
              Детали смен
              <Badge count={analytics.shiftsData.totalShifts} />
            </Space>
          }
          key="shifts"
        >
          <Card
            title={
              <Space>
                <UserOutlined />
                История всех смен
              </Space>
            }
            extra={
              <Space>
                <Text type="secondary">
                  Период: 
                </Text>
                <RangePicker
                  size="small"
                  onChange={setDateRange}
                  placeholder={['С даты', 'По дату']}
                />
              </Space>
            }
          >
            <Table
              dataSource={[...analytics.shiftsData.dayShifts, ...analytics.shiftsData.nightShifts]}
              columns={shiftsColumns}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} смен`
              }}
              rowKey="id"
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <TrophyOutlined />
              Аналитика операторов
              <Badge count={analytics.operatorAnalytics.length} />
            </Space>
          }
          key="operators"
        >
          <Card
            title={
              <Space>
                <TrophyOutlined />
                Сравнение производительности операторов
              </Space>
            }
          >
            <Table
              dataSource={analytics.operatorAnalytics}
              columns={operatorColumns}
              pagination={false}
              rowKey="operatorName"
              size="small"
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <SettingOutlined />
              Наладка
              <Badge count={analytics.shiftsData.setupRecords.length} />
            </Space>
          }
          key="setup"
        >
          <Card
            title={
              <Space>
                <SettingOutlined />
                История наладки
              </Space>
            }
          >
            {analytics.shiftsData.setupRecords.length > 0 ? (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Общее время наладки"
                        value={formatTime(analytics.timeAnalytics.totalSetupTime)}
                        prefix={<SettingOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Среднее время"
                        value={formatTime(analytics.timeAnalytics.totalSetupTime / analytics.shiftsData.setupRecords.length)}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Количество наладок"
                        value={analytics.shiftsData.setupRecords.length}
                        prefix={<ToolOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Table
                  dataSource={analytics.shiftsData.setupRecords}
                  columns={setupColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="id"
                  size="small"
                />
              </>
            ) : (
              <Empty 
                description="Нет данных о наладке"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BulbOutlined />
              Рекомендации
              <Badge count={analytics.recommendations.length} status="processing" />
            </Space>
          }
          key="recommendations"
        >
          <Card
            title={
              <Space>
                <BulbOutlined />
                Автоматические рекомендации по оптимизации
              </Space>
            }
          >
            {analytics.recommendations.length === 0 ? (
              <Alert
                message="🎉 Отличная работа!"
                description="Операция выполняется эффективно, критических замечаний нет."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <List
                dataSource={analytics.recommendations}
                renderItem={(rec, index) => (
                  <List.Item key={index}>
                    <Card 
                      size="small" 
                      style={{ width: '100%' }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <Row align="top">
                        <Col span={2}>
                          {rec.type === 'warning' && <WarningOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />}
                          {rec.type === 'optimization' && <RiseOutlined style={{ color: '#1890ff', fontSize: '20px' }} />}
                          {rec.type === 'training' && <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />}
                          {rec.type === 'maintenance' && <ToolOutlined style={{ color: '#722ed1', fontSize: '20px' }} />}
                        </Col>
                        <Col span={22}>
                          <div style={{ marginBottom: 8 }}>
                            <Space>
                              <Text strong style={{ fontSize: '16px' }}>{rec.title}</Text>
                              <Tag color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'orange' : 'green'}>
                                {rec.priority === 'high' ? 'Высокий' : rec.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                              </Tag>
                              {rec.actionRequired && (
                                <Tag color="red" icon={<ExclamationCircleOutlined />}>
                                  Требует действий
                                </Tag>
                              )}
                            </Space>
                          </div>
                          <Paragraph style={{ marginBottom: 8 }}>
                            {rec.description}
                          </Paragraph>
                          <Text type="secondary" style={{ fontStyle: 'italic' }}>
                            💡 Ожидаемый эффект: {rec.estimatedImpact}
                          </Text>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </Modal>
  );
};