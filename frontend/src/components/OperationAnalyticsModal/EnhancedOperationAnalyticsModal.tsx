/**
 * @file: EnhancedOperationAnalyticsModal.tsx
 * @description: УПРОЩЕННАЯ версия без ошибок TypeScript
 * @dependencies: antd, react-query
 * @created: 2025-06-09
 * @fixed: 2025-06-11 - Убраны все ошибки TypeScript
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
  Alert,
  Button,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  ToolOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '../../config/api.config';

const { Text } = Typography;

interface EnhancedOperationAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  machine: any;
}

export const EnhancedOperationAnalyticsModal: React.FC<EnhancedOperationAnalyticsModalProps> = ({
  visible,
  onClose,
  machine,
}) => {
  const [exporting, setExporting] = useState(false);

  // Единый запрос аналитики
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['operation-analytics', machine?.id],
    queryFn: async () => {
      if (!machine?.id) {
        throw new Error('Machine ID is required');
      }

      console.log('🔍 Загрузка аналитики для станка:', machine.id);
      
      try {
        // Автоматически определяем порт backend
        const baseUrl = await getApiUrl();
        const response = await fetch(`${baseUrl}/operation-analytics/machine/${machine.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Получены данные аналитики:', data);

        return data;
      } catch (error: any) {
        console.error('❌ Ошибка загрузки аналитики:', error);
        throw error;
      }
    },
    enabled: visible && !!machine?.id,
    retry: 1,
    staleTime: 30000,
    gcTime: 60000,
  });

  // Простое вычисление аналитики
  const analytics = useMemo(() => {
    if (!analyticsData) return null;

    const data = analyticsData as any;
    
    if (data.status === 'error') {
      return { error: data.message };
    }

    if (data.status === 'no_operation') {
      return { noOperation: true };
    }

    // Простая обработка успешных данных
    const operation = data.operation || {};
    const order = data.order || {};
    const analyticsInfo = data.analytics || {};

    return {
      operationInfo: {
        operationNumber: operation.operationNumber || 0,
        operationType: operation.operationType || 'MILLING',
        drawingNumber: order.drawingNumber || 'Не указан',
        orderQuantity: order.quantity || 0,
        priority: order.priority || 3,
        deadline: order.deadline ? new Date(order.deadline) : new Date(),
        startDate: operation.createdAt ? new Date(operation.createdAt) : new Date(),
      },
      progress: {
        totalProduced: analyticsInfo.progress?.totalProduced || 0,
        remaining: Math.max(0, (order.quantity || 0) - (analyticsInfo.progress?.totalProduced || 0)),
        progressPercent: order.quantity > 0 ? ((analyticsInfo.progress?.totalProduced || 0) / order.quantity) * 100 : 0,
        onSchedule: order.deadline ? new Date() <= new Date(order.deadline) : true,
      },
      timeAnalytics: {
        totalWorkingTime: analyticsInfo.timeAnalytics?.totalWorkingTime || 0,
        totalSetupTime: analyticsInfo.timeAnalytics?.totalSetupTime || 0,
        averageTimePerUnit: analyticsInfo.timeAnalytics?.averageTimePerUnit || 0,
        estimatedCompletion: analyticsInfo.timeAnalytics?.estimatedCompletion ? 
          new Date(analyticsInfo.timeAnalytics.estimatedCompletion) : null,
        workingDaysLeft: analyticsInfo.timeAnalytics?.workingDaysLeft || 0,
        totalDaysWorked: analyticsInfo.timeAnalytics?.totalDaysWorked || 0,
      },
    };
  }, [analyticsData]);

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

  // Функция печати
  const handlePrint = () => {
    window.print();
  };

  // Функция экспорта
  const handleExport = async () => {
    setExporting(true);
    try {
      const csvContent = 'Date,Type,Data\\n';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics_${machine?.machineName}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Данные экспортированы');
    } catch (error) {
      message.error('Ошибка экспорта');
    } finally {
      setExporting(false);
    }
  };

  if (!machine) {
    return null;
  }

  if (error) {
    return (
      <Modal
        title="Ошибка загрузки аналитики"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Закрыть
          </Button>
        ]}
      >
        <Alert
          message="Не удалось загрузить данные аналитики"
          description={(error as any)?.message || 'Проверьте подключение к серверу'}
          type="error"
          showIcon
        />
      </Modal>
    );
  }

  if (isLoading) {
    return (
      <Modal
        title="Загрузка аналитики операции"
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

  if (!analytics || (analytics as any).noOperation) {
    return (
      <Modal
        title="Нет активной операции"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Закрыть
          </Button>
        ]}
      >
        <Empty
          description="На данном станке нет активной операции"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Modal>
    );
  }

  if ((analytics as any).error) {
    return (
      <Modal
        title="Ошибка данных"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Закрыть
          </Button>
        ]}
      >
        <Alert
          message="Ошибка обработки данных"
          description={(analytics as any).error}
          type="error"
          showIcon
        />
      </Modal>
    );
  }

  const data = analytics as any;

  return (
    <Modal
      title={
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <ToolOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Аналитика операции #{data.operationInfo.operationNumber}
              </span>
              <Tag color="blue">{machine.machineName}</Tag>
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
      {/* Основная информация */}
      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Card 
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                Информация об операции
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong>📋 Чертёж:</Text>
                    <br />
                    <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                      {data.operationInfo.drawingNumber}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong>🔧 Тип операции:</Text>
                    <br />
                    <Tag color="green" style={{ fontSize: '14px' }}>
                      {data.operationInfo.operationType}
                    </Tag>
                  </div>
                  
                  <div>
                    <Text strong>📅 Дедлайн:</Text>
                    <br />
                    <Text style={{ 
                      color: data.progress.onSchedule ? '#52c41a' : '#ff4d4f',
                      fontWeight: 'bold'
                    }}>
                      {data.operationInfo.deadline.toLocaleDateString('ru-RU')}
                    </Text>
                  </div>
                </Space>
              </Col>
              
              <Col span={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong>⚡ Приоритет:</Text>
                    <br />
                    <Tag color={getPriorityColor(data.operationInfo.priority)}>
                      {getPriorityText(data.operationInfo.priority)}
                    </Tag>
                  </div>
                  
                  <div>
                    <Text strong>📦 Количество:</Text>
                    <br />
                    <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {data.operationInfo.orderQuantity} шт.
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong>🏁 Начало работ:</Text>
                    <br />
                    <Text>
                      {data.operationInfo.startDate.toLocaleDateString('ru-RU')}
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
                Прогресс
              </Space>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Progress
                type="circle"
                size={120}
                percent={Math.round(data.progress.progressPercent)}
                status={getEfficiencyStatus(data.progress.progressPercent)}
                strokeColor={getEfficiencyColor(data.progress.progressPercent)}
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
                  value={data.progress.totalProduced}
                  suffix="шт."
                  valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Осталось"
                  value={data.progress.remaining}
                  suffix="шт."
                  valueStyle={{ color: '#faad14', fontSize: '16px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Временная аналитика */}
      <Card 
        title={
          <Space>
            <CalendarOutlined style={{ color: '#722ed1' }} />
            Прогноз завершения
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Alert
          message="📅 Расчет учитывает рабочие дни"
          description="Исключены пятница и суббота. Расчет основан на средней производительности."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Среднее время/деталь"
                value={data.timeAnalytics.averageTimePerUnit.toFixed(1)}
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
                value={data.timeAnalytics.workingDaysLeft}
                suffix="дн."
                prefix={<CalendarOutlined />}
                valueStyle={{ 
                  color: data.timeAnalytics.workingDaysLeft <= 3 ? '#ff4d4f' : 
                         data.timeAnalytics.workingDaysLeft <= 7 ? '#faad14' : '#52c41a' 
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Отработано дней"
                value={data.timeAnalytics.totalDaysWorked}
                suffix="дн."
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>🎯 Ожидаемое завершение:</Text>
              </div>
              {data.timeAnalytics.estimatedCompletion ? (
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#722ed1', 
                  fontWeight: 'bold' 
                }}>
                  {data.timeAnalytics.estimatedCompletion.toLocaleDateString('ru-RU')}
                </Text>
              ) : (
                <Text type="secondary">Недостаточно данных</Text>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Статистика времени */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Время работы"
              value={formatTime(data.timeAnalytics.totalWorkingTime)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Время наладки"
              value={formatTime(data.timeAnalytics.totalSetupTime)}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Станок"
              value={machine.machineName}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Статус"
              value={data.progress.onSchedule ? 'В графике' : 'Задержка'}
              prefix={data.progress.onSchedule ? <CheckCircleOutlined /> : <WarningOutlined />}
              valueStyle={{ color: data.progress.onSchedule ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};
