/**
 * @file: OrderForm.tsx
 * @description: Улучшенная форма создания/редактирования заказа для V2
 * @dependencies: antd, react-hook-form, ordersApi
 * @created: 2025-07-03
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Table,
  Spin,
  Card,
  Tag,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined, FlagOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import {
  CreateOrderV2Dto,
  PriorityV2,
  WorkTypeV2,
  OrderFormOperationV2Dto,
  OperationTypeV2,
  OperationV2,
} from '../../../types/order-v2.types';
import { useTranslation } from '../../../hooks/useTranslation';

const { Option } = Select;

interface OrderFormProps {
  visible: boolean;
  orderId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Функция для получения текста для WorkTypeV2
const getWorkTypeText = (workType: WorkTypeV2): string => {
  const mapping = {
    [WorkTypeV2.MILLING]: '🔧 Фрезерная обработка',
    [WorkTypeV2.TURNING]: '⚙️ Токарная обработка',
  };
  return mapping[workType] || '🔧 Фрезерная обработка';
};

export const OrderForm: React.FC<OrderFormProps> = ({
  visible,
  orderId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [calculatedPriority, setCalculatedPriority] = useState<PriorityV2 | null>(null);
  const [priorityReason, setPriorityReason] = useState<string>('');
  const isEdit = !!orderId;
  const dataLoadedRef = useRef(false);

  const { control, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm<CreateOrderV2Dto>({
    defaultValues: {
      drawingNumber: '',
      quantity: 1,
      deadline: dayjs().add(7, 'days').format('YYYY-MM-DD'),
      priority: PriorityV2.MEDIUM,
      workType: WorkTypeV2.MILLING,
      operations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'operations',
  });

  const watchedDeadline = watch('deadline');
  const watchedOperations = watch('operations');

  // Автоматический расчет приоритета
  useEffect(() => {
    if (watchedDeadline && watchedOperations) {
      const deadline = dayjs(watchedDeadline);
      const now = dayjs();
      const daysLeft = deadline.diff(now, 'day');
      
      const totalTime = watchedOperations.reduce((sum, op) => sum + (op.estimatedTime || 0), 0);
      const hasComplexOps = watchedOperations.some(op => op.operationType === OperationTypeV2.TURNING || op.estimatedTime > 120);
      
      let newPriority = PriorityV2.MEDIUM;
      let reason = '';
      
      if (daysLeft <= 1) {
        newPriority = PriorityV2.URGENT;
        reason = 'Срочный дедлайн (менее 1 дня)';
      } else if (daysLeft <= 3 && (hasComplexOps || totalTime > 300)) {
        newPriority = PriorityV2.HIGH;
        reason = 'Близкий дедлайн + сложные операции';
      } else if (daysLeft <= 7 && hasComplexOps) {
        newPriority = PriorityV2.HIGH;
        reason = 'Сложные операции';
      } else if (daysLeft <= 3) {
        newPriority = PriorityV2.HIGH;
        reason = 'Близкий дедлайн';
      } else if (totalTime > 180) {
        newPriority = PriorityV2.MEDIUM;
        reason = 'Средняя сложность операций';
      } else {
        newPriority = PriorityV2.LOW;
        reason = 'Стандартный заказ';
      }
      
      setCalculatedPriority(newPriority);
      setPriorityReason(reason);
    }
  }, [watchedDeadline, watchedOperations]);

  // Загрузка данных заказа для редактирования
  const { data: orderData } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getByIdV2(orderId!),
    enabled: isEdit && visible,
    staleTime: 0,
  });

  // Заполнение формы при загрузке данных
  useEffect(() => {
    if (orderData && !dataLoadedRef.current) {
      reset({
        drawingNumber: orderData.drawingNumber,
        quantity: orderData.quantity,
        deadline: orderData.deadline,
        priority: orderData.priority,
        workType: orderData.workType as WorkTypeV2,
        operations: orderData.operations?.map((op: OperationV2): OrderFormOperationV2Dto => ({
          operationNumber: op.operationNumber,
          operationType: op.operationType || OperationTypeV2.MILLING,
          machineAxes: op.machineAxes || 3,
          estimatedTime: op.estimatedTime || 0,
        })) || [],
      });
      dataLoadedRef.current = true;
    }
  }, [orderData, reset]);

  // Создание/обновление заказа
  const createMutation = useMutation({
    mutationFn: (data: CreateOrderV2Dto) => 
      isEdit ? ordersApi.updateV2(orderId!, data) : ordersApi.createV2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onSuccess();
      onClose();
    },
  });

  const onSubmit = async (data: CreateOrderV2Dto) => {
    setLoading(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = () => {
    append({
      operationNumber: fields.length + 1,
      operationType: OperationTypeV2.MILLING,
      machineAxes: 3,
      estimatedTime: 60,
    });
  };

  const operationColumns = [
    {
      title: '№',
      dataIndex: 'operationNumber',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Тип операции',
      dataIndex: 'operationType',
      render: (_: any, __: any, index: number) => (
        <Controller
          control={control}
          name={`operations.${index}.operationType`}
          render={({ field }) => (
            <Select {...field} style={{ width: '100%' }}>
              <Option value={OperationTypeV2.MILLING}>🔧 Фрезерование</Option>
              <Option value={OperationTypeV2.TURNING}>⚙️ Токарная</Option>
              <Option value={OperationTypeV2.DRILLING}>🔩 Сверление</Option>
              <Option value={OperationTypeV2.GRINDING}>🟨 Шлифование</Option>
            </Select>
          )}
        />
      ),
    },
    {
      title: 'Оси',
      dataIndex: 'machineAxes',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Controller
          control={control}
          name={`operations.${index}.machineAxes`}
          render={({ field }) => (
            <Select {...field} style={{ width: '100%' }}>
              <Option value={3}>3 оси</Option>
              <Option value={4}>4 оси</Option>
              <Option value={5}>5 осей</Option>
            </Select>
          )}
        />
      ),
    },
    {
      title: 'Время (мин)',
      dataIndex: 'estimatedTime',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Controller
          control={control}
          name={`operations.${index}.estimatedTime`}
          render={({ field }) => (
            <InputNumber {...field} min={1} max={999} style={{ width: '100%' }} />
          )}
        />
      ),
    },
    {
      title: 'Действия',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => remove(index)}
          size="small"
        />
      ),
    },
  ];

  const handleClose = () => {
    reset();
    dataLoadedRef.current = false;
    onClose();
  };

  return (
    <Modal
      title={isEdit ? 'Редактировать заказ' : 'Создать новый заказ'}
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit(onSubmit)}
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form layout="vertical">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Основная информация */}
            <Card title={<><InfoCircleOutlined /> Основная информация</>} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Controller
                  control={control}
                  name="drawingNumber"
                  rules={{ required: 'Номер чертежа обязателен' }}
                  render={({ field }) => (
                    <Form.Item
                      label="Номер чертежа"
                      validateStatus={errors.drawingNumber ? 'error' : ''}
                      help={errors.drawingNumber?.message}
                    >
                      <Input {...field} placeholder="Введите номер чертежа" />
                    </Form.Item>
                  )}
                />

                <Space>
                  <Controller
                    control={control}
                    name="quantity"
                    rules={{ required: 'Количество обязательно', min: { value: 1, message: 'Минимум 1' } }}
                    render={({ field }) => (
                      <Form.Item
                        label="Количество"
                        validateStatus={errors.quantity ? 'error' : ''}
                        help={errors.quantity?.message}
                      >
                        <InputNumber {...field} min={1} max={9999} style={{ width: 120 }} />
                      </Form.Item>
                    )}
                  />

                  <Controller
                    control={control}
                    name="workType"
                    render={({ field }) => (
                      <Form.Item label="Тип работы">
                        <Select {...field} style={{ width: 200 }}>
                          <Option value={WorkTypeV2.MILLING}>🔧 Фрезерная</Option>
                          <Option value={WorkTypeV2.TURNING}>⚙️ Токарная</Option>
                        </Select>
                      </Form.Item>
                    )}
                  />
                </Space>
              </Space>
            </Card>

            {/* Планирование */}
            <Card title={<><CalendarOutlined /> Планирование</>} size="small">
              <Space>
                <Controller
                  control={control}
                  name="deadline"
                  rules={{ required: 'Дедлайн обязателен' }}
                  render={({ field }) => (
                    <Form.Item
                      label="Дедлайн"
                      validateStatus={errors.deadline ? 'error' : ''}
                      help={errors.deadline?.message}
                    >
                      <DatePicker 
                        {...field} 
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(date?.format('YYYY-MM-DD'))}
                        style={{ width: 160 }}
                      />
                    </Form.Item>
                  )}
                />

                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Form.Item label="Приоритет">
                      <Select {...field} style={{ width: 160 }}>
                        <Option value={PriorityV2.LOW}>📋 Низкий</Option>
                        <Option value={PriorityV2.MEDIUM}>⚡ Средний</Option>
                        <Option value={PriorityV2.HIGH}>🔥 Высокий</Option>
                        <Option value={PriorityV2.URGENT}>⚠️ Срочный</Option>
                      </Select>
                    </Form.Item>
                  )}
                />
              </Space>

              {calculatedPriority && (
                <Alert
                  message={`Рекомендуемый приоритет: ${calculatedPriority}`}
                  description={priorityReason}
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                  action={
                    <Button
                      size="small"
                      onClick={() => setValue('priority', calculatedPriority)}
                    >
                      Применить
                    </Button>
                  }
                />
              )}
            </Card>

            {/* Операции */}
            <Card
              title={<><SettingOutlined /> Операции ({fields.length})</>}
              size="small"
            >
              <Table
                dataSource={fields}
                columns={operationColumns}
                rowKey="id"
                pagination={false}
                size="small"
                footer={() => (
                  <Button
                    type="dashed"
                    onClick={handleAddOperation}
                    icon={<PlusOutlined />}
                    block
                  >
                    Добавить операцию
                  </Button>
                )}
              />
              {fields.length > 0 && (
                <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                  Всего операций: {fields.length}
                </div>
              )}
            </Card>
          </Space>
        </Form>
      </Spin>
    </Modal>
  );
};
