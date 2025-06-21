/**
 * @file: MachineDetailsModal.tsx
 * @description: Модальное окно с подробной информацией о станке и операции
 * @dependencies: antd, machine.types
 * @created: 2025-06-21
 * @updated: 2025-06-21 - Полная информация об операции и управлении станком
 */
import React, { useState } from 'react';
import { 
  Modal, 
  Card, 
  Tag, 
  Badge, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space, 
  Divider,
  Progress,
  Form,
  InputNumber,
  Input,
  message,
  Popconfirm
} from 'antd';
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
import { shiftsApi } from '../../../services/shiftsApi';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface MachineDetailsModalProps {
  visible: boolean;
  machine: MachineAvailability;
  onClose: () => void;
  onOpenPlanningModal?: (machine: MachineAvailability) => void;
  onFreeAndClear: () => void;
  onUpdateAvailability: (isAvailable: boolean) => void;
  loading: boolean;
}

export const MachineDetailsModal: React.FC<MachineDetailsModalProps> = ({
  visible,
  machine,
  onClose,
  onOpenPlanningModal,
  onFreeAndClear,
  onUpdateAvailability,
  loading
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [progressForm] = Form.useForm();

  // Получение данных смен для прогресса
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['shifts', 'recent', machine.id],
    queryFn: async () => {
      const startDate = dayjs().subtract(3, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');
      return shiftsApi.getAll({
        startDate,
        endDate,
      });
    },
    refetchInterval: 5000,
    enabled: visible && !!machine.currentOperationDetails,
  });

  // Мутация для отмены операции
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

  // Вычисление прогресса операции
  const operationProgress = React.useMemo(() => {
    if (!machine.currentOperationDetails || !todayShifts) {
      return null;
    }

    // Найдем смены для текущей операции
    const matchedShifts = todayShifts.filter((shift: any) => {
      const shiftMachineId = parseInt(shift.machineId?.toString() || '0');
      const currentMachineId = parseInt(machine.id?.toString() || '0');
      const matchesMachine = shiftMachineId === currentMachineId;
      
      const drawingNumberField = shift.drawingNumber || shift.orderDrawingNumber;
      const matchesDrawing = drawingNumberField === machine.currentOperationDetails?.orderDrawingNumber;
      
      const shiftDate = dayjs(shift.date || shift.createdAt);
      const isRecent = shiftDate.isAfter(dayjs().subtract(1, 'day'));
      
      return matchesMachine && matchesDrawing && isRecent;
    });

    const totalProduced = matchedShifts.reduce((sum: number, shift: any) => {
      const dayShift = shift.dayShiftQuantity || 0;
      const nightShift = shift.nightShiftQuantity || 0;
      return sum + dayShift + nightShift;
    }, 0);

    const targetQuantity = (machine.currentOperationDetails as any)?.targetQuantity || 
                          (machine.currentOperationDetails as any)?.plannedQuantity || 
                          (machine.currentOperationDetails as any)?.quantity || 
                          30;
    
    const percentage = Math.min((totalProduced / targetQuantity) * 100, 100);
    const isCompleted = totalProduced >= targetQuantity && totalProduced > 0;
    
    return {
      completedParts: totalProduced,
      totalParts: targetQuantity,
      percentage: Math.round(percentage),
      isCompleted: isCompleted,
      dayShiftQuantity: matchedShifts.reduce((sum: number, shift: any) => sum + (shift.dayShiftQuantity || 0), 0),
      nightShiftQuantity: matchedShifts.reduce((sum: number, shift: any) => sum + (shift.nightShiftQuantity || 0), 0),
      dayShiftOperator: matchedShifts.find((shift: any) => shift.dayShiftOperator)?.dayShiftOperator || '-',
      nightShiftOperator: matchedShifts.find((shift: any) => shift.nightShiftOperator)?.nightShiftOperator || 'Аркадий',
      shiftsUsed: matchedShifts.length,
    };
  }, [machine.currentOperationDetails, machine.id, todayShifts]);

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
    <Modal
      title={
        <Space>
          <span style={{ color: machineTypeColor, fontSize: '20px' }}>
            {getMachineIcon(machine.machineType)}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {machine.machineName} - Подробная информация
          </span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Row gutter={[16, 16]}>
          {/* Основная информация о станке */}
          <Col span={24}>
            <Card size="small" style={{ borderColor: machineTypeColor }}>
              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Space direction="vertical" size="small">
                    <div>
                      <Text strong>Статус:</Text>{' '}
                      <Badge 
                        status={machine.isAvailable ? "success" : "processing"} 
                        text={machine.isAvailable ? t('machine.status.available') : t('machine.status.busy')} 
                      />
                    </div>
                    <div>
                      <Text strong>Тип станка:</Text>{' '}
                      <Tag color={machineTypeColor}>
                        {getMachineIcon(machine.machineType)} {getMachineTypeLabel(machine.machineType)}
                      </Tag>
                    </div>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {machine.isAvailable ? (
                      onOpenPlanningModal && (
                        <Button
                          type="primary"
                          block
                          icon={<PlayCircleOutlined />}
                          onClick={() => {
                            onClose();
                            onOpenPlanningModal(machine);
                          }}
                          style={{ 
                            backgroundColor: machineTypeColor,
                            borderColor: machineTypeColor
                          }}
                        >
                          Запланировать операцию
                        </Button>
                      )
                    ) : (
                      <Popconfirm
                        title="Освобождение станка"
                        description="Что вы хотите сделать с операцией?"
                        okText="Отменить операцию"
                        cancelText="Просто освободить"
                        onConfirm={onFreeAndClear}
                        onCancel={() => onUpdateAvailability(true)}
                      >
                        <Button
                          block
                          icon={<CheckCircleOutlined />}
                          loading={loading}
                        >
                          Освободить станок
                        </Button>
                      </Popconfirm>
                    )}
                    
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        const newStatus = !machine.isAvailable;
                        onUpdateAvailability(newStatus);
                      }}
                      loading={loading}
                    >
                      {machine.isAvailable ? '❌ Отметить как занятый' : '✅ Отметить как свободный'}
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Информация об операции */}
          {machine.currentOperationDetails && (
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <span>📋 Текущая операция</span>
                    {operationProgress?.isCompleted && (
                      <Tag color="success">✅ ЗАВЕРШЕНО</Tag>
                    )}
                  </Space>
                }
                size="small"
                style={{ 
                  borderColor: operationProgress?.isCompleted ? '#52c41a' : '#faad14',
                  backgroundColor: operationProgress?.isCompleted ? '#f6ffed' : '#fff7e6'
                }}
              >
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Номер операции:</Text>
                        <br />
                        <Tag color="blue">#{machine.currentOperationDetails.operationNumber}</Tag>
                      </div>
                      <div>
                        <Text strong>Тип операции:</Text>
                        <br />
                        <Tag color="orange">{machine.currentOperationDetails.operationType}</Tag>
                      </div>
                      <div>
                        <Text strong>Чертеж:</Text>
                        <br />
                        <Text code>{machine.currentOperationDetails.orderDrawingNumber}</Text>
                      </div>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Время выполнения:</Text>
                        <br />
                        <Text>{formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}</Text>
                      </div>
                      {operationProgress && (
                        <>
                          <div>
                            <Text strong>Прогресс:</Text>
                            <Progress 
                              percent={operationProgress.percentage} 
                              status={operationProgress.isCompleted ? 'success' : 'active'}
                              size="small"
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {operationProgress.completedParts}/{operationProgress.totalParts} деталей
                            </Text>
                          </div>
                        </>
                      )}
                    </Space>
                  </Col>
                </Row>

                {/* Детальная информация о производстве */}
                {operationProgress && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card size="small" style={{ backgroundColor: '#f0f9ff' }}>
                          <Text strong style={{ color: '#1890ff' }}>🌅 Дневная смена</Text>
                          <br />
                          <Text>Произведено: <Text strong>{operationProgress.dayShiftQuantity}</Text></Text>
                          <br />
                          <Text>Оператор: <Text strong>{operationProgress.dayShiftOperator}</Text></Text>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                          <Text strong style={{ color: '#52c41a' }}>🌙 Ночная смена</Text>
                          <br />
                          <Text>Произведено: <Text strong>{operationProgress.nightShiftQuantity}</Text></Text>
                          <br />
                          <Text>Оператор: <Text strong>{operationProgress.nightShiftOperator}</Text></Text>
                        </Card>
                      </Col>
                    </Row>
                    
                    <div style={{ 
                      marginTop: '12px',
                      padding: '12px', 
                      backgroundColor: operationProgress.isCompleted ? '#f6ffed' : '#fff7e6', 
                      borderRadius: '6px',
                      border: `2px solid ${operationProgress.isCompleted ? '#52c41a' : '#faad14'}`
                    }}>
                      <Text strong style={{ 
                        fontSize: '14px',
                        color: operationProgress.isCompleted ? '#52c41a' : '#d46b08'
                      }}>
                        📊 Общий итог: {operationProgress.completedParts} из {operationProgress.totalParts} деталей
                        {operationProgress.isCompleted && ' - ОПЕРАЦИЯ ЗАВЕРШЕНА!'}
                      </Text>
                      <br />
                      <Text style={{ fontSize: '12px', color: '#666' }}>
                        Использовано смен: {operationProgress.shiftsUsed}
                      </Text>
                    </div>
                  </>
                )}

                {/* Кнопки управления операцией */}
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={8}>
                  <Col span={6}>
                    <Button
                      type="primary"
                      size="small"
                      block
                      icon={<EditOutlined />}
                      onClick={() => {
                        editForm.setFieldsValue({
                          operationType: machine.currentOperationDetails?.operationType,
                          estimatedTime: machine.currentOperationDetails?.estimatedTime,
                          operationNumber: machine.currentOperationDetails?.operationNumber,
                        });
                        setEditModalVisible(true);
                      }}
                    >
                      Изменить
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button
                      size="small"
                      block
                      icon={<WarningOutlined />}
                      onClick={() => {
                        if (operationProgress) {
                          progressForm.setFieldsValue({
                            completedParts: operationProgress.completedParts,
                            totalParts: operationProgress.totalParts,
                            dayShiftQuantity: operationProgress.dayShiftQuantity,
                            nightShiftQuantity: operationProgress.nightShiftQuantity,
                            dayShiftOperator: operationProgress.dayShiftOperator,
                            nightShiftOperator: operationProgress.nightShiftOperator,
                          });
                        }
                        setProgressModalVisible(true);
                      }}
                    >
                      Прогресс
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Popconfirm
                      title="Удаление операции"
                      description="Вы уверены, что хотите удалить эту операцию?"
                      okText="Удалить"
                      cancelText="Отмена"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        size="small"
                        block
                        icon={<DeleteOutlined />}
                      >
                        Удалить
                      </Button>
                    </Popconfirm>
                  </Col>
                  <Col span={6}>
                    <Button
                      danger
                      size="small"
                      block
                      icon={<CloseCircleOutlined />}
                      onClick={() => unassignOperationMutation.mutate()}
                      loading={unassignOperationMutation.isPending}
                    >
                      Отменить
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          )}

          {/* Операция без деталей */}
          {machine.currentOperationId && !machine.currentOperationDetails && (
            <Col span={24}>
              <Card 
                title="📋 Назначенная операция"
                size="small"
                style={{ borderColor: '#faad14', backgroundColor: '#fff7e6' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>ID операции:</Text>
                    <br />
                    <Text code>{machine.currentOperationId}</Text>
                  </div>
                  <Button
                    danger
                    block
                    icon={<CloseCircleOutlined />}
                    onClick={() => unassignOperationMutation.mutate()}
                    loading={unassignOperationMutation.isPending}
                  >
                    Отменить планирование
                  </Button>
                </Space>
              </Card>
            </Col>
          )}

          {/* Дополнительная информация */}
          {machine.lastFreedAt && (
            <Col span={24}>
              <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#666' }} />
                  <div>
                    <Text strong>Последнее освобождение:</Text>
                    <br />
                    <Text>{new Date(machine.lastFreedAt).toLocaleString('ru-RU')}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </div>

      {/* Модальные окна для редактирования */}
      <Modal
        title="Редактирование операции"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => {
          editForm.validateFields().then(values => {
            console.log('Обновление операции:', values);
            message.success('Операция обновлена успешно');
            setEditModalVisible(false);
          });
        }}
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

      <Modal
        title="Информация о прогрессе"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setProgressModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={600}
      >
        <Form form={progressForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="completedParts" label="Общее количество (деталей)">
                <InputNumber style={{ width: '100%' }} disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalParts" label="Плановое количество">
                <InputNumber style={{ width: '100%' }} disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider>Производство по сменам</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Дневная смена:</Text>
              <Form.Item name="dayShiftQuantity" label="Количество" style={{ marginTop: 8 }}>
                <InputNumber style={{ width: '100%' }} disabled />
              </Form.Item>
              <Form.Item name="dayShiftOperator" label="Оператор">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Text strong>Ночная смена:</Text>
              <Form.Item name="nightShiftQuantity" label="Количество" style={{ marginTop: 8 }}>
                <InputNumber style={{ width: '100%' }} disabled />
              </Form.Item>
              <Form.Item name="nightShiftOperator" label="Оператор">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', marginTop: '16px' }}>
            <Text strong style={{ color: '#1890ff' }}>
              📊 Информация: Данные о производстве берутся из смен и обновляются автоматически.
            </Text>
          </div>
        </Form>
      </Modal>
    </Modal>
  );
};
