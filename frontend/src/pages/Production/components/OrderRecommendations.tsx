/**
 * @file: OrderRecommendations.tsx
 * @description: Компонент рекомендаций заказов для станка (упрощенный)
 * @dependencies: antd, machinesApi
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import React from 'react';
import { Card, Empty } from 'antd';
import { MachineAvailability } from '../../../types/machine.types';

interface OrderRecommendationsProps {
  machine: MachineAvailability;
}

export const OrderRecommendations: React.FC<OrderRecommendationsProps> = ({ machine }) => {
  return (
    <Card title={`Предлагаемые операции для станка ${machine.machineName}`}>
      <Empty 
        description="Операции загружаются..."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </Card>
  );
};
