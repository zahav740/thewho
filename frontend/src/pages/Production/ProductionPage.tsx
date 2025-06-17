/**
 * @file: ProductionPage.tsx
 * @description: Страница производства (обновленная с улучшенным планированием)
 * @dependencies: MachineCard, OrderRecommendations, PlanningModalImproved
 * @created: 2025-01-28
 * @updated: 2025-06-08
 */
import React, { useState } from 'react';
import { Row, Col, Spin, Alert, Button, Switch, Space, Card, Typography, Tag } from 'antd';
import { ThunderboltOutlined, BugOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { machinesApi } from '../../services/machinesApi';
import { synchronizationApi } from '../../services/synchronizationApi'; // 🆕 Новый API синхронизации
import { useSynchronization } from '../../hooks'; // 🆕 Хук синхронизации
import { MachineAvailability } from '../../types/machine.types';
import { MachineCard } from './components/MachineCard';
import { OrderRecommendations } from './components/OrderRecommendations';
import { PlanningModal } from '../../components/PlanningModal';
import { QUERY_KEYS } from '../../utils/queryKeys';
// 🆕 ИМПОРТ УЛУЧШЕННОГО ПЛАНИРОВАНИЯ
import PlanningModalImproved from '../../components/PlanningModal/PlanningModalImproved';

const { Text } = Typography;

export const ProductionPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const [selectedMachine, setSelectedMachine] = useState<MachineAvailability | null>(null);
  const [planningModalVisible, setPlanningModalVisible] = useState(false);
  const [planningMachine, setPlanningMachine] = useState<MachineAvailability | null>(null);
  // 🆕 СОСТОЯНИЕ ДЛЯ УЛУЧШЕННОГО ПЛАНИРОВАНИЯ
  const [useImprovedPlanning, setUseImprovedPlanning] = useState(true); // По умолчанию включено
  // НОВОЕ: Состояние для выбранной операции
  const [selectedOperation, setSelectedOperation] = useState<any>(null);

  // 🆕 НОВОЕ: Система синхронизации
  const {
    forceSyncAll,
    syncOperation,
    getSyncStatus,
    checkSyncHealth,
  } = useSynchronization({
    autoSync: true,
    syncInterval: 15000, // Синхронизация каждые 15 секунд
    onSyncSuccess: (data) => {
      console.log('✅ Автоматическая синхронизация завершена:', data);
    },
    onSyncError: (error) => {
      console.error('❌ Ошибка автоматической синхронизации:', error);
    },
  });

  const { data: machines, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.MACHINES, // Обновлено: централизованный ключ
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

  // 🆕 НОВОЕ: Обработчик выбора операции с полной синхронизацией
  const handleOperationSelect = async (operation: any) => {
    try {
      console.log('🎯 Операция выбрана в Производстве:', operation);
      
      // 🆕 1. Назначаем операцию через новый API
      const syncResult = await synchronizationApi.assignOperationThroughPlanning({
        operationId: operation.id,
        machineId: operation.machineId || operation.assignedMachine,
      });
      
      if (syncResult.success) {
        console.log('✅ Операция успешно назначена и синхронизирована:', syncResult);
        
        // 🆕 2. Обновляем выбранную операцию с данными синхронизации
        const enhancedOperation = {
          ...operation,
          syncedWithShifts: true,
          assignedAt: syncResult.data.assignedAt,
          synchronizationStatus: syncResult.data.synchronizationStatus,
        };
        
        setSelectedOperation(enhancedOperation);
        
        // 🆕 3. Отправляем событие для real-time обновления
        window.dispatchEvent(new CustomEvent('operationAssigned', {
          detail: enhancedOperation
        }));
        
        // 🆕 4. Принудительная синхронизация всех данных
        await forceSyncAll();
        
        console.log('📢 Операция', operation.operationNumber, 'назначена и синхронизирована с Модулем Смен');
        
      } else {
        console.error('❌ Ошибка назначения операции:', syncResult.error);
        
        // Откат к старому методу
        await handleLegacyOperationSelect(operation);
      }
      
    } catch (error) {
      console.error('❌ Ошибка при назначении операции с синхронизацией:', error);
      
      // Откат к старому методу
      await handleLegacyOperationSelect(operation);
    }
  };

  // 🆕 Откат к старому методу (для совместимости)
  const handleLegacyOperationSelect = async (operation: any) => {
    try {
      console.log('⚠️ Откат к старому методу назначения операции');
      
      setSelectedOperation({
        ...operation,
        syncedWithShifts: false,
        legacyMode: true,
      });
      
      // Сохраняем в localStorage для обратной совместимости
      localStorage.setItem('selectedOperation', JSON.stringify(operation));
      
      // Отправляем событие для legacy-синхронизации
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
                  {useImprovedPlanning ? t('planning.improved_enabled') : t('planning.standard_enabled')}
                </span>
              </Space>
              <Space>
                <span>{t('planning.standard')}</span>
                <Switch 
                  checked={useImprovedPlanning}
                  onChange={setUseImprovedPlanning}
                  style={{
                    backgroundColor: useImprovedPlanning ? '#faad14' : undefined
                  }}
                />
                <span>{t('planning.improved')}</span>
                
                {/* 🆕 НОВОЕ: Кнопки управления синхронизацией */}
                <Button
                  type="primary"
                  size="small"
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
                    marginLeft: '16px'
                  }}
                >
                  Синхронизация
                </Button>
                
                <Button
                  size="small"
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
                >
                  Проверка
                </Button>
              </Space>
            </Space>
            
            {useImprovedPlanning && (
              <div style={{ marginTop: 12, color: '#8c5700', fontSize: '14px' }}>
                {t('planning.features_enabled')}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2>{t('production.machines')}</h2>
          
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
            {useImprovedPlanning ? t('planning.test_improved') : t('planning.test_standard')}
          </Button>
          
          {/* ИСПРАВЛЕНО: Группировка станков по типам с фиксированным порядком */}
          <div className="machines-grid">
            {/* Группа: Фрезерные станки */}
            {(() => {
              const millingMachines = machines
                ?.filter(machine => machine.machineType === 'MILLING' || machine.machineType === 'milling' || machine.machineType.includes('milling'))
                .sort((a, b) => a.machineName.localeCompare(b.machineName)); // Стабильная сортировка по имени
              
              if (millingMachines && millingMachines.length > 0) {
                return (
                  <div key="milling-group" style={{ marginBottom: '32px' }}>
                    <div style={{ 
                      marginBottom: '16px', 
                      padding: '12px', 
                      backgroundColor: '#e6f7ff', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #1890ff'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#1890ff', 
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        🔧 Фрезерные станки ({millingMachines.length})
                      </h3>
                    </div>
                    <Row gutter={[16, 16]}>
                      {millingMachines.map((machine) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={`milling-${machine.id}`}>
                          <MachineCard
                            machine={machine}
                            isSelected={selectedMachine?.id === machine.id}
                            onSelect={() => setSelectedMachine(machine)}
                            onOpenPlanningModal={handleOpenPlanningModal}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Группа: Токарные станки */}
            {(() => {
              const turningMachines = machines
                ?.filter(machine => machine.machineType === 'TURNING' || machine.machineType === 'turning' || machine.machineType.includes('turning'))
                .sort((a, b) => a.machineName.localeCompare(b.machineName)); // Стабильная сортировка по имени
              
              if (turningMachines && turningMachines.length > 0) {
                return (
                  <div key="turning-group" style={{ marginBottom: '32px' }}>
                    <div style={{ 
                      marginBottom: '16px', 
                      padding: '12px', 
                      backgroundColor: '#f6ffed', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #52c41a'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#52c41a', 
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        🔄 Токарные станки ({turningMachines.length})
                      </h3>
                    </div>
                    <Row gutter={[16, 16]}>
                      {turningMachines.map((machine) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={`turning-${machine.id}`}>
                          <MachineCard
                            machine={machine}
                            isSelected={selectedMachine?.id === machine.id}
                            onSelect={() => setSelectedMachine(machine)}
                            onOpenPlanningModal={handleOpenPlanningModal}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Группа: Другие станки (если есть) */}
            {(() => {
              const otherMachines = machines
                ?.filter(machine => 
                  !['MILLING', 'milling', 'TURNING', 'turning'].includes(machine.machineType) &&
                  !machine.machineType.includes('milling') &&
                  !machine.machineType.includes('turning')
                )
                .sort((a, b) => a.machineName.localeCompare(b.machineName)); // Стабильная сортировка по имени
              
              if (otherMachines && otherMachines.length > 0) {
                return (
                  <div key="other-group" style={{ marginBottom: '32px' }}>
                    <div style={{ 
                      marginBottom: '16px', 
                      padding: '12px', 
                      backgroundColor: '#fff7e6', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #faad14'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#faad14', 
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        ⚙️ Другие станки ({otherMachines.length})
                      </h3>
                    </div>
                    <Row gutter={[16, 16]}>
                      {otherMachines.map((machine) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={`other-${machine.id}`}>
                          <MachineCard
                            machine={machine}
                            isSelected={selectedMachine?.id === machine.id}
                            onSelect={() => setSelectedMachine(machine)}
                            onOpenPlanningModal={handleOpenPlanningModal}
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </Col>
      </Row>

      {selectedMachine && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <OrderRecommendations 
              machine={selectedMachine} 
              onOperationSelect={handleOperationSelect}
            />
          </Col>
        </Row>
      )}

      {/* 🆕 НОВОЕ: Отображение выбранной операции с статусом синхронизации */}
      {selectedOperation && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card 
              title="🎆 Выбранная операция" 
              extra={
                <Space>
                  {selectedOperation.syncedWithShifts && (
                    <Tag color="green" style={{ fontSize: '12px' }}>
                      ✅ Синхронизировано
                    </Tag>
                  )}
                  <Button 
                    type="link" 
                    onClick={() => {
                      setSelectedOperation(null);
                      localStorage.removeItem('selectedOperation');
                      // 🆕 Отправляем событие об очистке
                      window.dispatchEvent(new CustomEvent('operationCleared'));
                      console.log('🗑️ Операция очищена');
                    }}
                  >
                    Очистить
                  </Button>
                </Space>
              }
              style={{ 
                borderColor: selectedOperation.syncedWithShifts ? '#52c41a' : '#faad14',
                backgroundColor: selectedOperation.syncedWithShifts ? '#f6ffed' : '#fffbe6',
                borderRadius: '12px'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ fontSize: '16px', color: selectedOperation.syncedWithShifts ? '#52c41a' : '#faad14' }}>
                  📋 Операция #{selectedOperation.operationNumber}
                </Text>
                <div>
                  <Text strong>Тип:</Text> {selectedOperation.operationType}
                </div>
                <div>
                  <Text strong>Станок:</Text> {selectedOperation.machineName} ({selectedOperation.machineType})
                </div>
                <div>
                  <Text strong>Чертеж:</Text> {selectedOperation.orderDrawingNumber}
                </div>
                <div>
                  <Text strong>Время:</Text> {selectedOperation.estimatedTime} мин
                </div>
                
                {/* 🆕 Информация о синхронизации */}
                {selectedOperation.syncedWithShifts ? (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#d4edda', 
                    borderRadius: '8px',
                    marginTop: '8px',
                    border: '2px solid #52c41a'
                  }}>
                    <Text strong style={{ color: '#155724' }}>
                      ✅ Операция назначена и синхронизирована
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: '#155724' }}>
                      • Автоматически создана запись смены<br />
                      • Отображается в мониторинге смен<br />
                      • Прогресс обновляется автоматически
                    </Text>
                    {selectedOperation.synchronizationStatus && (
                      <div style={{ marginTop: '8px' }}>
                        <Text style={{ fontSize: '11px', color: '#666' }}>
                          Прогресс: {selectedOperation.synchronizationStatus.progress.toFixed(1)}% 
                          ({selectedOperation.synchronizationStatus.totalProduced}/{selectedOperation.synchronizationStatus.targetQuantity})
                        </Text>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}>
                    <Text strong style={{ color: '#856404' }}>
                      ⚠️ Операция выбрана, но не синхронизирована
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
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
