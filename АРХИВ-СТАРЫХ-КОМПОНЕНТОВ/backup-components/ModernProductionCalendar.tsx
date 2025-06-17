/**
 * @file: ModernProductionCalendar.tsx
 * @description: Современный календарь производства с улучшенным дизайном и реальными данными
 * @created: 2025-06-16
 */
import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Badge,
  Tooltip,
  Spin,
  Alert,
  Empty,
  Progress,
  Space,
  Typography,
  Button,
  Popover,
  Statistic,
  Row,
  Col,
  Timeline,
  Avatar,
  Divider,
  Switch,
  Select,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  CalendarOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CoffeeOutlined,
  ToolOutlined,
  UserOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { enhancedCalendarApi } from '../../../services/enhancedCalendarApi';
import './CalendarStyles.css';

const { Text, Title } = Typography;

dayjs.locale('ru');

interface ModernCalendarProps {
  filter: {
    startDate: string;
    endDate: string;
    showWeekends?: boolean;
    showEfficiency?: boolean;
    showSetupTime?: boolean;
    viewMode?: 'detailed' | 'compact';
  };
}

interface CalendarDay {
  date: string;
  isWorkingDay: boolean;
  dayType: string;
  completedShifts?: any[];
  plannedOperation?: any;
}

interface MachineSchedule {
  machineId: number;
  machineName: string;
  machineType: string;
  currentOperation?: any;
  days: CalendarDay[];
}

