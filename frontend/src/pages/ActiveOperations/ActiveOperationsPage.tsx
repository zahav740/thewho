/**
 * @file: ActiveOperationsPage.tsx
 * @description: Страница мониторинга активных операций (ИСПРАВЛЕНА - клики обновляют данные)
 * @dependencies: antd, machine.types
 * @created: 2025-06-07
 * @fixed: 2025-06-07 - Добавлена возможность обновления данных по клику на операции
 */
import React from 'react';
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
  message
} from 'antd';
import { 
  ToolOutlined, 
  ClockCircleOutlined, 
  PlayCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../../services/machinesApi';
import { shiftsApi } from '../../services/shiftsApi';
import { formatEstimatedTime } from '../../types/machine.types';

const { Title, Text } = Typography;

export const ActiveOperationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data: machines, isLoading, error, refetch } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // Функция обновления данных по клику на операцию
  const handleOperationClick = async (machine: any) => {
    try {
      message.loading({ content: 'Обновление данных операции...', key: 'operation-update' });
      
      console.log(`🔄 Обновляем данные для операции на станке ${machine.machineName}`);
      
      // Инвалидируем все кэши для обновления данных
      await queryClient.invalidateQueries({ queryKey: ['machines'] });
      await queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      await queryClient.invalidateQueries({ queryKey: ['operations'] });
      
      // Принудительно обновляем данные
      await refetch();
      
      message.success({ 
        content: `Данные операции на станке ${machine.machineName} обновлены`, 
        key: 'operation-update',
        duration: 2
      });
      
      console.log('✅ Данные операции обновлены успешно');
      
    } catch (error) {
      console.error('❌ Ошибка при обновлении данных операции:', error);
      message.error({ 
        content: 'Ошибка при обновлении данных', 
        key: 'operation-update',
        duration: 3
      });
    }
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Заголовок и статистика */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <ToolOutlined /> Мониторинг активных операций
            </Title>
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
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <div style={{ color: '#ff4d4f', fontSize: '24px', marginBottom: '8px' }}>
                <PlayCircleOutlined />
              </div>
              <Text strong style={{ fontSize: '16px' }}>Активных операций</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {activeOperations.length}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <div style={{ color: '#faad14', fontSize: '24px', marginBottom: '8px' }}>
                <ToolOutlined />
              </div>
              <Text strong style={{ fontSize: '16px' }}>Занятых станков</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {occupiedMachines.length}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <div style={{ color: '#52c41a', fontSize: '24px', marginBottom: '8px' }}>
                <InfoCircleOutlined />
              </div>
              <Text strong style={{ fontSize: '16px' }}>Свободных станков</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {availableMachines.length}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Активные операции */}
      <Card 
        title={
          <Space>
            <PlayCircleOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              Операции в работе ({activeOperations.length})
            </span>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 Кликните на карточку операции для обновления данных
          </Text>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        {activeOperations.length > 0 ? (
          <Row gutter={[16, 16]}>
            {activeOperations.map((machine) => (
              <Col key={machine.id} xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleOperationClick(machine)}
                  style={{
                    borderRadius: '12px',
                    borderColor: '#ff4d4f',
                    backgroundColor: '#fff2f0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 77, 79, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  title={
                    <Space>
                      <ToolOutlined style={{ color: '#ff4d4f' }} />
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                        {machine.machineName}
                      </span>
                      <EditOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                    </Space>
                  }
                >
                  {machine.currentOperationDetails ? (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <Tag color="orange" style={{ borderRadius: '12px', marginBottom: '8px' }}>
                          📋 Операция #{machine.currentOperationDetails.operationNumber}
                        </Tag>
                        <Tag color="blue" style={{ borderRadius: '12px', marginBottom: '8px' }}>
                          {machine.currentOperationDetails.operationType}
                        </Tag>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                          📄 {machine.currentOperationDetails.orderDrawingNumber}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ⏱️ Время: {formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}
                        </Text>
                      </div>
                      
                      {machine.lastFreedAt && (
                        <div style={{ marginTop: '12px' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            🕒 Назначено: {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
                          </Text>
                        </div>
                      )}
                      
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '8px', 
                        backgroundColor: '#f0f9ff', 
                        borderRadius: '6px',
                        border: '1px dashed #1890ff'
                      }}>
                        <Text style={{ fontSize: '11px', color: '#1890ff' }}>
                          <EditOutlined style={{ marginRight: '4px' }} />
                          Кликните для обновления данных производства
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
                        border: '1px dashed #1890ff'
                      }}>
                        <Text style={{ fontSize: '11px', color: '#1890ff' }}>
                          <EditOutlined style={{ marginRight: '4px' }} />
                          Кликните для загрузки деталей операции
                        </Text>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
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
        )}
      </Card>

      {/* Занятые станки без детальной информации */}
      {occupiedMachines.filter(m => !m.currentOperationDetails && !m.currentOperationId).length > 0 && (
        <Card 
          title={
            <Space>
              <ToolOutlined style={{ color: '#faad14' }} />
              <span style={{ color: '#faad14', fontWeight: 'bold' }}>
                Занятые станки без операций
              </span>
            </Space>
          }
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        >
          <Alert
            message="Внимание"
            description="Эти станки помечены как занятые, но не имеют назначенных операций. Возможно, требуется ручная проверка."
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
                    <Space>
                      <ToolOutlined style={{ color: '#faad14' }} />
                      <Text strong>{machine.machineName}</Text>
                      <Tag color="orange">Занят</Tag>
                      <EditOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                    </Space>
                  </Card>
                </Col>
              ))
            }
          </Row>
        </Card>
      )}
    </div>
  );
};
