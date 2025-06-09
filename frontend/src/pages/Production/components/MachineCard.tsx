/**
 * @file: MachineCard.tsx
 * @description: Карточка станка (улучшенная версия)
 * @dependencies: antd, machine.types
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Улучшен дизайн и функциональность
 */
import React from 'react';
import { Card, Tag, Badge, Row, Col, Button, Checkbox, Typography, Space } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MachineAvailability, 
  getMachineTypeLabel, 
  getPriorityColor,
  formatEstimatedTime 
} from '../../../types/machine.types';
import { machinesApi, operationsApi } from '../../../services/machinesApi';
import { Modal, message } from 'antd';

const { confirm } = Modal;

const { Text } = Typography;

interface MachineCardProps {
  machine: MachineAvailability;
  isSelected: boolean;
  onSelect: () => void;
  onOpenPlanningModal?: (machine: MachineAvailability) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  isSelected,
  onSelect,
  onOpenPlanningModal,
}) => {
  const queryClient = useQueryClient();

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      console.log(`🔄 Смена статуса станка ${machine.machineName} на ${isAvailable}`);
      
      // Используем реальный API
      return await machinesApi.updateAvailability(machine.machineName, isAvailable);
    },
    onSuccess: (updatedMachine) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      const status = updatedMachine.isAvailable ? 'освобожден' : 'отмечен как занятый';
      message.success(`Станок "${machine.machineName}" успешно ${status}`);
      
      // Если станок освободился, открываем модальное окно планирования
      if (!machine.isAvailable && updatedMachine.isAvailable && onOpenPlanningModal) {
        console.log('🎉 Станок освободился! Открываем модальное окно планирования');
        // Небольшая задержка чтобы пользователь увидел сообщение об успешном освобождении
        setTimeout(() => {
          onOpenPlanningModal(updatedMachine);
        }, 1000);
      }
      
      if (!machine.isAvailable && updatedMachine.isAvailable) {
        // Если станок освободился, автоматически выбираем его
        onSelect();
      }
    },
    onError: (error) => {
      console.error('Ошибка обновления доступности станка:', error);
      message.error('Не удалось изменить статус станка. Попробуйте еще раз.');
    },
  });

  const unassignOperationMutation = useMutation({
    mutationFn: () => machinesApi.unassignOperation(machine.machineName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      message.success('Операция успешно отменена со станка');
    },
    onError: (error) => {
      console.error('Ошибка отмены операции:', error);
      message.error('Ошибка при отмене операции');
    },
  });

  const handleAvailabilityChange = (checked: boolean) => {
    console.log('=== AVAILABILITY CHANGE ===');
    console.log('checked:', checked);
    console.log('machine.machineName:', machine.machineName);
    
    if (checked && machine.isAvailable && onOpenPlanningModal) {
      // Если станок уже свободен и мы ставим галочку, открываем планирование
      onOpenPlanningModal(machine);
      console.log('🎯 Opening planning modal');
    } else {
      // Для изменения доступности станка показываем подтверждение
      const action = checked ? 'освободить' : 'отметить как занятый';
      const title = checked ? 'Освобождение станка' : 'Отметка станка как занятого';
      
      confirm({
        title,
        icon: <ExclamationCircleOutlined />,
        content: `Вы уверены, что хотите ${action} станок "${machine.machineName}"?`,
        okText: 'Да, подтверждаю',
        cancelText: 'Отмена',
        onOk() {
          console.log(checked ? '✅ Making machine available' : '❌ Making machine unavailable');
          updateAvailabilityMutation.mutate(checked);
        },
        onCancel() {
          console.log('❌ Отмена изменения статуса');
        }
      });
    }
    
    console.log('=== END AVAILABILITY CHANGE ===');
  };

  const handleUnassignOperation = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    confirm({
      title: 'Отмена планирования',
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите отменить планирование операции на станке "${machine.machineName}"?`,
      okText: 'Да, отменить',
      cancelText: 'Отмена',
      onOk() {
        unassignOperationMutation.mutate();
      },
    });
  };

  const getStatusBadge = () => {
    if (machine.isAvailable) {
      return <Badge status="success" text="Свободен" />;
    }
    return <Badge status="processing" text="Занят" />;
  };

  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'milling-4axis':
      case 'MILLING':
        return '#1890ff';
      case 'milling-3axis':
        return '#13c2c2';
      case 'turning':
      case 'TURNING':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'TURNING':
      case 'turning':
        return <ToolOutlined rotate={90} />;
      default:
        return <ToolOutlined />;
    }
  };

  const machineTypeColor = getMachineTypeColor(machine.machineType);

  return (
    <Card
      hoverable
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderColor: isSelected ? machineTypeColor : '#e8e8e8',
        borderWidth: isSelected ? 2 : 1,
        backgroundColor: isSelected ? `${machineTypeColor}08` : '#fff',
        borderRadius: '12px',
        minHeight: 280,
        transition: 'all 0.3s ease',
        boxShadow: isSelected 
          ? `0 4px 16px ${machineTypeColor}30` 
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      title={
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <span style={{ color: machineTypeColor, fontSize: '18px' }}>
                {getMachineIcon(machine.machineType)}
              </span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: machineTypeColor 
              }}>
                {machine.machineName}
              </span>
            </Space>
          </Col>
          <Col>{getStatusBadge()}</Col>
        </Row>
      }
      styles={{
        body: { padding: '20px' }
      }}
    >
      <Row gutter={[0, 16]}>
        <Col span={24}>
          <Card 
            size="small" 
            style={{ 
              backgroundColor: `${machineTypeColor}10`,
              borderColor: machineTypeColor,
              borderRadius: '8px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: machineTypeColor, fontSize: '24px', marginBottom: '8px' }}>
                {getMachineIcon(machine.machineType)}
              </div>
              <Text strong style={{ color: machineTypeColor }}>
                {getMachineTypeLabel(machine.machineType)}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card size="small" style={{ borderRadius: '8px' }}>
            {machine.isAvailable ? (
              // Для свободных станков - кнопка планирования с типом станка
              <>
                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <Badge status="success" text="Станок свободен" />
                </div>
                
                {onOpenPlanningModal && (
                  <Button
                    type="primary"
                    block
                    size="large"
                    onClick={(e) => {
                      console.log('🔥 Machine type button clicked for:', machine.machineName);
                      console.log('🔥 onOpenPlanningModal exists:', !!onOpenPlanningModal);
                      e.stopPropagation();
                      console.log('🔥 About to call onOpenPlanningModal with:', machine);
                      try {
                        onOpenPlanningModal(machine);
                        console.log('🔥 onOpenPlanningModal called successfully');
                      } catch (error) {
                        console.error('🔥 Error calling onOpenPlanningModal:', error);
                      }
                    }}
                    style={{ 
                      backgroundColor: machineTypeColor,
                      borderColor: machineTypeColor,
                      borderRadius: '8px',
                      height: '50px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Space>
                      {getMachineIcon(machine.machineType)}
                      <span>{machine.machineType === 'MILLING' ? 'MILLING' : machine.machineType === 'TURNING' ? 'TURNING' : machine.machineType}</span>
                    </Space>
                  </Button>
                )}
                
                <Button
                  danger
                  size="small"
                  type="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvailabilityChange(false);
                  }}
                  disabled={updateAvailabilityMutation.isPending}
                  style={{ 
                    marginTop: '8px',
                    fontSize: '12px',
                    height: 'auto',
                    padding: '4px 0'
                  }}
                >
                  ❌ Отметить как занятый
                </Button>
              </>
            ) : (
              // Для занятых станков - кнопка освобождения
              <>
                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <Badge status="processing" text="Станок занят" />
                </div>
                
                <Button
                  type="default"
                  block
                  icon={<CheckCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvailabilityChange(true);
                  }}
                  loading={updateAvailabilityMutation.isPending}
                  style={{ 
                    borderRadius: '6px',
                    height: '40px',
                    fontWeight: '500'
                  }}
                >
                  ✅ Освободить станок
                </Button>
              </>
            )}
          </Card>
        </Col>

        {machine.currentOperationDetails && (
          <Col span={24}>
            <Card 
              size="small" 
              style={{ 
                borderRadius: '8px', 
                borderColor: '#faad14',
                backgroundColor: '#fff7e6'
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <Space>
                  <Tag color="orange" style={{ borderRadius: '12px', marginBottom: '4px' }}>
                    📋 Операция #{machine.currentOperationDetails.operationNumber}
                  </Tag>
                  <Tag color="blue" style={{ borderRadius: '12px', marginBottom: '4px' }}>
                    {machine.currentOperationDetails.operationType}
                  </Tag>
                </Space>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '13px', color: '#d46b08' }}>
                  📄 {machine.currentOperationDetails.orderDrawingNumber}
                </Text>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ⏱️ Время: {formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}
                </Text>
              </div>
              
              {/* Кнопка отмены планирования */}
              <Button
                danger
                size="small"
                block
                icon={<CloseCircleOutlined />}
                onClick={handleUnassignOperation}
                loading={unassignOperationMutation.isPending}
                style={{
                  borderRadius: '6px',
                  height: '32px',
                  fontSize: '12px'
                }}
              >
                {unassignOperationMutation.isPending ? 'Отменяем...' : 'Отменить планирование'}
              </Button>
            </Card>
          </Col>
        )}

        {machine.currentOperationId && !machine.currentOperationDetails && (
          <Col span={24}>
            <Card size="small" style={{ borderRadius: '8px', borderColor: '#faad14', backgroundColor: '#fff7e6' }}>
              <div style={{ marginBottom: '8px' }}>
                <Space>
                  <Tag color="orange" style={{ borderRadius: '12px' }}>
                    Операция
                  </Tag>
                  <Text code style={{ fontSize: '12px' }}>
                    {machine.currentOperationId.slice(0, 12)}...
                  </Text>
                </Space>
              </div>
              
              {/* Кнопка отмены планирования для операций без деталей */}
              <Button
                danger
                size="small"
                block
                icon={<CloseCircleOutlined />}
                onClick={handleUnassignOperation}
                loading={unassignOperationMutation.isPending}
                style={{
                  borderRadius: '6px',
                  height: '32px',
                  fontSize: '12px'
                }}
              >
                {unassignOperationMutation.isPending ? 'Отменяем...' : 'Отменить планирование'}
              </Button>
            </Card>
          </Col>
        )}

        {machine.lastFreedAt && (
          <Col span={24}>
            <Card size="small" style={{ borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <Space>
                <ClockCircleOutlined style={{ color: '#666' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    Последнее освобождение:
                  </Text>
                  <Text style={{ fontSize: '13px', fontWeight: '500' }}>
                    {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        )}
        
        <Col span={24} style={{ marginTop: 12 }}>
          <Button
            type={isSelected ? 'primary' : 'default'}
            block
            size="large"
            icon={isSelected ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
            disabled={!machine.isAvailable}
            style={{
              height: '48px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: isSelected ? machineTypeColor : undefined,
              borderColor: isSelected ? machineTypeColor : undefined,
            }}
          >
            {isSelected ? 'Выбран для планирования' : 'Выбрать станок'}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};
