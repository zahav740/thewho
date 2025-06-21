/**
 * @file: OrderForm.tsx (С ПОДДЕРЖКОЙ PDF)
 * @description: Форма создания/редактирования заказа с возможностью загрузки и просмотра PDF
 * @dependencies: antd, react-hook-form, ordersApi, PdfUpload
 * @created: 2025-01-28
 * @updated: 2025-06-21 // Добавлена поддержка PDF
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
} from 'antd';
import { PlusOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import { CreateOrderDto, Priority, OrderFormOperationDto } from '../../../types/order.types';
import { OperationType } from '../../../types/operation.types';
import { useTranslation } from '../../../hooks/useTranslation';
import { PdfUpload } from '../../../components/common';

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
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string>('');
  const isEdit = !!orderId;
  const dataLoadedRef = useRef(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateOrderDto>({
    defaultValues: {
      drawingNumber: '',
      quantity: 1,
      deadline: dayjs().add(7, 'days').format('YYYY-MM-DD'),
      priority: Priority.MEDIUM,
      workType: '',
      operations: [],
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
        workType: orderData.workType,
        operations: orderData.operations.map((op): OrderFormOperationDto => ({
          operationNumber: op.operationNumber,
          operationType: op.operationType || OperationType.MILLING,
          machineAxes: parseAxisValue(op.machineAxes),
          estimatedTime: op.estimatedTime,
        })),
      });

      // Устанавливаем URL существующего PDF
      if (orderData.pdfPath) {
        console.log('📄 PDF путь с сервера:', orderData.pdfPath);
        const pdfUrl = ordersApi.getPdfUrlByPath(orderData.pdfPath);
        console.log('📄 Сгенерированный PDF URL:', pdfUrl);
        setExistingPdfUrl(pdfUrl);
      }
      
      dataLoadedRef.current = true;
    }
  }, [orderData, reset]);

  // Сброс данных при закрытии формы
  useEffect(() => {
    if (!visible) {
      dataLoadedRef.current = false;
      setPdfFile(null);
      setExistingPdfUrl('');
    }
  }, [visible]);

  // Мутация для загрузки PDF
  const uploadPdfMutation = useMutation({
    mutationFn: ({ orderId, file }: { orderId: number; file: File }) =>
      ordersApi.uploadPdf(orderId, file),
    onSuccess: (updatedOrder) => {
      message.success(t('order_form.pdf_uploaded'));
      // Обновляем кэш заказа
      queryClient.setQueryData(['order', orderId], updatedOrder);
      
      // Устанавливаем новый URL PDF
      if (updatedOrder.pdfPath) {
        console.log('📄 Новый PDF путь:', updatedOrder.pdfPath);
        const pdfUrl = ordersApi.getPdfUrlByPath(updatedOrder.pdfPath);
        console.log('📄 Новый PDF URL:', pdfUrl);
        setExistingPdfUrl(pdfUrl);
      }
    },
    onError: (error: any) => {
      console.error('Ошибка при загрузке PDF:', error);
      message.error(t('order_form.pdf_upload_error') + ': ' + (error.response?.data?.message || error.message));
    },
  });

  // Мутация для удаления PDF
  const deletePdfMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.deletePdf(orderId),
    onSuccess: (updatedOrder) => {
      message.success('PDF файл удален');
      setExistingPdfUrl('');
      // Обновляем кэш заказа
      queryClient.setQueryData(['order', orderId], updatedOrder);
    },
    onError: (error: any) => {
      console.error('Ошибка при удалении PDF:', error);
      message.error('Ошибка при удалении PDF: ' + (error.response?.data?.message || error.message));
    },
  });

  // Мутации для создания и обновления заказа
  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async (createdOrder) => {
      message.success(t('order_form.order_created'));
      
      // Если есть PDF файл для загрузки
      if (pdfFile) {
        try {
          await uploadPdfMutation.mutateAsync({ orderId: createdOrder.id, file: pdfFile });
        } catch (error) {
          console.error('Ошибка загрузки PDF после создания заказа:', error);
        }
      }
      
      dataLoadedRef.current = false;
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
    onSuccess: async (updatedOrder) => {
      message.success(t('order_form.order_updated'));
      
      // Если есть новый PDF файл для загрузки
      if (pdfFile) {
        try {
          await uploadPdfMutation.mutateAsync({ orderId: updatedOrder.id, file: pdfFile });
        } catch (error) {
          console.error('Ошибка загрузки PDF после обновления заказа:', error);
        }
      }
      
      dataLoadedRef.current = false;
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
      
      if (formattedData.operations && formattedData.operations.length > 0) {
        formattedData.operations = formattedData.operations.map(op => ({
          ...op,
          operationNumber: Number(op.operationNumber),
          machineAxes: Number(op.machineAxes),
          estimatedTime: Number(op.estimatedTime)
        }));
      }
      
      formattedData.priority = String(formattedData.priority) as any;
      
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
    append(newOperation);
  };

  const handleRemoveOperation = (index: number) => {
    remove(index);
  };

  const handlePdfChange = (file: File | null) => {
    setPdfFile(file);
  };

  const handlePdfRemove = () => {
    if (isEdit && orderId && existingPdfUrl) {
      // Удаляем существующий PDF с сервера
      deletePdfMutation.mutate(orderId);
    }
    setPdfFile(null);
    setExistingPdfUrl('');
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
      width={900}
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
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
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

          <Divider orientation="left">
            <FileTextOutlined style={{ marginRight: 8 }} />
            {t('order_form.pdf_upload')}
          </Divider>

          <Form.Item label={t('order_form.pdf_upload')}>
            <PdfUpload
              value={existingPdfUrl}
              onChange={handlePdfChange}
              onRemove={handlePdfRemove}
              disabled={uploadPdfMutation.isPending || deletePdfMutation.isPending}
              showPreview={true}
              maxSize={100}
            />
          </Form.Item>

          <Divider orientation="left">{t('order_form.operations')}</Divider>

          <Form.Item label={t('order_form.operations')}>
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