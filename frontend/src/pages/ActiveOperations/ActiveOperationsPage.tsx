/**
 * @file: ActiveOperationsPage.tsx
 * @description: Обновленная страница мониторинга активных операций с полной аналитикой
 * @dependencies: antd, machine.types, EnhancedOperationAnalyticsModal
 * @created: 2025-06-07
 * @updated: 2025-06-09 - Интегрировано новое модальное окно аналитики
 */
import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Alert,
  Spin,
  Empty,
  Progress,
  message,
  Tooltip,
  Badge,
  Statistic
} from 'antd';
import { 
  ToolOutlined, 
  ClockCircleOutlined, 
  PlayCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  TeamOutlined,
  SettingOutlined,
  DashboardOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../services/machinesApi';
import { shiftsApi } from '../../services/shiftsApi';
import { formatEstimatedTime } from '../../types/machine.types';
import { EnhancedOperationAnalyticsModal } from '../../components/OperationAnalyticsModal/EnhancedOperationAnalyticsModal';

const { Title, Text } = Typography;

export const ActiveOperationsPage: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: machines, isLoading, error, refetch } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // Загрузка статистики по сменам (заглушка для будущего API)
  const { data: shiftsStats } = useQuery({
    queryKey: ['shifts-stats'],
    queryFn: async () => ({ averageEfficiency: 87 }), // Заглушка
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  // Функция открытия модального окна аналитики
  const handleOperationClick = async (machine: any) => {
    try {
      console.log(`🔍 Открытие детальной аналитики операции на станке ${machine.machineName}`);
      
      if (!machine.currentOperationDetails && !machine.currentOperationId) {
        message.warning({
          content: 'На данном станке нет активной операции для анализа',
          duration: 3
        });
        return;
      }

      setSelectedMachine(machine);
      setAnalyticsModalVisible(true);
      
      message.success({
        content: 'Загружаем полную аналитику операции...',
        duration: 2
      });
      
    } catch (error) {
      console.error('❌ Ошибка при открытии аналитики операции:', error);
      message.error('Ошибка при загрузке аналитики операции');
    }
  };

  // Функция закрытия модального окна
  const handleAnalyticsModalClose = () => {
    setAnalyticsModalVisible(false);
    setSelectedMachine(null);
  };

  // Функция массового обновления всех данных
  const handleRefreshAll = async () => {
    try {
      message.loading({ content: 'Обновление всех данных...', key: 'refresh-all' });
      
      console.log('🔄 Массовое обновление всех данных...');
      
      // Инвалидируем все кэши
      await queryClient.invalidateQueries({ queryKey: ['machines'] });
      await queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['operations'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts-stats'] });
      
      // Принудительно обновляем
      await refetch();
      
      message.success({ 
        content: 'Все данные обновлены успешно', 
        key: 'refresh-all',
        duration: 2
      });
      
    } catch (error) {
      console.error('❌ Ошибка при массовом обновлении:', error);
      message.error({ 
        content: 'Ошибка при обновлении данных', 
        key: 'refresh-all',
        duration: 3
      });
    }
  };

  // Функция получения цвета приоритета
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#ff4d4f';
      case 2: return '#fa8c16';
      case 3: return '#faad14';
      default: return '#52c41a';
    }
  };

  // Функция получения текста приоритета
  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return '🚨 Критический';
      case 2: return '🔥 Высокий';
      case 3: return '⚡ Средний';
      default: return '✅ Низкий';
    }
  };

  // Функция форматирования времени до дедлайна
  const formatTimeToDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Просрочено на ${Math.abs(diffDays)} дн.`, color: '#ff4d4f' };
    } else if (diffDays === 0) {
      return { text: 'Сегодня!', color: '#fa8c16' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} дн.`, color: '#faad14' };
    } else {
      return { text: `${diffDays} дн.`, color: '#52c41a' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Загрузка активных операций...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description="Не удалось загрузить информацию об активных операциях"
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => refetch()}>
            Попробовать снова
          </Button>
        }
      />
    );
  }

  // Фильтруем станки с активными операциями
  const activeOperations = machines?.filter(machine => 
    machine.currentOperationDetails || machine.currentOperationId
  ) || [];

  const occupiedMachines = machines?.filter(machine => !machine.isAvailable) || [];
  const availableMachines = machines?.filter(machine => machine.isAvailable) || [];

  // Группировка по приоритету
  const operationsByPriority = activeOperations.reduce((acc, machine) => {
    const priority = (machine.currentOperationDetails as any)?.orderPriority || 4;
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(machine);
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Заголовок и статистика */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <DashboardOutlined /> Мониторинг активных операций
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Полная аналитика производственных процессов в реальном времени
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefreshAll}
                type="primary"
                style={{ borderRadius: '8px' }}
              >
                Обновить все
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Row gutter={[24, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title="Активных операций"
                value={activeOperations.length}
                prefix={<PlayCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                операций в работе
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title="Занятых станков"
                value={occupiedMachines.length}
                prefix={<ToolOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                из {machines?.length || 0} станков
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title="Свободных станков"
                value={availableMachines.length}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                готовы к работе
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title="Эффективность"
                value={shiftsStats?.averageEfficiency || 0}
                suffix="%"
                prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                средняя за период
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Операции по приоритетам */}
      {Object.keys(operationsByPriority)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(priority => {
          const priorityNum = parseInt(priority);
          const operations = operationsByPriority[priorityNum];
          
          return (
            <Card 
              key={priority}
              title={
                <Space>
                  <FireOutlined style={{ color: getPriorityColor(priorityNum) }} />
                  <span style={{ color: getPriorityColor(priorityNum), fontWeight: 'bold' }}>
                    {getPriorityText(priorityNum)} приоритет ({operations.length})
                  </span>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 Кликните на операцию для детальной аналитики
                </Text>
              }
              style={{ 
                marginBottom: '24px', 
                borderRadius: '12px',
                borderLeft: `4px solid ${getPriorityColor(priorityNum)}`
              }}
            >
              <Row gutter={[16, 16]}>
                {operations.map((machine) => {
                  const deadline = (machine.currentOperationDetails as any)?.orderDeadline ? 
                    formatTimeToDeadline((machine.currentOperationDetails as any).orderDeadline) :
                    { text: 'Не указан', color: '#d9d9d9' };
                  
                  return (
                    <Col key={machine.id} xs={24} sm={12} lg={8} xl={6}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => handleOperationClick(machine)}
                        style={{
                          borderRadius: '12px',
                          borderColor: getPriorityColor(priorityNum),
                          backgroundColor: priorityNum === 1 ? '#fff2f0' : priorityNum === 2 ? '#fff7e6' : '#f6ffed',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 8px 16px ${getPriorityColor(priorityNum)}30`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '';
                        }}
                        title={
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <ToolOutlined style={{ color: getPriorityColor(priorityNum) }} />
                              <span style={{ color: getPriorityColor(priorityNum), fontWeight: 'bold' }}>
                                {machine.machineName}
                              </span>
                            </Space>
                            <Tooltip title="Открыть детальную аналитику">
                              <EyeOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                            </Tooltip>
                          </Space>
                        }
                      >
                        {/* Полоска приоритета */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          backgroundColor: getPriorityColor(priorityNum)
                        }} />

                        {machine.currentOperationDetails ? (
                          <>
                            <div style={{ marginBottom: '12px' }}>
                              <Space wrap>
                                <Tag color="blue" style={{ borderRadius: '12px' }}>
                                  📋 #{machine.currentOperationDetails.operationNumber}
                                </Tag>
                                <Tag color="green" style={{ borderRadius: '12px', fontSize: '11px' }}>
                                  {machine.currentOperationDetails.operationType}
                                </Tag>
                              </Space>
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <Text strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                                📄 {machine.currentOperationDetails.orderDrawingNumber}
                              </Text>
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  ⏱️ {formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}
                                </Text>
                                <Text style={{ fontSize: '11px', color: deadline.color, fontWeight: 'bold' }}>
                                  📅 {deadline.text}
                                </Text>
                              </Space>
                            </div>

                            {/* Прогресс выполнения */}
                            {(machine.currentOperationDetails as any)?.orderQuantity && (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ marginBottom: '4px' }}>
                                  <Text style={{ fontSize: '11px' }}>
                                    📦 Выполнено: {(machine.currentOperationDetails as any)?.producedQuantity || 0} / {(machine.currentOperationDetails as any)?.orderQuantity}
                                  </Text>
                                </div>
                                <Progress 
                                  percent={Math.round((((machine.currentOperationDetails as any)?.producedQuantity || 0) / (machine.currentOperationDetails as any)?.orderQuantity) * 100)}
                                  size="small"
                                  strokeColor={getPriorityColor(priorityNum)}
                                  showInfo={false}
                                />
                              </div>
                            )}
                            
                            {machine.lastFreedAt && (
                              <div style={{ marginBottom: '12px' }}>
                                <Text type="secondary" style={{ fontSize: '10px' }}>
                                  🕒 Начато: {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
                                </Text>
                              </div>
                            )}
                            
                            <div style={{ 
                              padding: '8px', 
                              backgroundColor: '#f0f9ff', 
                              borderRadius: '6px',
                              border: '1px dashed #1890ff',
                              textAlign: 'center'
                            }}>
                              <Text style={{ fontSize: '11px', color: '#1890ff', fontWeight: 'bold' }}>
                                <BarChartOutlined style={{ marginRight: '4px' }} />
                                Полная аналитика операции
                              </Text>
                            </div>
                          </>
                        ) : (
                          <div>
                            <Tag color="orange" style={{ borderRadius: '12px' }}>
                              Операция {machine.currentOperationId}
                            </Tag>
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Загрузка деталей...
                              </Text>
                            </div>
                            
                            <div style={{ 
                              marginTop: '12px', 
                              padding: '8px', 
                              backgroundColor: '#f0f9ff', 
                              borderRadius: '6px',
                              border: '1px dashed #1890ff',
                              textAlign: 'center'
                            }}>
                              <Text style={{ fontSize: '11px', color: '#1890ff' }}>
                                <BarChartOutlined style={{ marginRight: '4px' }} />
                                Открыть аналитику
                              </Text>
                            </div>
                          </div>
                        )}
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          );
        })}

      {/* Если нет активных операций */}
      {activeOperations.length === 0 && (
        <Card 
          title={
            <Space>
              <PlayCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                Активные операции
              </span>
            </Space>
          }
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Нет активных операций
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Все станки свободны и готовы к работе
                  </Text>
                </div>
              </div>
            }
          />
        </Card>
      )}

      {/* Занятые станки без операций */}
      {occupiedMachines.filter(m => !m.currentOperationDetails && !m.currentOperationId).length > 0 && (
        <Card 
          title={
            <Space>
              <ToolOutlined style={{ color: '#faad14' }} />
              <span style={{ color: '#faad14', fontWeight: 'bold' }}>
                Станки требующие внимания
              </span>
            </Space>
          }
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        >
          <Alert
            message="⚠️ Внимание"
            description="Эти станки помечены как занятые, но не имеют назначенных операций. Требуется ручная проверка."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Row gutter={[16, 16]}>
            {occupiedMachines
              .filter(m => !m.currentOperationDetails && !m.currentOperationId)
              .map((machine) => (
                <Col key={machine.id} xs={24} sm={12} lg={8}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => handleOperationClick(machine)}
                    style={{
                      borderRadius: '8px',
                      borderColor: '#faad14',
                      cursor: 'pointer'
                    }}
                  >
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <ToolOutlined style={{ color: '#faad14' }} />
                        <Text strong>{machine.machineName}</Text>
                      </Space>
                      <Space>
                        <Tag color="orange">Занят</Tag>
                        <EyeOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))
            }
          </Row>
        </Card>
      )}

      {/* Модальное окно аналитики */}
      <EnhancedOperationAnalyticsModal
        visible={analyticsModalVisible}
        onClose={handleAnalyticsModalClose}
        machine={selectedMachine}
      />
    </div>
  );
};