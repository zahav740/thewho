/**
 * @file: ProductionPage.tsx
 * @description: Адаптивная страница производства с улучшенным планированием и полной поддержкой мобильных устройств
 * @dependencies: MachineCard, OrderRecommendations, PlanningModalImproved, ResponsiveGrid
 * @created: 2025-01-28
 * @updated: 2025-06-18 - Добавлена полная адаптивность для всех устройств
 */
import React, { useState } from 'react';
import { Row, Col, Spin, Alert, Button, Switch, Space, Card, Typography, Tag } from 'antd';
import { ThunderboltOutlined, BugOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { machinesApi } from '../../services/machinesApi';
import { synchronizationApi } from '../../services/synchronizationApi';
import { useSynchronization, useResponsive, responsiveUtils } from '../../hooks';
import { MachineAvailability } from '../../types/machine.types';
import { MachineCard } from './components/MachineCard';
import { MachineCardCompact } from './components/MachineCardCompact';
import { OrderRecommendations } from './components/OrderRecommendations';
import { PlanningModal } from '../../components/PlanningModal';
import { QUERY_KEYS } from '../../utils/queryKeys';
import PlanningModalImproved from '../../components/PlanningModal/PlanningModalImproved';

// Импорт адаптивных компонентов
import { 
  ResponsiveContainer, 
  ResponsiveActions,
  ResponsiveGrid 
} from '../../components/ResponsiveGrid';


const { Text } = Typography;

export const ProductionPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const screenInfo = useResponsive();
  const [selectedMachine, setSelectedMachine] = useState<MachineAvailability | null>(null);
  const [planningModalVisible, setPlanningModalVisible] = useState(false);
  const [planningMachine, setPlanningMachine] = useState<MachineAvailability | null>(null);
  const [useImprovedPlanning, setUseImprovedPlanning] = useState(true);
  const [useCompactCards, setUseCompactCards] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);

  // Адаптивные параметры
  const componentSize = responsiveUtils.getComponentSize(screenInfo);
  const cardSize: 'default' | 'small' = screenInfo.isMobile ? 'small' : 'default';
  const cardSpacing = screenInfo.isMobile ? 12 : screenInfo.isTablet ? 16 : 24;

  // Система синхронизации
  const {
    forceSyncAll,
    syncOperation,
    getSyncStatus,
    checkSyncHealth,
  } = useSynchronization({
    autoSync: true,
    syncInterval: 15000,
    onSyncSuccess: (data) => {
      console.log('✅ Автоматическая синхронизация завершена:', data);
    },
    onSyncError: (error) => {
      console.error('❌ Ошибка автоматической синхронизации:', error);
    },
  });

  const { data: machines, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.MACHINES,
    queryFn: machinesApi.getAll,
    refetchInterval: 5000,
  });

  const handleOpenPlanningModal = (machine: MachineAvailability) => {
    console.log('🔥🔥🔥 handleOpenPlanningModal called with machine:', machine.machineName);
    setPlanningMachine(machine);
    setPlanningModalVisible(true);
  };

  const handleClosePlanningModal = () => {
    setPlanningModalVisible(false);
    setPlanningMachine(null);
  };

  const handleOperationSelect = async (operation: any) => {
    try {
      console.log('🎯 Операция выбрана в Производстве:', operation);
      
      const syncResult = await synchronizationApi.assignOperationThroughPlanning({
        operationId: operation.id,
        machineId: operation.machineId || operation.assignedMachine,
      });
      
      if (syncResult.success) {
        console.log('✅ Операция успешно назначена и синхронизирована:', syncResult);
        
        const enhancedOperation = {
          ...operation,
          syncedWithShifts: true,
          assignedAt: syncResult.data.assignedAt,
          synchronizationStatus: syncResult.data.synchronizationStatus,
        };
        
        setSelectedOperation(enhancedOperation);
        
        window.dispatchEvent(new CustomEvent('operationAssigned', {
          detail: enhancedOperation
        }));
        
        await forceSyncAll();
        
        console.log('📢 Операция', operation.operationNumber, 'назначена и синхронизирована с Модулем Смен');
        
      } else {
        console.error('❌ Ошибка назначения операции:', syncResult.error);
        await handleLegacyOperationSelect(operation);
      }
      
    } catch (error) {
      console.error('❌ Ошибка при назначении операции с синхронизацией:', error);
      await handleLegacyOperationSelect(operation);
    }
  };

  const handleLegacyOperationSelect = async (operation: any) => {
    try {
      console.log('⚠️ Откат к старому методу назначения операции');
      
      setSelectedOperation({
        ...operation,
        syncedWithShifts: false,
        legacyMode: true,
      });
      
      localStorage.setItem('selectedOperation', JSON.stringify(operation));
      
      window.dispatchEvent(new CustomEvent('operationAssigned', {
        detail: { ...operation, legacyMode: true }
      }));
      
      console.log('⚠️ Операция назначена через старый метод (без автоматической синхронизации)');
      
    } catch (error) {
      console.error('❌ Ошибка при откате к старому методу:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large">
          <div style={{ minHeight: '200px', padding: '50px' }}>
            <div>{t('message.loading')}</div>
          </div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t('message.error.load')}
        description={t('message.error.load')}
        type="error"
        showIcon
      />
    );
  }

  // Группировка машин по типам
  const millingMachines = machines
    ?.filter(machine => {
      const machineType = machine.machineType || '';
      return machineType === 'MILLING' || machineType === 'milling' || machineType.includes('milling');
    })
    .sort((a, b) => (a.machineName || '').localeCompare(b.machineName || ''));
  
  const turningMachines = machines
    ?.filter(machine => {
      const machineType = machine.machineType || '';
      return machineType === 'TURNING' || machineType === 'turning' || machineType.includes('turning');
    })
    .sort((a, b) => (a.machineName || '').localeCompare(b.machineName || ''));
  
  const otherMachines = machines
    ?.filter(machine => {
      const machineType = machine.machineType || '';
      return !['MILLING', 'milling', 'TURNING', 'turning'].includes(machineType) &&
        !machineType.includes('milling') &&
        !machineType.includes('turning');
    })
    .sort((a, b) => (a.machineName || '').localeCompare(b.machineName || ''));

  return (
    <ResponsiveContainer className="production-page">
      {/* Адаптивный заголовок приложения */}
      <Card 
        size={cardSize}
        style={{ 
          background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
          borderColor: '#1890ff',
          borderRadius: screenInfo.isMobile ? 8 : 12,
          marginBottom: cardSpacing
        }}
      >
        <Space 
          align="center" 
          style={{ 
            width: '100%', 
            justifyContent: screenInfo.isMobile ? 'center' : 'space-between',
            flexDirection: screenInfo.isMobile ? 'column' : 'row'
          }}
        >
          <Space direction={screenInfo.isMobile ? 'horizontal' : 'vertical'} size={4}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: screenInfo.isMobile ? '14px' : '16px', 
              color: '#1890ff',
              textAlign: screenInfo.isMobile ? 'center' : 'left'
            }}>
              🌐 {t('app.title')} - {t('language.current')}: {currentLanguage.toUpperCase()}
            </div>
            <div style={{ 
              fontSize: screenInfo.isMobile ? '12px' : '14px', 
              color: '#595959',
              textAlign: screenInfo.isMobile ? 'center' : 'left'
            }}>
              {t('page.production.title')} | {t('menu.production')}
            </div>
          </Space>
        </Space>
      </Card>

      {/* Адаптивная панель управления планированием */}
      <Card 
        size={cardSize}
        style={{ 
          background: useImprovedPlanning 
            ? 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)' 
            : 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
          borderColor: useImprovedPlanning ? '#faad14' : '#52c41a',
          borderRadius: screenInfo.isMobile ? 8 : 12,
          marginBottom: cardSpacing
        }}
      >
        <Space 
          direction={screenInfo.isMobile ? 'vertical' : 'horizontal'}
          align="center" 
          style={{ 
            width: '100%', 
            justifyContent: screenInfo.isMobile ? 'center' : 'space-between'
          }}
        >
          <Space align="center">
            {useImprovedPlanning ? (
              <ThunderboltOutlined style={{ color: '#faad14', fontSize: screenInfo.isMobile ? '18px' : '20px' }} />
            ) : (
              <BugOutlined style={{ color: '#52c41a', fontSize: screenInfo.isMobile ? '18px' : '20px' }} />
            )}
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: screenInfo.isMobile ? '14px' : '16px',
              textAlign: 'center'
            }}>
              {useImprovedPlanning ? t('planning.improved_enabled') : t('planning.standard_enabled')}
            </span>
          </Space>
          
          {/* Адаптивная панель управления */}
          <ResponsiveActions direction="auto" wrap={true}>
            <Space align="center" size={screenInfo.isMobile ? 'small' : 'middle'}>
              <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                {t('planning.standard')}
              </span>
              <Switch 
                checked={useImprovedPlanning}
                onChange={setUseImprovedPlanning}
                size={screenInfo.isMobile ? 'small' : 'default'}
                style={{
                  backgroundColor: useImprovedPlanning ? '#faad14' : undefined
                }}
              />
              <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                {t('planning.improved')}
              </span>
            </Space>
            
            <Space align="center" size={screenInfo.isMobile ? 'small' : 'middle'}>
              <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                Подробные карточки
              </span>
              <Switch 
                checked={useCompactCards}
                onChange={setUseCompactCards}
                size={screenInfo.isMobile ? 'small' : 'default'}
                style={{
                  backgroundColor: useCompactCards ? '#52c41a' : undefined
                }}
              />
              <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                Компактные карточки
              </span>
            </Space>
            
            <Space size={screenInfo.isMobile ? 'small' : 'middle'}>
              <Button
                type="primary"
                size={componentSize}
                icon={<span>🔄</span>}
                onClick={async () => {
                  try {
                    console.log('🔄 Ручная синхронизация...');
                    await forceSyncAll();
                    console.log('✅ Ручная синхронизация завершена');
                  } catch (error) {
                    console.error('❌ Ошибка ручной синхронизации:', error);
                  }
                }}
                style={{
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  fontSize: screenInfo.isMobile ? '12px' : '14px'
                }}
              >
                {screenInfo.isMobile ? 'Синх' : 'Синхронизация'}
              </Button>
              
              <Button
                size={componentSize}
                icon={<span>🌡️</span>}
                onClick={async () => {
                  try {
                    console.log('🌡️ Проверка системы...');
                    const healthStatus = await checkSyncHealth();
                    console.log('✅ Система синхронизации работает:', healthStatus);
                  } catch (error) {
                    console.error('❌ Ошибка проверки системы:', error);
                  }
                }}
                style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}
              >
                {screenInfo.isMobile ? 'Тест' : 'Проверка'}
              </Button>
            </Space>
          </ResponsiveActions>
        </Space>
        
        {useImprovedPlanning && (
          <div style={{ 
            marginTop: 12, 
            color: '#8c5700', 
            fontSize: screenInfo.isMobile ? '12px' : '14px',
            textAlign: screenInfo.isMobile ? 'center' : 'left'
          }}>
            {t('planning.features_enabled')}
          </div>
        )}
      </Card>

      {/* Заголовок и тестовая кнопка */}
      <ResponsiveActions justify="space-between" className="section-header">
        <Typography.Title 
          level={responsiveUtils.getTitleLevel(screenInfo, 2)} 
          style={{ margin: 0 }}
        >
          {t('production.machines')}
        </Typography.Title>
        
        <Button 
          type="primary" 
          size={componentSize}
          onClick={() => {
            console.log('🧪 Test button clicked');
            if (machines && machines.length > 0) {
              handleOpenPlanningModal(machines[0]);
            }
          }}
          style={{ 
            backgroundColor: useImprovedPlanning ? '#faad14' : undefined,
            borderColor: useImprovedPlanning ? '#faad14' : undefined,
            fontSize: screenInfo.isMobile ? '12px' : '14px'
          }}
          icon={useImprovedPlanning ? <ThunderboltOutlined /> : <BugOutlined />}
        >
          {screenInfo.isMobile 
            ? (useImprovedPlanning ? 'Тест+' : 'Тест') 
            : (useImprovedPlanning ? t('planning.test_improved') : t('planning.test_standard'))
          }
        </Button>
      </ResponsiveActions>

      {/* Адаптивные группы станков */}
      <div className="machines-grid" style={{ marginTop: cardSpacing }}>
        {/* Группа: Фрезерные станки */}
        {millingMachines && millingMachines.length > 0 && (
          <div key="milling-group" className="machine-group milling-group" style={{ marginBottom: cardSpacing * 1.5 }}>
            <div className="machine-group-header">
              <Typography.Title 
                level={responsiveUtils.getTitleLevel(screenInfo, 3)} 
                className="machine-group-title"
                style={{ margin: 0 }}
              >
                🔧 {t('production.machines.milling')} ({millingMachines.length})
              </Typography.Title>
            </div>
            <ResponsiveGrid 
              minItemWidth={screenInfo.isMobile ? 280 : 320}
              maxColumns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 5 }}
            >
              {millingMachines.map((machine) => (
                useCompactCards ? (
                  <MachineCardCompact
                    key={`milling-${machine.id}`}
                    machine={machine}
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => setSelectedMachine(machine)}
                    onOpenPlanningModal={handleOpenPlanningModal}
                  />
                ) : (
                  <MachineCard
                    key={`milling-${machine.id}`}
                    machine={machine}
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => setSelectedMachine(machine)}
                    onOpenPlanningModal={handleOpenPlanningModal}
                  />
                )
              ))}
            </ResponsiveGrid>
          </div>
        )}
        
        {/* Группа: Токарные станки */}
        {turningMachines && turningMachines.length > 0 && (
          <div key="turning-group" className="machine-group turning-group" style={{ marginBottom: cardSpacing * 1.5 }}>
            <div className="machine-group-header">
              <Typography.Title 
                level={responsiveUtils.getTitleLevel(screenInfo, 3)} 
                className="machine-group-title"
                style={{ margin: 0 }}
              >
                🔄 {t('production.machines.turning')} ({turningMachines.length})
              </Typography.Title>
            </div>
            <ResponsiveGrid 
              minItemWidth={screenInfo.isMobile ? 280 : 320}
              maxColumns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 5 }}
            >
              {turningMachines.map((machine) => (
                useCompactCards ? (
                  <MachineCardCompact
                    key={`turning-${machine.id}`}
                    machine={machine}
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => setSelectedMachine(machine)}
                    onOpenPlanningModal={handleOpenPlanningModal}
                  />
                ) : (
                  <MachineCard
                    key={`turning-${machine.id}`}
                    machine={machine}
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => setSelectedMachine(machine)}
                    onOpenPlanningModal={handleOpenPlanningModal}
                  />
                )
              ))}
            </ResponsiveGrid>
          </div>
        )}
        
        {/* Группа: Другие станки */}
        {otherMachines && otherMachines.length > 0 && (
          <div key="other-group" className="machine-group other-group" style={{ marginBottom: cardSpacing * 1.5 }}>
            <div className="machine-group-header">
              <Typography.Title 
                level={responsiveUtils.getTitleLevel(screenInfo, 3)} 
                className="machine-group-title"
                style={{ margin: 0 }}
              >
                ⚙️ {t('production.machines.other')} ({otherMachines.length})
              </Typography.Title>
            </div>
            <ResponsiveGrid 
              minItemWidth={screenInfo.isMobile ? 280 : 320}
              maxColumns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 5 }}
            >
              {otherMachines.map((machine) => (
                useCompactCards ? (
                  <MachineCardCompact
                    key={`other-${machine.id}`}
                    machine={machine}
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => setSelectedMachine(machine)}
                    onOpenPlanningModal={handleOpenPlanningModal}
                  />
                ) : (
                  <MachineCard
                    key={`other-${machine.id}`}
                    machine={machine}
                    isSelected={selectedMachine?.id === machine.id}
                    onSelect={() => setSelectedMachine(machine)}
                    onOpenPlanningModal={handleOpenPlanningModal}
                  />
                )
              ))}
            </ResponsiveGrid>
          </div>
        )}
      </div>

      {/* Адаптивные рекомендации по заказам */}
      {selectedMachine && (
        <Card 
          style={{ 
            marginTop: cardSpacing,
            borderRadius: screenInfo.isMobile ? 8 : 12
          }}
          size={cardSize}
        >
          <OrderRecommendations 
            machine={selectedMachine} 
            onOperationSelect={handleOperationSelect}
          />
        </Card>
      )}

      {/* Адаптивное отображение выбранной операции */}
      {selectedOperation && (
        <Card 
          title={
            <span style={{ fontSize: screenInfo.isMobile ? '14px' : '16px' }}>
              🎆 Выбранная операция
            </span>
          }
          extra={
            <Space size="small">
              {selectedOperation.syncedWithShifts && (
                <Tag color="green" style={{ fontSize: screenInfo.isMobile ? '10px' : '12px' }}>
                  ✅ {screenInfo.isMobile ? 'Синх' : 'Синхронизировано'}
                </Tag>
              )}
              <Button 
                type="link" 
                size={componentSize}
                onClick={() => {
                  setSelectedOperation(null);
                  localStorage.removeItem('selectedOperation');
                  window.dispatchEvent(new CustomEvent('operationCleared'));
                  console.log('🗑️ Операция очищена');
                }}
                style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}
              >
                {screenInfo.isMobile ? 'X' : 'Очистить'}
              </Button>
            </Space>
          }
          style={{ 
            marginTop: cardSpacing,
            borderColor: selectedOperation.syncedWithShifts ? '#52c41a' : '#faad14',
            backgroundColor: selectedOperation.syncedWithShifts ? '#f6ffed' : '#fffbe6',
            borderRadius: screenInfo.isMobile ? 8 : 12
          }}
          size={cardSize}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text strong style={{ 
              fontSize: screenInfo.isMobile ? '14px' : '16px', 
              color: selectedOperation.syncedWithShifts ? '#52c41a' : '#faad14' 
            }}>
              📋 Операция #{selectedOperation.operationNumber}
            </Text>
            
            <div style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
              <div><Text strong>Тип:</Text> {selectedOperation.operationType}</div>
              <div><Text strong>Станок:</Text> {selectedOperation.machineName} ({selectedOperation.machineType})</div>
              <div><Text strong>Чертеж:</Text> {selectedOperation.orderDrawingNumber}</div>
              <div><Text strong>Время:</Text> {selectedOperation.estimatedTime} мин</div>
            </div>
            
            {/* Информация о синхронизации */}
            {selectedOperation.syncedWithShifts ? (
              <div style={{ 
                padding: screenInfo.isMobile ? '8px' : '12px', 
                backgroundColor: '#d4edda', 
                borderRadius: screenInfo.isMobile ? '6px' : '8px',
                marginTop: '8px',
                border: '2px solid #52c41a'
              }}>
                <Text strong style={{ 
                  color: '#155724',
                  fontSize: screenInfo.isMobile ? '12px' : '14px'
                }}>
                  ✅ Операция назначена и синхронизирована
                </Text>
                <br />
                <Text style={{ 
                  fontSize: screenInfo.isMobile ? '10px' : '12px', 
                  color: '#155724' 
                }}>
                  • Автоматически создана запись смены<br />
                  • Отображается в мониторинге смен<br />
                  • Прогресс обновляется автоматически
                </Text>
                {selectedOperation.synchronizationStatus && (
                  <div style={{ marginTop: '8px' }}>
                    <Text style={{ 
                      fontSize: screenInfo.isMobile ? '9px' : '11px', 
                      color: '#666' 
                    }}>
                      Прогресс: {selectedOperation.synchronizationStatus.progress.toFixed(1)}% 
                      ({selectedOperation.synchronizationStatus.totalProduced}/{selectedOperation.synchronizationStatus.targetQuantity})
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                padding: screenInfo.isMobile ? '6px' : '8px', 
                backgroundColor: '#fff3cd', 
                borderRadius: screenInfo.isMobile ? '4px' : '6px',
                marginTop: '8px'
              }}>
                <Text strong style={{ 
                  color: '#856404',
                  fontSize: screenInfo.isMobile ? '12px' : '14px'
                }}>
                  ⚠️ Операция выбрана, но не синхронизирована
                </Text>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Модальные окна планирования */}
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
      
      {/* Тестовый индикатор для десктопов */}
      {planningModalVisible && !screenInfo.isMobile && (
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: useImprovedPlanning ? '#faad14' : '#52c41a', 
          color: 'white', 
          padding: '10px',
          zIndex: 9999,
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {useImprovedPlanning ? '🆕 Улучшенное' : '🧪 Стандартное'} планирование активно! 
          <br />Станок: {planningMachine?.machineName}
        </div>
      )}
    </ResponsiveContainer>
  );
};
