/**
 * @file: ActiveOperationsPage.tsx (🔧 ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @description: Исправлены проблемы с аналитикой - диагностика и логирование
 * @dependencies: antd, machine.types, EnhancedOperationAnalyticsModal, i18n
 * @created: 2025-06-07
 * @updated: 2025-06-23 - Исправлена проблема с аналитикой
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
  Statistic
} from 'antd';
import { 
  ToolOutlined, 
  PlayCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FireOutlined,
  DashboardOutlined,
  EyeOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../services/machinesApi';
import { formatEstimatedTime } from '../../types/machine.types';
import { EnhancedOperationAnalyticsModal } from '../../components/OperationAnalyticsModal/EnhancedOperationAnalyticsModal';
import { useTranslation } from '../../i18n';
import { ActiveOperationsDiagnostic } from './ActiveOperationsDiagnostic';

const { Title, Text } = Typography;

export const ActiveOperationsPage: React.FC = () => {
  const { t, tWithParams } = useTranslation();
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: machines, isLoading, error, refetch } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      console.log('🔍 Загрузка данных станков с реальным статусом...');
      const result = await machinesApi.getAllWithStatus(); // ✅ Исправлено: используем новый API
      console.log('📊 Получены данные станков:', result);
      
      // Логируем станки с операциями
      const withOperations = result.filter(m => m.currentOperationDetails || m.currentOperationId);
      console.log(`✅ Найдено станков с операциями: ${withOperations.length}`);
      withOperations.forEach(m => {
        console.log(`  • ${m.machineName}: операция ${m.currentOperationDetails?.operationNumber || m.currentOperationId}`);
      });
      
      return result;
    },
    refetchInterval: 5000,
  });

  // Загрузка статистики по сменам
  const { data: shiftsStats } = useQuery({
    queryKey: ['shifts-stats'],
    queryFn: async () => ({ averageEfficiency: 87 }),
    refetchInterval: 30000,
  });

  // Функция открытия модального окна аналитики с диагностикой
  const handleOperationClick = async (machine: any) => {
    try {
      console.log(`🔍 === ДИАГНОСТИКА АНАЛИТИКИ ===`);
      console.log(`🔧 Станок:`, machine.machineName, `(ID: ${machine.id})`);
      console.log(`📋 Полные данные станка:`, machine);
      console.log(`📋 currentOperationId:`, machine.currentOperationId);
      console.log(`📋 currentOperationDetails:`, machine.currentOperationDetails);
      console.log(`📋 isAvailable:`, machine.isAvailable);
      
      // Дополнительная проверка наличия операции
      const hasOperation = !!(machine.currentOperationDetails || machine.currentOperationId);
      console.log(`✅ Есть операция:`, hasOperation);
      
      if (!hasOperation) {
        console.warn(`⚠️ На станке ${machine.machineName} нет активной операции`);
        message.warning({
          content: t('active_operations.no_operation_warning'),
          duration: 3
        });
        return;
      }

      console.log(`✅ Операция найдена, открываем аналитику...`);
      console.log(`📊 Передаем в аналитику станок:`, {
        id: machine.id,
        machineName: machine.machineName,
        currentOperationId: machine.currentOperationId,
        currentOperationDetails: machine.currentOperationDetails
      });
      
      setSelectedMachine(machine);
      setAnalyticsModalVisible(true);
      
      message.success({
        content: t('active_operations.loading_analytics'),
        duration: 2
      });
      
    } catch (error) {
      console.error('❌ Ошибка при открытии аналитики операции:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`${t('active_operations.error_analytics')}: ${errorMessage}`);
    }
  };

  // Функция закрытия модального окна
  const handleAnalyticsModalClose = () => {
    console.log('🔒 Закрытие модального окна аналитики');
    setAnalyticsModalVisible(false);
    setSelectedMachine(null);
  };

  // Функция массового обновления всех данных
  const handleRefreshAll = async () => {
    try {
      message.loading({ content: t('active_operations.refreshing_data'), key: 'refresh-all' });
      
      console.log('🔄 Массовое обновление всех данных...');
      
      await queryClient.invalidateQueries({ queryKey: ['machines'] });
      await queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['operations'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts-stats'] });
      
      await refetch();
      
      message.success({ 
        content: t('active_operations.data_updated'), 
        key: 'refresh-all',
        duration: 2
      });
      
    } catch (error) {
      console.error('❌ Ошибка при массовом обновлении:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error({ 
        content: `${t('active_operations.refresh_error')}: ${errorMessage}`, 
        key: 'refresh-all',
        duration: 3
      });
    }
  };

  // Функция переключения режима отладки
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    message.info(debugMode ? t('active_operations.debug_disabled') : t('active_operations.debug_enabled'));
  };

  // Функции цветов и текстов (остаются прежними)
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#ff4d4f';
      case 2: return '#fa8c16';
      case 3: return '#faad14';
      default: return '#52c41a';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return t('active_operations.priority_critical');
      case 2: return t('active_operations.priority_high');
      case 3: return t('active_operations.priority_medium');
      default: return t('active_operations.priority_low');
    }
  };

  const formatTimeToDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        text: tWithParams('active_operations.deadline_overdue', { days: Math.abs(diffDays) }), 
        color: '#ff4d4f' 
      };
    } else if (diffDays === 0) {
      return { text: t('active_operations.deadline_today'), color: '#fa8c16' };
    } else if (diffDays <= 3) {
      return { 
        text: tWithParams('active_operations.deadline_days', { days: diffDays }), 
        color: '#faad14' 
      };
    } else {
      return { 
        text: tWithParams('active_operations.deadline_days', { days: diffDays }), 
        color: '#52c41a' 
      };
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>{t('active_operations.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t('database.loading_error')}
        description={`${t('active_operations.error_loading')}: ${error instanceof Error ? error.message : t('message.error.load')}`}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => refetch()}>
            {t('active_operations.try_again')}
          </Button>
        }
      />
    );
  }

  // Фильтруем станки с активными операциями
  const activeOperations = machines?.filter(machine => {
    const hasOperation = machine.currentOperationDetails || machine.currentOperationId;
    if (debugMode) {
      console.log(`🔍 Станок ${machine.machineName}:`, {
        hasOperation,
        currentOperationDetails: machine.currentOperationDetails,
        currentOperationId: machine.currentOperationId
      });
    }
    return hasOperation;
  }) || [];

  const occupiedMachines = machines?.filter(machine => !machine.isAvailable) || [];
  const availableMachines = machines?.filter(machine => machine.isAvailable) || [];

  console.log(`📊 Статистика станков:`, {
    total: machines?.length || 0,
    activeOperations: activeOperations.length,
    occupied: occupiedMachines.length,
    available: availableMachines.length
  });

  // Группировка по приоритету
  const operationsByPriority = activeOperations.reduce((acc, machine) => {
    const priority = (machine.currentOperationDetails as any)?.orderPriority || 4;
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(machine);
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Диагностический компонент */}
      {debugMode && <ActiveOperationsDiagnostic />}
      
      {/* Заголовок и статистика */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <DashboardOutlined /> {t('active_operations.title')}
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('active_operations.subtitle')}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<BugOutlined />} 
                onClick={toggleDebugMode}
                type={debugMode ? "primary" : "default"}
                size="small"
              >
                {t('active_operations.debug_mode')}
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefreshAll}
                type="primary"
                style={{ borderRadius: '8px' }}
              >
                {t('active_operations.refresh_all')}
              </Button>
            </Space>
          </Col>
        </Row>
        
        {/* Отладочная информация */}
        {debugMode && (
          <Alert
            message={t('active_operations.debug_active')}
            description={
              <div>
                <p><strong>{t('active_operations.total_machines')}:</strong> {machines?.length || 0}</p>
                <p><strong>{t('active_operations.with_operations')}:</strong> {activeOperations.length}</p>
                <p><strong>{t('active_operations.occupied_machines')}:</strong> {occupiedMachines.length}</p>
                <p><strong>{t('active_operations.free_machines')}:</strong> {availableMachines.length}</p>
                <p><strong>{t('active_operations.api_url')}:</strong> {process.env.REACT_APP_API_URL}</p>
              </div>
            }
            type="info"
            style={{ marginTop: 16 }}
          />
        )}
        
        <Row gutter={[24, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title={t('stats.active_operations')}
                value={activeOperations.length}
                prefix={<PlayCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('stats.operations_running')}
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title={t('stats.busy_machines')}
                value={occupiedMachines.length}
                prefix={<ToolOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {tWithParams('stats.machines_total', { total: machines?.length || 0 })}
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title={t('stats.free_machines')}
                value={availableMachines.length}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('stats.ready_to_work')}
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Statistic
                title={t('stats.efficiency')}
                value={shiftsStats?.averageEfficiency || 0}
                suffix="%"
                prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('stats.average_period')}
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
                    {tWithParams('active_operations.priority_operations', { priority: getPriorityText(priorityNum), count: operations.length })}
                  </span>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('active_operations.analytics_hint')}
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
                    { text: t('active_operations.deadline_not_set'), color: '#d9d9d9' };
                  
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
                            <Tooltip title={t('active_operations.open_analytics_hint')}>
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
                                    {tWithParams('active_operations.produced_parts', { 
                                      produced: (machine.currentOperationDetails as any)?.producedQuantity || 0, 
                                      total: (machine.currentOperationDetails as any)?.orderQuantity 
                                    })}
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
                                  {tWithParams('active_operations.started_at', { time: new Date(machine.lastFreedAt).toLocaleString('ru-RU') })}
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
                                {t('active_operations.open_analytics')}
                              </Text>
                            </div>
                            
                            {/* Отладочная информация */}
                            {debugMode && (
                              <div style={{ 
                                marginTop: '8px',
                                padding: '4px', 
                                backgroundColor: '#fff7e6', 
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}>
                                <Text strong>{t('active_operations.debug_info')}:</Text>
                                <br />
                                {t('active_operations.machine_id')}: {machine.id}
                                <br />
                                {t('active_operations.operation_id')}: {machine.currentOperationId}
                                <br />
                                {t('active_operations.machine_available')}: {machine.isAvailable ? t('active_operations.yes') : t('active_operations.no')}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <Tag color="orange" style={{ borderRadius: '12px' }}>
                              {tWithParams('active_operations.operation_number', { number: machine.currentOperationId })}
                            </Tag>
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {t('progress.loading_details')}
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
                                {t('active_operations.open_analytics')}
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
                {t('active_operations.title')}
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
                  {t('active_operations.no_operations')}
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {t('active_operations.all_machines_free')}
                  </Text>
                </div>
              </div>
            }
          />
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