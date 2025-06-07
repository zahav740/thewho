/**
 * @file: OrderForm.DEBUGGED.tsx - ОТЛАДОЧНАЯ ВЕРСИЯ
 * @description: Форма создания/редактирования заказа с расширенной отладкой
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
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import { CreateOrderDto, Priority, OrderFormOperationDto } from '../../../types/order.types';
import { OperationType } from '../../../types/operation.types';

const { Option } = Select;
const { Text } = Typography;

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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const isEdit = !!orderId;
  const dataLoadedRef = useRef(false);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<CreateOrderDto>({
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

  // Watch для отладки
  const formValues = watch();
  
  useEffect(() => {
    console.log('🔍 Form values changed:', formValues);
    setDebugInfo({
      formValues,
      fieldsCount: fields.length,
      isEdit,
      orderId,
      dataLoaded: dataLoadedRef.current
    });
  }, [formValues, fields.length, isEdit, orderId]);

  // Загрузка данных при редактировании
  const { data: orderData, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: isEdit && !!orderId,
  });

  // Отслеживание успешной загрузки данных
  useEffect(() => {
    if (orderData) {
      console.log('🔄 Order data loaded:', orderData);
    }
  }, [orderData]);

  // Отслеживание ошибок загрузки
  useEffect(() => {
    if (orderError) {
      console.error('❌ Error loading order:', orderError);
    }
  }, [orderError]);

  useEffect(() => {
    if (orderData && !dataLoadedRef.current && visible) {
      console.log('🔄 Loading order data into form:', orderData);
      
      const parseAxisValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const match = value.match(/^(\d+)/);
          const parsedValue = match ? parseInt(match[1], 10) : 3;
          return (parsedValue === 3 || parsedValue === 4) ? parsedValue : 3;
        }
        return 3;
      };
      
      const formData = {
        drawingNumber: orderData?.drawingNumber || '',
        quantity: orderData?.quantity || 1,
        deadline: orderData?.deadline || dayjs().add(7, 'days').format('YYYY-MM-DD'),
        priority: orderData?.priority || Priority.MEDIUM,
        workType: orderData?.workType || '',
        operations: orderData?.operations && orderData.operations.length > 0 
          ? orderData.operations.map((op: any): OrderFormOperationDto => ({
              operationNumber: op.operationNumber || 1,
              operationType: op.operationType || OperationType.MILLING,
              machineAxes: parseAxisValue(op.machineAxes),
              estimatedTime: op.estimatedTime || 60,
            }))
          : [{
              operationNumber: 1,
              operationType: OperationType.MILLING,
              machineAxes: 3,
              estimatedTime: 60,
            }],
      };
      
      console.log('🔄 Form data for reset:', formData);
      reset(formData);
      dataLoadedRef.current = true;
    }
  }, [orderData, reset, visible]);

  // Сброс при закрытии
  useEffect(() => {
    if (!visible) {
      console.log('🔄 Form closed, resetting state');
      dataLoadedRef.current = false;
      setDebugInfo(null);
    }
  }, [visible]);

  // Создание заказа
  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (data) => {
      console.log('✅ Order created successfully:', data);
      message.success('Заказ успешно создан');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      dataLoadedRef.current = false;
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Error creating order:', error);
      message.error('Ошибка при создании заказа: ' + (error.response?.data?.message || error.message));
    },
  });

  // Обновление заказа
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ordersApi.update(id, data),
    onSuccess: (data) => {
      console.log('✅ Order updated successfully:', data);
      message.success('Заказ успешно обновлен');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      dataLoadedRef.current = false;
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Error updating order:', error);
      message.error('Ошибка при обновлении заказа: ' + (error.response?.data?.message || error.message));
    },
  });

  const onSubmit = async (data: CreateOrderDto) => {
    console.log('📤 Form submission started:', data);
    setLoading(true);
    
    try {
      // Преобразуем данные для отправки
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
      
      console.log('📤 Formatted data for API:', formattedData);
      
      if (isEdit && orderId) {
        console.log('📤 Updating order:', orderId);
        await updateMutation.mutateAsync({ id: orderId, data: formattedData });
      } else {
        console.log('📤 Creating new order');
        await createMutation.mutateAsync(formattedData);
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = () => {
    const lastOperation = fields[fields.length - 1];
    const newOperation: OrderFormOperationDto = {
      operationNumber: lastOperation ? lastOperation.operationNumber + 1 : fields.length + 1,
      operationType: OperationType.MILLING,
      machineAxes: 3,
      estimatedTime: 60,
    };
    console.log('➕ Adding operation:', newOperation);
    append(newOperation);
  };

  const handleRemoveOperation = (index: number) => {
    console.log('➖ Removing operation at index:', index);
    console.log('➖ Current fields:', fields);
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
            <InputNumber 
              {...field} 
              min={1} 
              style={{ width: '100%' }}
              onChange={(value) => {
                console.log(`🔢 Operation ${index} number changed to:`, value);
                field.onChange(value);
              }}
            />
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
            <Select 
              {...field} 
              style={{ width: '100%' }}
              onChange={(value) => {
                console.log(`🔧 Operation ${index} type changed to:`, value);
                field.onChange(value);
              }}
            >
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
            <Select 
              {...field} 
              style={{ width: '100%' }}
              onChange={(value) => {
                console.log(`⚙️ Operation ${index} axes changed to:`, value);
                field.onChange(value);
              }}
            >
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
            <InputNumber 
              {...field} 
              min={1} 
              style={{ width: '100%' }}
              onChange={(value) => {
                console.log(`⏱️ Operation ${index} time changed to:`, value);
                field.onChange(value);
              }}
            />
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
      title={isEdit ? 'Редактировать заказ' : 'Новый заказ'}
      open={visible}
      onCancel={onClose}
      width={900}
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
          {/* Отладочная информация */}
          {debugInfo && (
            <div style={{ 
              background: '#f0f2f5', 
              padding: '8px', 
              marginBottom: '16px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <Text strong>🔍 Debug Info:</Text><br/>
              <Text>Mode: {isEdit ? 'EDIT' : 'CREATE'}</Text><br/>
              <Text>Order ID: {orderId || 'N/A'}</Text><br/>
              <Text>Data Loaded: {dataLoadedRef.current ? 'YES' : 'NO'}</Text><br/>
              <Text>Operations Count: {fields.length}</Text><br/>
              <Text>Form Valid: {Object.keys(errors).length === 0 ? 'YES' : 'NO'}</Text><br/>
              {Object.keys(errors).length > 0 && (
                <Text type="danger">Errors: {JSON.stringify(errors)}</Text>
              )}
            </div>
          )}

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
                <Input 
                  {...field} 
                  placeholder="Например: C6HP0021A"
                  onChange={(e) => {
                    console.log('📝 Drawing number changed:', e.target.value);
                    field.onChange(e);
                  }}
                />
              )}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label="Количество"
              required
              validateStatus={errors.quantity ? 'error' : ''}
            >
              <Controller
                name="quantity"
                control={control}
                rules={{ required: 'Обязательное поле', min: 1 }}
                render={({ field }) => (
                  <InputNumber 
                    {...field} 
                    min={1} 
                    style={{ width: 120 }}
                    onChange={(value) => {
                      console.log('🔢 Quantity changed:', value);
                      field.onChange(value);
                    }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Приоритет"
              required
              validateStatus={errors.priority ? 'error' : ''}
            >
              <Controller
                name="priority"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <Select 
                    {...field} 
                    style={{ width: 150 }}
                    onChange={(value) => {
                      console.log('📊 Priority changed:', value);
                      field.onChange(value);
                    }}
                  >
                    <Option value={Priority.HIGH}>Высокий</Option>
                    <Option value={Priority.MEDIUM}>Средний</Option>
                    <Option value={Priority.LOW}>Низкий</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label="Срок выполнения"
              required
              validateStatus={errors.deadline ? 'error' : ''}
            >
              <Controller
                name="deadline"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    format="DD.MM.YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => {
                      const dateString = date?.format('YYYY-MM-DD');
                      console.log('📅 Deadline changed:', dateString);
                      field.onChange(dateString);
                    }}
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
                <Input 
                  {...field} 
                  placeholder="Например: Фрезерная обработка"
                  onChange={(e) => {
                    console.log('🔧 Work type changed:', e.target.value);
                    field.onChange(e);
                  }}
                />
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
              Операций в форме: {fields.length}
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};