export const ModernProductionCalendar: React.FC<ModernCalendarProps> = ({ filter }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'kanban'>('grid');
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [selectedMachineType, setSelectedMachineType] = useState<string>('all');

  const { 
    data: calendarData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['modern-calendar', filter.startDate, filter.endDate],
    queryFn: () => enhancedCalendarApi.getEnhancedCalendarView(filter.startDate, filter.endDate),
    refetchInterval: 30000,
  });

  // Фильтрация данных
  const filteredMachines = useMemo(() => {
    if (!calendarData?.machineSchedules) return [];
    
    let machines = calendarData.machineSchedules;
    
    // Фильтр по типу станка
    if (selectedMachineType !== 'all') {
      machines = machines.filter((m: MachineSchedule) => m.machineType === selectedMachineType);
    }
    
    // Фильтр только завершенных операций
    if (showCompletedOnly) {
      machines = machines.filter((m: MachineSchedule) => 
        m.days.some((d: CalendarDay) => d.completedShifts && d.completedShifts.length > 0)
      );
    }
    
    return machines;
  }, [calendarData, selectedMachineType, showCompletedOnly]);

  // Получение уникальных типов станков
  const machineTypes = useMemo(() => {
    if (!calendarData?.machineSchedules) return [];
    const types = [...new Set(calendarData.machineSchedules.map((m: MachineSchedule) => m.machineType))];
    return types;
  }, [calendarData]);

  // Цветовая схема для станков
  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'MILLING': return '#1890ff';
      case 'TURNING': return '#52c41a';
      case 'DRILLING': return '#faad14';
      default: return '#722ed1';
    }
  };

  // Получение иконки для типа станка
  const getMachineTypeIcon = (type: string) => {
    switch (type) {
      case 'MILLING': return <ToolOutlined />;
      case 'TURNING': return <SettingOutlined />;
      case 'DRILLING': return <ThunderboltOutlined />;
      default: return <SettingOutlined />;
    }
  };

  // Получение статуса операции
  const getOperationStatus = (day: CalendarDay) => {
    if (day.completedShifts && day.completedShifts.length > 0) return 'completed';
    if (day.plannedOperation) {
      const progress = day.plannedOperation.currentProgress?.progressPercent || 0;
      if (progress === 100) return 'finished';
      if (progress > 0) return 'in-progress';
      return 'planned';
    }
    return 'free';
  };

  // Цвета для статусов
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#52c41a';
      case 'finished': return '#13c2c2';
      case 'in-progress': return '#1890ff';
      case 'planned': return '#faad14';
      case 'free': return '#d9d9d9';
      default: return '#f5f5f5';
    }
  };

  // Рендер карточки станка для Grid режима
  const renderMachineCard = (machine: MachineSchedule) => {
    const workingDays = machine.days.filter(d => d.isWorkingDay);
    const busyDays = workingDays.filter(d => 
      (d.completedShifts && d.completedShifts.length > 0) || d.plannedOperation
    );
    const utilization = workingDays.length > 0 ? (busyDays.length / workingDays.length) * 100 : 0;

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={machine.machineId}>
        <Card
          size="small"
          hoverable
          className={`machine-card ${utilization > 80 ? 'busy' : utilization > 50 ? 'moderate' : 'available'}`}
          style={{
            borderLeft: `4px solid ${getMachineTypeColor(machine.machineType)}`,
            height: '100%',
          }}
          title={
            <Space>
              <Avatar 
                icon={getMachineTypeIcon(machine.machineType)}
                style={{ backgroundColor: getMachineTypeColor(machine.machineType) }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>{machine.machineName}</div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {machine.machineType === 'MILLING' ? 'Фрезерный' : 'Токарный'}
                </Text>
              </div>
            </Space>
          }
          extra={
            <Badge 
              status={utilization > 80 ? 'error' : utilization > 50 ? 'warning' : 'success'}
              text={`${Math.round(utilization)}%`}
            />
          }
        >
          {/* Текущая операция */}
          {machine.currentOperation && (
            <div style={{ marginBottom: 12 }}>
              <Tag icon={<PlayCircleOutlined />} color="blue">
                {machine.currentOperation.drawingNumber}
              </Tag>
              <Progress
                percent={machine.currentOperation.progressPercent || 0}
                size="small"
                strokeColor="#1890ff"
                format={(percent) => `${machine.currentOperation.completedQuantity}/${machine.currentOperation.totalQuantity}`}
              />
            </div>
          )}

          {/* Мини-календарь */}
          <div className="mini-calendar" style={{ marginTop: 8 }}>
              {workingDays.slice(0, 14).map((day: CalendarDay) => {
                const status = getOperationStatus(day);
                const isToday = dayjs(day.date).isSame(dayjs(), 'day');
                
                return (
                  <Tooltip 
                    key={day.date}
                    title={`${dayjs(day.date).format('DD.MM')} - ${status === 'free' ? 'Свободен' : status === 'completed' ? 'Выполнено' : 'Запланировано'}`}
                    overlayClassName="custom-tooltip"
                  >
                    <div
                      className={`mini-calendar-day status-${status} ${isToday ? 'today' : ''}`}
                      style={{
                        backgroundColor: getStatusColor(status),
                      }}
                    />
                  </Tooltip>
                );
              })}
          </div>

          {/* Статистика */}
          <div style={{ marginTop: 12, fontSize: '12px' }}>
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="Загрузка"
                  value={utilization}
                  precision={0}
                  suffix="%"
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Дней в работе"
                  value={busyDays.length}
                  suffix={`/${workingDays.length}`}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
            </Row>
          </div>
        </Card>
      </Col>
    );
  };

  // Рендер таймлайна для Timeline режима
  const renderTimelineView = () => {
    return filteredMachines.map((machine: MachineSchedule) => (
      <Card key={machine.machineId} style={{ marginBottom: 16 }}>
        <Title level={5}>
          <Space>
            {getMachineTypeIcon(machine.machineType)}
            {machine.machineName}
            <Tag color={getMachineTypeColor(machine.machineType)}>
              {machine.machineType === 'MILLING' ? 'Фрезерный' : 'Токарный'}
            </Tag>
          </Space>
        </Title>
        
        <Timeline mode="left">
          {machine.days
            .filter(d => d.isWorkingDay && ((d.completedShifts && d.completedShifts.length > 0) || d.plannedOperation))
            .map((day: CalendarDay) => {
              const date = dayjs(day.date);
              const isToday = date.isSame(dayjs(), 'day');
              
              return (
                <Timeline.Item
                  key={day.date}
                  color={isToday ? 'blue' : 'green'}
                  dot={isToday ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                  label={date.format('DD.MM (ddd)')}
                >
                  {day.completedShifts?.map((shift, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <Tag color={shift.shiftType === 'DAY' ? 'orange' : 'purple'}>
                        {shift.shiftType === 'DAY' ? '☀️ День' : '🌙 Ночь'}
                      </Tag>
                      <Text strong>{shift.drawingNumber}</Text>
                      <Text type="secondary"> - {shift.quantityProduced} дет.</Text>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        👤 {shift.operatorName} • ⏱️ {shift.timePerPart} мин/дет • 📊 {shift.efficiency}%
                      </div>
                    </div>
                  ))}
                  
                  {day.plannedOperation && (
                    <div>
                      <Tag color="blue">
                        <PlayCircleOutlined /> Запланировано
                      </Tag>
                      <Text strong>{day.plannedOperation.drawingNumber}</Text>
                      <Progress
                      percent={day.plannedOperation.currentProgress?.progressPercent || 0}
                      size="small"
                      className={`modern-progress ${day.plannedOperation.currentProgress?.progressPercent === 100 ? 'completed' : 'default'}`}
                        style={{ marginTop: 4 }}
              />
                    </div>
                  )}
                </Timeline.Item>
              );
            })}
        </Timeline>
      </Card>
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', fontSize: '16px' }}>
            Загрузка современного календаря...
          </div>
        </div>
      </Card>
    );
  }

  if (error || !calendarData) {
    return (
      <Card>
        <Alert
          message="Ошибка загрузки календаря"
          description="Не удалось загрузить данные производственного календаря"
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()}>
              <ReloadOutlined /> Повторить
            </Button>
          }
        />
      </Card>
    );
  }

  if (!filteredMachines || filteredMachines.length === 0) {
    return (
      <Card>
        <Empty 
          description="Нет данных для отображения" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="modern-calendar-container">
      {/* Заголовок и фильтры */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CalendarOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
              <Title level={4} style={{ margin: 0 }}>
                Современный календарь производства
              </Title>
              <Tag color="blue">
                {dayjs(filter.startDate).format('DD.MM')} - {dayjs(filter.endDate).format('DD.MM.YYYY')}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedMachineType}
                onChange={setSelectedMachineType}
                style={{ width: 120 }}
                size="small"
              >
                <Select.Option value="all">Все типы</Select.Option>
                {machineTypes.map(type => (
                  <Select.Option key={type} value={type}>
                    {type === 'MILLING' ? 'Фрезерные' : 'Токарные'}
                  </Select.Option>
                ))}
              </Select>
              
              <Switch
                checked={showCompletedOnly}
                onChange={setShowCompletedOnly}
                checkedChildren="✅"
                unCheckedChildren="📋"
                size="small"
              />
              
              <Button.Group size="small">
                <Button 
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                  icon={<BarChartOutlined />}
                >
                  Сетка
                </Button>
                <Button 
                  type={viewMode === 'timeline' ? 'primary' : 'default'}
                  onClick={() => setViewMode('timeline')}
                  icon={<ClockCircleOutlined />}
                >
                  Таймлайн
                </Button>
              </Button.Group>
              
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => refetch()}
                loading={isLoading}
                size="small"
              >
                Обновить
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Всего станков"
              value={filteredMachines.length}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="В работе"
              value={filteredMachines.filter((m: MachineSchedule) => m.currentOperation).length}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Рабочих дней"
              value={calendarData.totalWorkingDays || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Средняя загрузка"
              value={Math.round(filteredMachines.reduce((acc: number, m: MachineSchedule) => {
                const workingDays = m.days.filter(d => d.isWorkingDay).length;
                const busyDays = m.days.filter(d => (d.completedShifts && d.completedShifts.length > 0) || d.plannedOperation).length;
                return acc + (workingDays > 0 ? (busyDays / workingDays) * 100 : 0);
              }, 0) / (filteredMachines.length || 1))}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Основной контент */}
      {viewMode === 'grid' && (
        <Row gutter={[16, 16]}>
          {filteredMachines.map(renderMachineCard)}
        </Row>
      )}

      {viewMode === 'timeline' && (
        <div>
          {renderTimelineView()}
        </div>
      )}

      {/* Легенда */}
      <Card style={{ marginTop: 16 }} size="small">
        <Title level={5}>Обозначения:</Title>
        <Space wrap>
          <Tag color="green">✅ Операция выполнена</Tag>
          <Tag color="cyan">🎯 Операция завершена</Tag>
          <Tag color="blue">⏳ В процессе выполнения</Tag>
          <Tag color="orange">📋 Запланировано</Tag>
          <Tag color="default">⚪ Станок свободен</Tag>
          <Tag icon={<ToolOutlined />} color="blue">Фрезерные станки</Tag>
          <Tag icon={<SettingOutlined />} color="green">Токарные станки</Tag>
        </Space>
      </Card>
    </div>
  );
};
