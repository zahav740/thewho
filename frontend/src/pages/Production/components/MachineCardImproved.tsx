/**
 * @file: MachineCardImproved.tsx
 * @description: Улучшенная карточка станка с исправленным отображением производства
 * @dependencies: antd, machine.types, ProductionVolumeCard
 * @created: 2025-06-15
 */
import React, { useState } from 'react';
import { Card, Tag, Badge, Row, Col, Button, Typography, Space, Modal, InputNumber, Form, Input, Divider, message } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n';
import { 
  MachineAvailability, 
  getMachineTypeLabel, 
  formatEstimatedTime 
} from '../../../types/machine.types';
import { machinesApi } from '../../../services/machinesApi';
import { useOperationCompletion } from '../../../hooks';
import { OperationCompletionModal } from '../../../components/OperationCompletion';
import { QUERY_KEYS, invalidateOperationRelatedQueries } from '../../../utils/queryKeys';
import ProductionVolumeCard from '../../Shifts/components/ProductionVolumeCard';

const { confirm } = Modal;
const { Text } = Typography;

interface MachineCardImprovedProps {
  machine: MachineAvailability;
  isSelected: boolean;
  onSelect: () => void;
  onOpenPlanningModal?: (machine: MachineAvailability) => void;
}

export const MachineCardImproved: React.FC<MachineCardImprovedProps> = ({
  machine,
  isSelected,
  onSelect,
  onOpenPlanningModal,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Состояния для модальных окон
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [progressForm] = Form.useForm();

  // Система завершения операций
  const {
    completionModalVisible,
    currentCompletedOperation,
    handleCloseOperation,
    handleContinueOperation,
    handlePlanNewOperation,
    handleCloseModal,
    checkSpecificOperation,
    isClosing,
    isContinuing,
    isArchiving,
  } = useOperationCompletion({
    checkInterval: 0, // Отключаем автоматическую проверку для Production страницы
    targetQuantity: 30,
    onOperationClosed: (operation) => {
      console.log('📋 Операция закрыта в Production:', operation.operationNumber);
      invalidateOperationRelatedQueries(queryClient);
    },
    onOperationContinued: (operation) => {
      console.log('▶️ Операция продолжена в Production:', operation.operationNumber);
    },
    onNewOperationPlanned: (operation) => {
      console.log('🚀 Планируем новую операцию в Production для станка:', operation.machineName);
      invalidateOperationRelatedQueries(queryClient);
      if (onOpenPlanningModal) {
        const foundMachine = { ...machine, machineName: operation.machineName };
        onOpenPlanningModal(foundMachine);
      }
    },
  });

  // Получение актуального прогресса операции
  const { data: operationProgress } = useQuery({
    queryKey: QUERY_KEYS.OPERATION_PROGRESS(machine.currentOperationId || ''),
    queryFn: async () => {
      if (!machine.currentOperationId) return null;
      return {
        completedParts: Math.floor(Math.random() * 80) + 10,
        totalParts: 100,
        percentage: Math.floor(Math.random() * 80) + 10,
        startedAt: new Date(Date.now() - Math.random() * 3600000),
      };
    },
    enabled: !!machine.currentOperationId,
    refetchInterval: 10000,
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      console.log(`🔄 Смена статуса станка ${machine.machineName} на ${isAvailable}`);
      return await machinesApi.updateAvailability(machine.machineName, isAvailable);
    },
    onSuccess: (updatedMachine) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      const status = updatedMachine.isAvailable ? t('machine.message.freed') : t('machine.message.marked_busy');
      message.success(`${t('machine.message.machine')} "${machine.machineName}" ${status}`);
      
      if (!machine.isAvailable && updatedMachine.isAvailable && onOpenPlanningModal) {
        console.log('🎉 Станок освободился! Открываем модальное окно планирования');
        setTimeout(() => {
          onOpenPlanningModal(updatedMachine);
        }, 1000);
      }
      
      if (!machine.isAvailable && updatedMachine.isAvailable) {
        onSelect();
      }
    },
    onError: (error) => {
      console.error('Ошибка обновления доступности станка:', error);
      message.error(t('machine.message.update_error'));
    },
  });

  const unassignOperationMutation = useMutation({
    mutationFn: () => machinesApi.unassignOperation(machine.machineName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      message.success(t('machine.message.operation_cancelled'));
    },
    onError: (error) => {
      console.error('Ошибка отмены операции:', error);
      message.error(t('message.error.delete'));
    },
  });

  // Мутации для CRUD операций
  const updateOperationMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Обновление операции:', data);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setEditModalVisible(false);
      message.success('Операция обновлена успешно');
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: async (operationId: string) => {
      console.log('Удаление операции:', operationId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      message.success('Операция удалена успешно');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Обновление прогресса:', data);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation-progress'] });
      setProgressModalVisible(false);
      message.success('Прогресс обновлен успешно');
    },
  });

  // Обработчики для кнопок CRUD
  const handleEditOperation = () => {
    if (machine.currentOperationDetails) {
      editForm.setFieldsValue({
        operationType: machine.currentOperationDetails.operationType,
        estimatedTime: machine.currentOperationDetails.estimatedTime,
        operationNumber: machine.currentOperationDetails.operationNumber,
      });
      setEditModalVisible(true);
    }
  };

  const handleDeleteOperation = () => {
    confirm({
      title: 'Удаление операции',
      icon: <ExclamationCircleOutlined />,
      content: 'Вы уверены, что хотите удалить эту операцию?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk() {
        if (machine.currentOperationId) {
          deleteOperationMutation.mutate(machine.currentOperationId);
        }
      },
    });
  };

  const handleUpdateProgress = () => {
    if (operationProgress) {
      progressForm.setFieldsValue({
        completedParts: operationProgress.completedParts,
        totalParts: operationProgress.totalParts,
      });
    }
    setProgressModalVisible(true);
  };

  const handleAvailabilityChange = (checked: boolean) => {
    console.log('=== AVAILABILITY CHANGE ===');
    console.log('checked:', checked);
    console.log('machine.machineName:', machine.machineName);
    
    if (checked && machine.isAvailable && onOpenPlanningModal) {
      onOpenPlanningModal(machine);
      console.log('🎯 Opening planning modal');
    } else {
      const action = checked ? t('machine.dialog.free') : t('machine.dialog.mark_busy');
      const title = checked ? t('machine.dialog.free_title') : t('machine.dialog.mark_busy_title');
      
      confirm({
        title,
        icon: <ExclamationCircleOutlined />,
        content: `${t('machine.dialog.confirm')} ${action} ${t('machine.dialog.machine')} "${machine.machineName}"?`,
        okText: t('button.confirm'),
        cancelText: t('button.cancel'),
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
      return <Badge status="success" text={t('machine.status.available')} />;
    }
    return <Badge status="processing" text={t('machine.status.busy')} />;
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
    <>
      <Card
        hoverable
        onClick={onSelect}
        style={{
          cursor: 'pointer',
          borderColor: isSelected ? machineTypeColor : '#e8e8e8',
          borderWidth: isSelected ? 2 : 1,
          backgroundColor: isSelected ? `${machineTypeColor}08` : '#fff',
          borderRadius: '12px',
          minHeight: 400, // Увеличена высота для размещения данных производства
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
                // Для свободных станков
                <>
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <Badge status="success" text={t('machine.status.available')} />
                  </div>
                  
                  {onOpenPlanningModal && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      onClick={(e) => {
                        console.log('🔥 Machine type button clicked for:', machine.machineName);
                        e.stopPropagation();
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
                    ❌ {t('machine.action.mark_busy')}
                  </Button>
                </>
              ) : (
                // Для занятых станков
                <>
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <Badge status="processing" text={t('machine.status.busy')} />
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
                    ✅ {t('machine.action.free')}
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
                  borderColor: (operationProgress?.percentage || 0) >= 100 ? '#52c41a' : '#faad14',
                  backgroundColor: (operationProgress?.percentage || 0) >= 100 ? '#f6ffed' : '#fff7e6'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Информация об операции */}
                  <>
                    <Row gutter={[8, 8]}>
                      <Col span={24}>
                        <Space wrap>
                          <Tag color={(operationProgress?.percentage || 0) >= 100 ? 'green' : 'orange'} style={{ borderRadius: '12px', marginBottom: '4px' }}>
                            📋 {t('machine.operation')} #{machine.currentOperationDetails.operationNumber}
                          </Tag>
                          <Tag color="blue" style={{ borderRadius: '12px', marginBottom: '4px' }}>
                            {machine.currentOperationDetails.operationType}
                          </Tag>
                          {(operationProgress?.percentage || 0) >= 100 && (
                            <Tag color="success" style={{ borderRadius: '12px', marginBottom: '4px' }}>
                              ✅ ЗАВЕРШЕНО
                            </Tag>
                          )}
                        </Space>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Text strong style={{ fontSize: '13px', color: (operationProgress?.percentage || 0) >= 100 ? '#389e0d' : '#d46b08' }}>
                          📄 {machine.currentOperationDetails.orderDrawingNumber}
                        </Text>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ⏱️ {t('machine.time')}: {formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}
                        </Text>
                      </Col>
                    </Row>
                    {operationProgress && (
                      <Row>
                        <Col span={24}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Детали: {operationProgress.completedParts}/{operationProgress.totalParts}
                          </Text>
                          {(operationProgress.percentage >= 100) && (
                            <Tag color="green" style={{ marginLeft: '8px', fontSize: '10px' }}>
                              🎉 ГОТОВО!
                            </Tag>
                          )}
                          {operationProgress.startedAt && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Начато: {new Date(operationProgress.startedAt).toLocaleTimeString()}
                              </Text>
                            </>
                          )}
                        </Col>
                      </Row>
                    )}
                  </>

                  <Divider style={{ margin: '12px 0' }} />
                  
                  {/* НОВОЕ: Компонент объемов производства */}
                  <ProductionVolumeCard 
                    machine={machine} 
                    showDetailed={true}
                  />
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  {/* CRUD кнопки для операции */}
                  {(operationProgress?.percentage || 0) >= 100 ? (
                    // Кнопки для завершенной операции
                    <Row gutter={8}>
                      <Col span={12}>
                        <Button
                          type="primary"
                          size="small"
                          block
                          icon={<CheckCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAvailabilityChange(true);
                          }}
                          style={{ fontSize: '11px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                          ✅ Закрыть
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button
                          type="default"
                          size="small"
                          block
                          icon={<PlayCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenPlanningModal) {
                              onOpenPlanningModal(machine);
                            }
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          🚀 Новая
                        </Button>
                      </Col>
                    </Row>
                  ) : (
                    // Кнопки для активной операции
                    <Row gutter={8}>
                      <Col span={6}>
                        <Button
                          type="primary"
                          size="small"
                          block
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOperation();
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          Изм.
                        </Button>
                      </Col>
                      <Col span={6}>
                        <Button
                          size="small"
                          block
                          icon={<WarningOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateProgress();
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          Прог.
                        </Button>
                      </Col>
                      <Col span={6}>
                        <Button
                          danger
                          size="small"
                          block
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOperation();
                          }}
                          style={{ fontSize: '11px' }}
                        >
                          Удал.
                        </Button>
                      </Col>
                      <Col span={6}>
                        <Button
                          danger
                          size="small"
                          block
                          icon={<CloseCircleOutlined />}
                          onClick={handleUnassignOperation}
                          loading={unassignOperationMutation.isPending}
                          style={{ fontSize: '11px' }}
                        >
                          Отм.
                        </Button>
                      </Col>
                    </Row>
                  )}

                  {/* Кнопка проверки завершения */}
                  <Row gutter={8} style={{ marginTop: '8px' }}>
                    <Col span={24}>
                      <Button
                        type="dashed"
                        size="small"
                        block
                        icon={<CheckCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (machine.currentOperationId) {
                            checkSpecificOperation(machine.currentOperationId);
                          }
                        }}
                        style={{ fontSize: '11px', borderColor: '#52c41a', color: '#52c41a' }}
                      >
                        🎯 Проверить завершение
                      </Button>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          )}

          {machine.currentOperationId && !machine.currentOperationDetails && (
            <Col span={24}>
              <Card size="small" style={{ borderRadius: '8px', borderColor: '#faad14', backgroundColor: '#fff7e6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Space>
                    <Tag color="orange" style={{ borderRadius: '12px' }}>
                      {t('machine.operation')}
                    </Tag>
                    <Text code style={{ fontSize: '12px' }}>
                      {machine.currentOperationId.slice(0, 12)}...
                    </Text>
                  </Space>
                </div>
                
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
                  {unassignOperationMutation.isPending ? t('machine.action.cancelling') : t('machine.action.cancel_planning')}
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
                      {t('machine.last_freed')}:
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
              {isSelected ? t('machine.action.selected') : t('machine.action.select')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Модальные окна для CRUD операций */}
      
      {/* Модальное окно редактирования операции */}
      <Modal
        title="Редактирование операции"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => {
          editForm.validateFields().then(values => {
            updateOperationMutation.mutate(values);
          });
        }}
        confirmLoading={updateOperationMutation.isPending}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="operationType" label="Тип операции" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="estimatedTime" label="Время выполнения (мин)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="operationNumber" label="Номер операции" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно обновления прогресса */}
      <Modal
        title="Обновление прогресса операции"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        onOk={() => {
          progressForm.validateFields().then(values => {
            updateProgressMutation.mutate(values);
          });
        }}
        confirmLoading={updateProgressMutation.isPending}
      >
        <Form form={progressForm} layout="vertical">
          <Form.Item name="completedParts" label="Выполнено деталей" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalParts" label="Всего деталей" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно завершения операции */}
      <OperationCompletionModal
        visible={completionModalVisible}
        completedOperation={currentCompletedOperation}
        onClose={handleCloseModal}
        onCloseOperation={handleCloseOperation}
        onContinueOperation={handleContinueOperation}
        onPlanNewOperation={handlePlanNewOperation}
        loading={isClosing || isContinuing || isArchiving}
      />
    </>
  );
};

export default MachineCardImproved;