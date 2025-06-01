/**
 * @file: MachineCard.tsx
 * @description: Карточка станка (обновленная)
 * @dependencies: antd, machine.types
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import React from 'react';
import { Card, Tag, Badge, Row, Col, Button, Checkbox } from 'antd';
import { ToolOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MachineAvailability, 
  getMachineTypeLabel, 
  getPriorityColor 
} from '../../../types/machine.types';
import { machinesApi } from '../../../services/machinesApi';

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
        return 'blue';
      case 'milling-3axis':
        return 'cyan';
      case 'turning':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <Card
      hoverable
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderColor: isSelected ? '#1890ff' : undefined,
        borderWidth: isSelected ? 2 : 1,
        minHeight: 200,
      }}
      title={
        <Row align="middle" justify="space-between">
          <Col>
            <ToolOutlined /> {machine.machineName}
          </Col>
          <Col>{getStatusBadge()}</Col>
        </Row>
      }
    >
      <Row gutter={[0, 12]}>
        <Col span={24}>
          <Tag color={getMachineTypeColor(machine.machineType)}>
            {getMachineTypeLabel(machine.machineType)}
          </Tag>
        </Col>
        
        <Col span={24}>
          <Checkbox
            checked={machine.isAvailable}
            onChange={(e) => handleAvailabilityChange(e.target.checked)}
            disabled={updateAvailabilityMutation.isPending}
            onClick={(e) => e.stopPropagation()} // Предотвращаем выбор карточки при клике на чекбокс
          >
            Станок освободился {updateAvailabilityMutation.isPending && '(обновляется...)'}
          </Checkbox>
        </Col>

        {machine.currentOperationId && (
          <Col span={24}>
            <Tag color="orange">
              Операция: {machine.currentOperationId.slice(0, 8)}...
            </Tag>
          </Col>
        )}

        {machine.lastFreedAt && (
          <Col span={24}>
            <small style={{ color: '#666' }}>
              Освобожден: {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
            </small>
          </Col>
        )}
        
        <Col span={24} style={{ marginTop: 8 }}>
          <Button
            type={isSelected ? 'primary' : 'default'}
            block
            icon={isSelected ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            disabled={!machine.isAvailable}
          >
            {isSelected ? 'Выбран' : 'Выбрать для планирования'}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};