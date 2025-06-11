/**
 * @file: OrderForm.tsx (ИСПРАВЛЕНА ПРОБЛЕМА С УДАЛЕНИЕМ ОПЕРАЦИЙ)
 * @description: Форма создания/редактирования заказа
 * @dependencies: antd, react-hook-form, ordersApi
 * @created: 2025-01-28
 * @updated: 2025-06-07 // ИСПРАВЛЕНА логика удаления операций
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
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import { CreateOrderDto, Priority, OrderFormOperationDto } from '../../../types/order.types';
import { OperationType } from '../../../types/operation.types';
import { useTranslation } from '../../../hooks/useTranslation';

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
  const { t, tWithParams } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!orderId;
  const dataLoadedRef = useRef(false); // Флаг для предотвращения повторной загрузки

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateOrderDto>({
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
  const { data: orderData } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (orderData && !dataLoadedRef.current) {
      // Загружаем данные только один раз
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
      console.log('Операции из БД:', orderData.operations);
      
      reset({
        drawingNumber: orderData.drawingNumber,
        quantity: orderData.quantity,
        deadline: orderData.deadline,
        priority: orderData.priority,
        workType: orderData.workType,
        operations: orderData.operations.map((op): OrderFormOperationDto => ({
          operationNumber: op.operationNumber,
          operationType: op.operationType || OperationType.MILLING,
          machineAxes: parseAxisValue(op.machineAxes),
          estimatedTime: op.estimatedTime,
        })),
      });
      
      dataLoadedRef.current = true; // Помечаем что данные загружены
    }
  }, [orderData, reset]);

  // Сброс флага при закрытии формы
  useEffect(() => {
    if (!visible) {
      dataLoadedRef.current = false;
    }
  }, [visible]);

  // Мутации для создания и обновления
  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      message.success(t('order_form.order_created'));
      dataLoadedRef.current = false; // Сброс флага
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Ошибка при создании заказа:', error);
      message.error(t('order_form.create_error') + ': ' + (error.response?.data?.message || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      ordersApi.update(id, data),
    onSuccess: () => {
      message.success(t('order_form.order_updated'));
      dataLoadedRef.current = false; // Сброс флага
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Ошибка при обновлении заказа:', error);
      message.error(t('order_form.update_error') + ': ' + (error.response?.data?.message || error.message));
    },
  });

  const onSubmit = async (data: CreateOrderDto) => {
    setLoading(true);
    
    try {
      const formattedData = { ...data };
      
      // Преобразуем операции для бэкенда
      if (formattedData.operations && formattedData.operations.length > 0) {
        formattedData.operations = formattedData.operations.map(op => ({
          ...op,
          operationNumber: Number(op.operationNumber),
          machineAxes: Number(op.machineAxes),
          estimatedTime: Number(op.estimatedTime)
        }));
        console.log('Отправляем операции:', formattedData.operations);
      }
      
      formattedData.priority = String(formattedData.priority) as any;
      console.log('Отформатированные данные:', formattedData);
      
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
    const newOperation: OrderFormOperationDto = {
      operationNumber: lastOperation ? lastOperation.operationNumber + 1 : 1,
      operationType: OperationType.MILLING,
      machineAxes: 3,
      estimatedTime: 60,
    };
    console.log('Добавляем операцию:', newOperation);
    append(newOperation);
  };

  const handleRemoveOperation = (index: number) => {
    console.log(`Удаляем операцию с индексом ${index}`);
    console.log('Операции до удаления:', fields);
    remove(index);
  };

  const operationColumns = [
    {
      title: t('order_form.operation_number'),
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
      title: t('order_form.operation_type'),
      dataIndex: 'operationType',
      width: 150,
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`operations.${index}.operationType`}
          control={control}
          render={({ field }) => (
            <Select {...field} style={{ width: '100%' }}>
              <Option value={OperationType.MILLING}>{t('order_form.milling')}</Option>
              <Option value={OperationType.TURNING}>{t('order_form.turning')}</Option>
            </Select>
          )}
        />
      ),
    },
    {
      title: t('order_form.machine_axes'),
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
      title: t('order_form.estimated_time'),
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
          title={`Удалить операцию ${index + 1}`}
        />
      ),
    },
  ];

  return (
    <Modal
      title={isEdit ? t('order_form.edit_order') : t('order_form.new_order')}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('order_form.cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit(onSubmit)}
        >
          {isEdit ? t('order_form.save') : t('order_form.create')}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form layout="vertical">
          <Form.Item
            label={t('order_form.drawing_number')}
            required
            validateStatus={errors.drawingNumber ? 'error' : ''}
            help={errors.drawingNumber?.message}
          >
            <Controller
              name="drawingNumber"
              control={control}
              rules={{ required: t('order_form.required_field') }}
              render={({ field }) => (
                <Input {...field} placeholder={t('order_form.drawing_placeholder')} />
              )}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label={t('order_form.quantity')}
              required
              validateStatus={errors.quantity ? 'error' : ''}
            >
              <Controller
                name="quantity"
                control={control}
                rules={{ required: t('order_form.required_field'), min: 1 }}
                render={({ field }) => (
                  <InputNumber {...field} min={1} style={{ width: 120 }} />
                )}
              />
            </Form.Item>

            <Form.Item
              label={t('order_form.priority')}
              required
              validateStatus={errors.priority ? 'error' : ''}
            >
              <Controller
                name="priority"
                control={control}
                rules={{ required: t('order_form.required_field') }}
                render={({ field }) => (
                  <Select {...field} style={{ width: 150 }}>
                    <Option value={Priority.HIGH}>{t('priority.HIGH')}</Option>
                    <Option value={Priority.MEDIUM}>{t('priority.MEDIUM')}</Option>
                    <Option value={Priority.LOW}>{t('priority.LOW')}</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label={t('order_form.deadline')}
              required
              validateStatus={errors.deadline ? 'error' : ''}
            >
              <Controller
                name="deadline"
                control={control}
                rules={{ required: t('order_form.required_field') }}
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

          <Form.Item label={t('order_form.work_type')}>
            <Controller
              name="workType"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={t('order_form.work_type_placeholder')} />
              )}
            />
          </Form.Item>

          <Form.Item label={t('order_form.operations')} required>
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
                  {t('order_form.add_operation')}
                </Button>
              )}
            />
            {fields.length > 0 && (
              <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                {tWithParams('order_form.operations_count', { count: fields.length })}
              </div>
            )}
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};
