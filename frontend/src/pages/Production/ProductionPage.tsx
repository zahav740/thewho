/**
 * @file: ProductionPage.tsx
 * @description: Страница производства (обновленная)
 * @dependencies: MachineCard, OrderRecommendations
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import React, { useState } from 'react';
import { Row, Col, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { machinesApi } from '../../services/machinesApi';
import { MachineAvailability } from '../../types/machine.types';
import { MachineCard } from './components/MachineCard';
import { OrderRecommendations } from './components/OrderRecommendations';

export const ProductionPage: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<MachineAvailability | null>(null);

  const { data: machines, isLoading, error } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large">
          <div style={{ minHeight: '200px', padding: '50px' }}>
            <div>Загрузка станков...</div>
          </div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description="Не удалось загрузить список станков"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2>Станки</h2>
          <div className="machines-grid">
            {machines?.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                isSelected={selectedMachine?.id === machine.id}
                onSelect={() => setSelectedMachine(machine)}
              />
            ))}
          </div>
        </Col>
      </Row>

      {selectedMachine && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <OrderRecommendations machine={selectedMachine} />
          </Col>
        </Row>
      )}
    </div>
  );
};
