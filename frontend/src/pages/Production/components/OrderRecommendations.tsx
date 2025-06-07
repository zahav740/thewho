/**
 * @file: OrderRecommendations.tsx
 * @description: Компонент рекомендаций заказов для станка (улучшенная версия)
 * @dependencies: antd, machinesApi
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Улучшен дизайн и функциональность
 */
import React from 'react';
import { Card, Empty, Tag, Typography, Space, Row, Col, Button } from 'antd';
import { 
  ToolOutlined, 
  ClockCircleOutlined, 
  PlayCircleOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { MachineAvailability } from '../../../types/machine.types';

const { Title, Text } = Typography;

interface OrderRecommendationsProps {
  machine: MachineAvailability;
}

export const OrderRecommendations: React.FC<OrderRecommendationsProps> = ({ machine }) => {
  // Получаем информацию о типе станка для отображения
  const getMachineTypeInfo = (machineType: string) => {
    switch (machineType) {
      case 'MILLING':
        return {
          color: '#1890ff',
          icon: <ToolOutlined />,
          label: 'Фрезерный станок'
        };
      case 'TURNING':
        return {
          color: '#52c41a',
          icon: <ToolOutlined rotate={90} />,
          label: 'Токарный станок'
        };
      default:
        return {
          color: '#666',
          icon: <ToolOutlined />,
          label: 'Станок'
        };
    }
  };

  const machineInfo = getMachineTypeInfo(machine.machineType);

  return (
    <Card 
      title={
        <Space size="middle">
          <span style={{ color: machineInfo.color }}>
            {machineInfo.icon}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Рекомендуемые операции для станка{' '}
            <span style={{ color: machineInfo.color }}>{machine.machineName}</span>
          </span>
          <Tag 
            color={machine.isAvailable ? 'success' : 'processing'}
            style={{ borderRadius: '12px' }}
          >
            {machine.isAvailable ? 'Свободен' : 'Занят'}
          </Tag>
        </Space>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        marginTop: '24px'
      }}
      extra={
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          style={{ borderRadius: '8px' }}
          disabled={!machine.isAvailable}
        >
          Запустить планирование
        </Button>
      }
    >
      {/* Информация о станке */}
      <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: machineInfo.color, marginBottom: '8px' }}>
              {machineInfo.icon}
            </div>
            <Text strong>{machineInfo.label}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#722ed1', marginBottom: '8px' }}>
              <InfoCircleOutlined />
            </div>
            <Text strong>ID: {machine.id}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#faad14', marginBottom: '8px' }}>
              <ClockCircleOutlined />
            </div>
            <Text strong>
              {machine.lastFreedAt 
                ? `Освобожден: ${new Date(machine.lastFreedAt).toLocaleString('ru-RU')}`
                : 'Время не указано'
              }
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Основное содержимое */}
      <Card 
        style={{ 
          backgroundColor: '#fafafa', 
          borderRadius: '8px',
          border: '1px dashed #d9d9d9'
        }}
      >
        <Empty 
          description={
            <div>
              <Title level={4} style={{ color: '#666', marginTop: '16px' }}>
                Операции загружаются...
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Система анализирует подходящие операции для станка {machine.machineName}
              </Text>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 20px' }}
        />
      </Card>

      {/* Дополнительная информация */}
      {machine.currentOperationId && (
        <Card 
          size="small" 
          title="Текущая операция"
          style={{ marginTop: '16px', borderRadius: '8px', borderColor: '#faad14' }}
        >
          <Space>
            <Tag color="orange" style={{ borderRadius: '12px' }}>
              ID: {machine.currentOperationId}
            </Tag>
            <Text type="secondary">Станок в настоящее время выполняет эту операцию</Text>
          </Space>
        </Card>
      )}
    </Card>
  );
};
