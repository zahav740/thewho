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
  StopOutlined 
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MachineAvailability, 
  getMachineTypeLabel, 
  getPriorityColor,
  formatEstimatedTime 
} from '../../../types/machine.types';
import { machinesApi } from '../../../services/machinesApi';

const { Text } = Typography;

interface MachineCardProps {
  machine: MachineAvailability;
  isSelected: boolean;
  onSelect: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  isSelected,
  onSelect,
}) => {
  const queryClient = useQueryClient();

  const updateAvailabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) => 
      machinesApi.updateAvailability(machine.machineName, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      if (!machine.isAvailable) {
        // Если станок освободился, автоматически выбираем его
        onSelect();
      }
    },
    onError: (error) => {
      console.error('Ошибка обновления доступности станка:', error);
    },
  });

  const handleAvailabilityChange = (checked: boolean) => {
    updateAvailabilityMutation.mutate(checked);
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
            <Checkbox
              checked={machine.isAvailable}
              onChange={(e) => handleAvailabilityChange(e.target.checked)}
              disabled={updateAvailabilityMutation.isPending}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
            >
              <Space>
                <span style={{ fontWeight: '500' }}>
                  {machine.isAvailable ? 'Станок свободен' : 'Станок занят'}
                </span>
                {updateAvailabilityMutation.isPending && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    (обновляется...)
                  </Text>
                )}
              </Space>
            </Checkbox>
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
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ⏱️ Время: {formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}
                </Text>
              </div>
            </Card>
          </Col>
        )}

        {machine.currentOperationId && !machine.currentOperationDetails && (
          <Col span={24}>
            <Card size="small" style={{ borderRadius: '8px', borderColor: '#faad14' }}>
              <Space>
                <Tag color="orange" style={{ borderRadius: '12px' }}>
                  Операция
                </Tag>
                <Text code style={{ fontSize: '12px' }}>
                  {machine.currentOperationId.slice(0, 12)}...
                </Text>
              </Space>
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
