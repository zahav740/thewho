/**
 * @file: ProductionPage.tsx
 * @description: Страница производства (обновленная с улучшенным планированием)
 * @dependencies: MachineCard, OrderRecommendations, PlanningModalImproved
 * @created: 2025-01-28
 * @updated: 2025-06-08
 */
import React, { useState } from 'react';
import { Row, Col, Spin, Alert, Button, Switch, Space, Card } from 'antd';
import { ThunderboltOutlined, BugOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { machinesApi } from '../../services/machinesApi';
import { MachineAvailability } from '../../types/machine.types';
import { MachineCard } from './components/MachineCard';
import { OrderRecommendations } from './components/OrderRecommendations';
import { PlanningModal } from '../../components/PlanningModal';
// 🆕 ИМПОРТ УЛУЧШЕННОГО ПЛАНИРОВАНИЯ
import PlanningModalImproved from '../../components/PlanningModal/PlanningModalImproved';

export const ProductionPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const [selectedMachine, setSelectedMachine] = useState<MachineAvailability | null>(null);
  const [planningModalVisible, setPlanningModalVisible] = useState(false);
  const [planningMachine, setPlanningMachine] = useState<MachineAvailability | null>(null);
  // 🆕 СОСТОЯНИЕ ДЛЯ УЛУЧШЕННОГО ПЛАНИРОВАНИЯ
  const [useImprovedPlanning, setUseImprovedPlanning] = useState(true); // По умолчанию включено

  const { data: machines, isLoading, error } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  const handleOpenPlanningModal = (machine: MachineAvailability) => {
    console.log('🔥🔥🔥 handleOpenPlanningModal called with machine:', machine.machineName);
    console.log('🔥🔥🔥 Current modal state - visible:', planningModalVisible, 'machine:', planningMachine);
    console.log('🔥🔥🔥 Using improved planning:', useImprovedPlanning);
    setPlanningMachine(machine);
    setPlanningModalVisible(true);
    console.log('🔥🔥🔥 Modal state updated - should be visible now');
  };

  const handleClosePlanningModal = () => {
    setPlanningModalVisible(false);
    setPlanningMachine(null);
  };

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
      {/* 🆕 ПАНЕЛЬ УПРАВЛЕНИЯ ПЛАНИРОВАНИЕМ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            size="small" 
            style={{ 
              background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
              borderColor: '#1890ff',
              borderRadius: '12px',
              marginBottom: 16
            }}
          >
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space direction="vertical" size={4}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                  🌐 {t('app.title')} - {t('language.current')}: {currentLanguage.toUpperCase()}
                </div>
                <div style={{ fontSize: '14px', color: '#595959' }}>
                  {t('page.production.title')} | {t('menu.production')}
                </div>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            size="small" 
            style={{ 
              background: useImprovedPlanning 
                ? 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)' 
                : 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
              borderColor: useImprovedPlanning ? '#faad14' : '#52c41a',
              borderRadius: '12px'
            }}
          >
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                {useImprovedPlanning ? (
                  <ThunderboltOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                ) : (
                  <BugOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                )}
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {useImprovedPlanning ? '🆕 Улучшенное планирование включено' : '🐛 Стандартное планирование'}
                </span>
              </Space>
              <Space>
                <span>Стандартное</span>
                <Switch 
                  checked={useImprovedPlanning}
                  onChange={setUseImprovedPlanning}
                  style={{
                    backgroundColor: useImprovedPlanning ? '#faad14' : undefined
                  }}
                />
                <span>🆕 Улучшенное</span>
              </Space>
            </Space>
            
            {useImprovedPlanning && (
              <div style={{ marginTop: 12, color: '#8c5700', fontSize: '14px' }}>
                ✅ Проверка операций в работе • ✅ Проверка доступности станков • ✅ Детальный анализ
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2>Станки</h2>
          
          {/* Тестовая кнопка */}
          <Button 
            type="primary" 
            onClick={() => {
              console.log('🧪 Test button clicked');
              if (machines && machines.length > 0) {
                handleOpenPlanningModal(machines[0]);
              }
            }}
            style={{ 
              marginBottom: '16px',
              backgroundColor: useImprovedPlanning ? '#faad14' : undefined,
              borderColor: useImprovedPlanning ? '#faad14' : undefined
            }}
            icon={useImprovedPlanning ? <ThunderboltOutlined /> : <BugOutlined />}
          >
            {useImprovedPlanning ? '🆕 Тест улучшенного планирования' : '🧪 Тест стандартного планирования'} (первый станок)
          </Button>
          
          <div className="machines-grid">
            {machines?.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                isSelected={selectedMachine?.id === machine.id}
                onSelect={() => setSelectedMachine(machine)}
                onOpenPlanningModal={handleOpenPlanningModal}
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

      {/* 🆕 КОНДИЦИОННОЕ ОТОБРАЖЕНИЕ МОДАЛЬНЫХ ОКОН */}
      {useImprovedPlanning ? (
        <PlanningModalImproved
          visible={planningModalVisible}
          onCancel={handleClosePlanningModal}
          selectedMachine={planningMachine}
        />
      ) : (
        <PlanningModal
          visible={planningModalVisible}
          onCancel={handleClosePlanningModal}
          selectedMachine={planningMachine}
        />
      )}
      
      {/* Тестовый индикатор */}
      {planningModalVisible && (
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: useImprovedPlanning ? '#faad14' : '#52c41a', 
          color: 'white', 
          padding: '10px',
          zIndex: 9999,
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          {useImprovedPlanning ? '🆕 Улучшенное' : '🧪 Стандартное'} планирование активно! Станок: {planningMachine?.machineName}
        </div>
      )}
    </div>
  );
};
