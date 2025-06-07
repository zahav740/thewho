/**
 * @file: OrderForm.SIMPLE.tsx - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
 * @description: Упрощенная форма без сложной отладки
 */
import React, { useEffect, useState } from 'react';
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
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import { CreateOrderDto, Priority, OrderFormOperationDto } from '../../../types/order.types';
import { OperationType } from '../../../types/operation.types';

const { Option } = Select;

interface OrderFormProps {
  visible: boolean;
  orderId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  visible,
  orderId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!orderId;
  const queryClient = useQueryClient();

  console.log('🔧 OrderForm rendered:', { visible, orderId, isEdit });

  const { control, handleSubmit, reset, formState: { errors }, setValue, getValues } = useForm<CreateOrderDto>({
    defaultValues: {
      drawingNumber: '',
      quantity: 1,
      deadline: dayjs().add(7, 'days').format('YYYY-MM-DD'),
      priority: Priority.MEDIUM,
      workType: '',
      operations: [
        {
          operationNumber: 1,
          operationType: OperationType.MILLING,
          machineAxes: 3,
          estimatedTime: 60,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'operations',
  });

  // Загрузка данных при редактировании
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: isEdit && !!orderId,
  });

  // Загрузка данных в форму
  useEffect(() => {
    if (orderData && visible && isEdit) {
      console.log('📥 Loading data into form:', orderData);
      
      // Простой сброс с данными
      reset({
        drawingNumber: orderData.drawingNumber || '',
        quantity: orderData.quantity || 1,
        deadline: orderData.deadline || dayjs().format('YYYY-MM-DD'),
        priority: orderData.priority || Priority.MEDIUM,
        workType: orderData.workType || '',
        operations: orderData.operations && orderData.operations.length > 0 
          ? orderData.operations.map((op: any) => ({
              operationNumber: Number(op.operationNumber) || 1,
              operationType: op.operationType || OperationType.MILLING,
              machineAxes: Number(op.machineAxes) || 3,
              estimatedTime: Number(op.estimatedTime) || 60,
            }))
          : [
              {
                operationNumber: 1,
                operationType: OperationType.MILLING,
                machineAxes: 3,
                estimatedTime: 60,
              }
            ],
      });
    }
  }, [orderData, visible, isEdit, reset]);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!visible) {
      console.log('🔄 Form closed, resetting');
      reset({
        drawingNumber: '',
        quantity: 1,
        deadline: dayjs().add(7, 'days').format('YYYY-MM-DD'),
        priority: Priority.MEDIUM,
        workType: '',
        operations: [
          {
            operationNumber: 1,
            operationType: OperationType.MILLING,
            machineAxes: 3,
            estimatedTime: 60,
          },
        ],
      });
    }
  }, [visible, reset]);

  // Создание заказа
  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      message.success('Заказ успешно создан');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Create error:', error);
      message.error('Ошибка при создании заказа');
    },
  });

  // Обновление заказа
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ordersApi.update(id, data),
    onSuccess: () => {
      message.success('Заказ успешно обновлен');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Update error:', error);
      message.error('Ошибка при обновлении заказа');
    },
  });

  const onSubmit = async (data: CreateOrderDto) => {
    console.log('📤 Submitting form:', data);
    setLoading(true);
    
    try {
      const formattedData = {
        ...data,
        priority: Number(data.priority),
        quantity: Number(data.quantity),
        operations: data.operations.map(op => ({
          ...op,
          operationNumber: Number(op.operationNumber),
          machineAxes: Number(op.machineAxes),
          estimatedTime: Number(op.estimatedTime)
        }))
      };
      
      console.log('📤 Formatted data:', formattedData);
      
      if (isEdit && orderId) {
        await updateMutation.mutateAsync({ id: orderId, data: formattedData });
      } else {
        await createMutation.mutateAsync(formattedData);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = () => {
    const newOp = {
      operationNumber: fields.length + 1,
      operationType: OperationType.MILLING,
      machineAxes: 3,
      estimatedTime: 60,
    };
    console.log('➕ Adding operation:', newOp);
    append(newOp);
  };

  const handleRemoveOperation = (index: number) => {
    console.log('➖ Removing operation:', index);
    remove(index);
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
              <Option value={OperationType.MILLING}>Фрезерная</Option>
              <Option value={OperationType.TURNING}>Токарная</Option>
              <Option value={OperationType.DRILLING}>Сверление</Option>
              <Option value={OperationType.GRINDING}>Шлифовка</Option>
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
              <Option value={3}>3</Option>
              <Option value={4}>4</Option>
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
          disabled={fields.length === 1}
        />
      ),
    },
  ];

  return (
    <Modal
      title={isEdit ? 'Редактировать заказ' : 'Новый заказ'}
      open={visible}
      onCancel={onClose}
      width={800}
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
    >
      <Spin spinning={loading || orderLoading}>
        <Form layout="vertical">
          <Form.Item
            label="Номер чертежа"
            required
            validateStatus={errors.drawingNumber ? 'error' : ''}
            help={errors.drawingNumber?.message}
          >
            <Controller
              name="drawingNumber"
              control={control}
              rules={{ required: 'Обязательное поле' }}
              render={({ field }) => (
                <Input {...field} placeholder="Например: C6HP0021A" />
              )}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Количество" required>
              <Controller
                name="quantity"
                control={control}
                rules={{ required: 'Обязательное поле', min: 1 }}
                render={({ field }) => (
                  <InputNumber {...field} min={1} style={{ width: 120 }} />
                )}
              />
            </Form.Item>

            <Form.Item label="Приоритет" required>
              <Controller
                name="priority"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <Select {...field} style={{ width: 150 }}>
                    <Option value={Priority.HIGH}>Высокий</Option>
                    <Option value={Priority.MEDIUM}>Средний</Option>
                    <Option value={Priority.LOW}>Низкий</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item label="Срок выполнения" required>
              <Controller
                name="deadline"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    format="DD.MM.YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format('YYYY-MM-DD'))}
                  />
                )}
              />
            </Form.Item>
          </Space>

          <Form.Item label="Тип работы">
            <Controller
              name="workType"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Например: Фрезерная обработка" />
              )}
            />
          </Form.Item>

          <Form.Item label="Операции" required>
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
            <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
              Операций: {fields.length}
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};
