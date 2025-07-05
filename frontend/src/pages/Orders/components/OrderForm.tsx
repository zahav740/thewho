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
  message,
  Spin,
  Divider,
  Card,
  Tag,
  Tooltip,
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
  getWorkTypeEnumFromString
} from '../../../types/order-v2.types';
import { useTranslation } from '../../../hooks/useTranslation';

const { Option } = Select;

interface OrderFormProps {
  visible: boolean;
  orderId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Функция для получения текста для WorkTypeV2 - ТОЛЬКО РЕАЛЬНЫЕ ТИПЫ
const getWorkTypeText = (workType: WorkTypeV2): string => {
  const mapping = {
    [WorkTypeV2.MILLING]: '🔧 Фрезерная обработка',
    [WorkTypeV2.TURNING]: '⚙️ Токарная обработка',
  };
  return mapping[workType] || '🔧 Фрезерная обработка'; // По умолчанию
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

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateOrderV2Dto>({
    defaultValues: {
      drawingNumber: '',
      quantity: 1,
      deadline: dayjs().add(7, 'days').format('YYYY-MM-DD'),
      priority: PriorityV2.MEDIUM,
      workType: WorkTypeV2.MILLING, // По умолчанию фрезерная (реальный тип)
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
      
      // Расчет сложности операций
      const totalTime = watchedOperations.reduce((sum, op) => sum + (op.estimatedTime || 0), 0);
      const has4Axis = watchedOperations.some(op => op.machineAxes === 4);
      const hasComplexOps = watchedOperations.some(op => op.operationType === OperationTypeV2.TURNING || op.estimatedTime > 120);
      
      let priority = PriorityV2.MEDIUM;
      let reason = '';
      
      if (daysLeft <= 3) {
        priority = PriorityV2.HIGH;
        reason = `Критический дедлайн: ${daysLeft} дней`;
      } else if (daysLeft <= 7 && (has4Axis || hasComplexOps || totalTime > 300)) {
        priority = PriorityV2.HIGH;
        reason = `Срочный дедлайн + сложные операции`;
      } else if (daysLeft <= 7) {
        priority = PriorityV2.MEDIUM;
        reason = `Средний дедлайн: ${daysLeft} дней`;
      } else if (has4Axis || hasComplexOps || totalTime > 480) {
        priority = PriorityV2.MEDIUM;
        reason = `Сложные операции: ${watchedOperations.length} оп., ${totalTime} мин`;
      } else {
        priority = PriorityV2.LOW;
        reason = `Стандартный заказ: ${daysLeft} дней`;
      }
      
      setCalculatedPriority(priority);
      setPriorityReason(reason);
    }
  }, [watchedDeadline, watchedOperations]);

  // Загрузка данных при редактировании
  const { data: orderData } = useQuery({
    queryKey: ['order-v2', orderId],
    queryFn: () => ordersApi.getByIdV2(orderId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (orderData && !dataLoadedRef.current) {
      const parseAxisValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const match = value.match(/^(\d+)/);
          const parsedValue = match ? parseInt(match[1], 10) : 3;
          return (parsedValue === 3 || parsedValue === 4) ? parsedValue : 3;
        }
        return 3;
      };
      
      console.log('Загружаем данные заказа:', orderData);
      
      reset({
        drawingNumber: orderData.drawingNumber,
        quantity: orderData.quantity,
        deadline: orderData.deadline,
        priority: orderData.priority,
        workType: getWorkTypeEnumFromString(orderData.workType || ''), // Конвертируем строку в enum
        operations: orderData.operations?.map((op): OrderFormOperationV2Dto => ({
          operationNumber: op.operationNumber,
          operationType: op.operationType || OperationTypeV2.MILLING,
          machineAxes: parseAxisValue(op.machineAxes),
          estimatedTime: op.estimatedTime,
        })) || [],
      });
      
      dataLoadedRef.current = true;
    }
  }, [orderData, reset]);

  // Сброс данных при закрытии формы
  useEffect(() => {
    if (!visible) {
      dataLoadedRef.current = false;
      setCalculatedPriority(null);
      setPriorityReason('');
    }
  }, [visible]);

  // Мутации для создания и обновления заказа
  const createMutation = useMutation({
    mutationFn: ordersApi.createV2,
    onSuccess: (createdOrder) => {
      message.success('Заказ успешно создан');
      dataLoadedRef.current = false;
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Ошибка при создании заказа:', error);
      message.error('Ошибка при создании заказа: ' + (error.response?.data?.message || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      ordersApi.updateV2(id, data),
    onSuccess: (updatedOrder) => {
      message.success('Заказ успешно обновлен');
      dataLoadedRef.current = false;
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Ошибка при обновлении заказа:', error);
      message.error('Ошибка при обновлении заказа: ' + (error.response?.data?.message || error.message));
    },
  });

  const onSubmit = async (data: CreateOrderV2Dto) => {
    setLoading(true);
    
    try {
      const formattedData = { ...data };
      
      // Применяем рассчитанный приоритет если он есть
      if (calculatedPriority && !isEdit) {
        formattedData.priority = calculatedPriority;
      }
      
      if (formattedData.operations && formattedData.operations.length > 0) {
        formattedData.operations = formattedData.operations.map(op => ({
          ...op,
          operationNumber: Number(op.operationNumber),
          machineAxes: Number(op.machineAxes),
          estimatedTime: Number(op.estimatedTime)
        }));
      }
      
      if (isEdit && orderId) {
        await updateMutation.mutateAsync({ id: orderId, data: formattedData });
      } else {
        await createMutation.mutateAsync(formattedData);
      }
    } catch (error) {
      console.error('Ошибка при отправке данных формы:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = () => {
    const lastOperation = fields[fields.length - 1];
    const newOperation: OrderFormOperationV2Dto = {
      operationNumber: lastOperation ? lastOperation.operationNumber + 1 : 1,
      operationType: OperationTypeV2.MILLING,
      machineAxes: 3,
      estimatedTime: 60,
    };
    append(newOperation);
  };

  const handleRemoveOperation = (index: number) => {
    remove(index);
  };

  const handleUseSuggestedPriority = () => {
    if (calculatedPriority) {
      message.success(`Приоритет установлен: ${calculatedPriority}`);
    }
  };

  const operationColumns = [
    {
      title: '№',
      dataIndex: 'operationNumber',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`operations.${index}.operationNumber`}
          control={control}
          render={({ field }) => (
            <InputNumber {...field} min={1} style={{ width: '100%' }} />
          )}
        />
      ),
    },
    {
      title: 'Тип операции',
      dataIndex: 'operationType',
      width: 150,
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`operations.${index}.operationType`}
          control={control}
          render={({ field }) => (
            <Select {...field} style={{ width: '100%' }}>
              <Option value={OperationTypeV2.MILLING}>🔧 Фрезерная</Option>
              <Option value={OperationTypeV2.TURNING}>⚙️ Токарная</Option>
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
          name={`operations.${index}.machineAxes`}
          control={control}
          render={({ field }) => (
            <Select {...field} style={{ width: '100%' }}>
              <Option value={3}>3 оси</Option>
              <Option value={4}>4 оси</Option>
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
          name={`operations.${index}.estimatedTime`}
          control={control}
          render={({ field }) => (
            <InputNumber {...field} min={1} style={{ width: '100%' }} />
          )}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveOperation(index)}
          title={`Удалить операцию ${index + 1}`}
        />
      ),
    },
  ];

  const totalOperationTime = watchedOperations?.reduce((sum, op) => sum + (op.estimatedTime || 0), 0) || 0;

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          {isEdit ? 'Редактирование заказа' : 'Создание заказа'}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
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
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      <Spin spinning={loading}>
        <Form layout="vertical">
          <Card title="Основная информация" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              label="Номер чертежа"
              required
              validateStatus={errors.drawingNumber ? 'error' : ''}
              help={errors.drawingNumber?.message}
            >
              <Controller
                name="drawingNumber"
                control={control}
                rules={{ required: 'Это поле обязательно' }}
                render={({ field }) => (
                  <Input {...field} placeholder="Введите номер чертежа" />
                )}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Количество"
                required
                validateStatus={errors.quantity ? 'error' : ''}
                style={{ flex: 1 }}
              >
                <Controller
                  name="quantity"
                  control={control}
                  rules={{ required: 'Это поле обязательно', min: 1 }}
                  render={({ field }) => (
                    <InputNumber {...field} min={1} style={{ width: '100%' }} />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Дедлайн"
                required
                validateStatus={errors.deadline ? 'error' : ''}
                style={{ flex: 1 }}
              >
                <Controller
                  name="deadline"
                  control={control}
                  rules={{ required: 'Это поле обязательно' }}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      format="DD.MM.YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format('YYYY-MM-DD'))}
                      style={{ width: '100%' }}
                      prefix={<CalendarOutlined />}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Приоритет"
                required
                validateStatus={errors.priority ? 'error' : ''}
                style={{ flex: 1 }}
              >
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: 'Это поле обязательно' }}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Option value={PriorityV2.HIGH}>🔥 Высокий</Option>
                      <Option value={PriorityV2.MEDIUM}>⚡ Средний</Option>
                      <Option value={PriorityV2.LOW}>📋 Низкий</Option>
                    </Select>
                  )}
                />
              </Form.Item>
            </div>

            <Form.Item label="Тип работы" required>
              <Controller
                name="workType"
                control={control}
                rules={{ required: 'Это поле обязательно' }}
                render={({ field }) => (
                  <Select {...field} style={{ width: '100%' }}>
                    {Object.values(WorkTypeV2).map(wt => (
                      <Option key={wt} value={wt}>
                        {getWorkTypeText(wt)}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Card>

          {/* Умный помощник по приоритету */}
          {calculatedPriority && (
            <Card 
              title={
                <Space>
                  <InfoCircleOutlined />
                  Рекомендуемый приоритет
                </Space>
              } 
              size="small" 
              style={{ marginBottom: 16 }}
            >
              <Alert
                message={
                  <Space>
                    <FlagOutlined />
                    Рекомендуемый приоритет: 
                    <Tag color={calculatedPriority === PriorityV2.HIGH ? 'red' : calculatedPriority === PriorityV2.MEDIUM ? 'orange' : 'green'}>
                      {calculatedPriority === PriorityV2.HIGH ? '🔥 Высокий' : calculatedPriority === PriorityV2.MEDIUM ? '⚡ Средний' : '📋 Низкий'}
                    </Tag>
                  </Space>
                }
                description={priorityReason}
                type="info"
                showIcon
                action={
                  <Button size="small" onClick={handleUseSuggestedPriority}>
                    Применить
                  </Button>
                }
              />
            </Card>
          )}

          <Card 
            title={
              <Space>
                <SettingOutlined />
                Операции
                {totalOperationTime > 0 && (
                  <Tag color="blue">
                    Общее время: {totalOperationTime} мин
                  </Tag>
                )}
              </Space>
            } 
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
        </Form>
      </Spin>
    </Modal>
  );
};
