/**
 * @file: OrderForm.SIMPLE.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С PDF ДИАГНОСТИКОЙ
 * @description: Упрощенная форма с исправленной поддержкой PDF и диагностикой
 * @updated: 2025-06-21 - Исправлены проблемы с PDF превью
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
  Tabs,
  Divider,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, FilePdfOutlined, BugOutlined, UploadOutlined, ExpandOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import { pdfApi } from '../../../services/pdfApi';
import { CreateOrderDto, Priority } from '../../../types/order.types';
import { OperationType } from '../../../types/operation.types';
import { useTranslation } from '../../../i18n';
import { InlinePdfViewerFixed as InlinePdfViewer } from '../../../components/common/InlinePdfViewer.FIXED';

const { Option } = Select;
// const { TabPane } = Tabs; // Deprecated, replaced with items prop

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
  const [activeTab, setActiveTab] = useState('1');
  const [currentPdfPath, setCurrentPdfPath] = useState<string | undefined>();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const isEdit = !!orderId;
  const queryClient = useQueryClient();

  console.log('🔧 OrderForm (ИСПРАВЛЕННАЯ PDF) rendered:', { visible, orderId, isEdit });

  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm<CreateOrderDto>({
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
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: isEdit && !!orderId,
  });

  // Загрузка данных в форму
  useEffect(() => {
    if (orderData && visible && isEdit) {
      console.log('📥 Loading data into form:', orderData);
      
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
          : [],
      });

      // Загружаем информацию о PDF
      console.log('📄 PDF path from order data:', orderData.pdfPath);
      setCurrentPdfPath(orderData.pdfPath);
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
        operations: [],
      });
      setCurrentPdfPath(undefined);
      setPdfFile(null);
      setActiveTab('1');
    }
  }, [visible, reset]);

  // Создание заказа
  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async (newOrder) => {
      message.success(t('order_form.order_created'));
      
      // Если есть PDF файл для загрузки, загружаем его
      if (pdfFile && newOrder.id) {
        try {
          console.log('📁 Uploading PDF for new order:', newOrder.id);
          // Извлекаем номер чертежа из формы
          const formData = getValues();
          const drawingNumber = formData.drawingNumber || `order_${newOrder.id}`;
          const result = await pdfApi.uploadPdfSimple(newOrder.id, pdfFile);
          message.success('PDF файл также загружен');
        } catch (error) {
          console.error('❌ PDF upload error for new order:', error);
          message.warning('Заказ создан, но PDF файл не загружен');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Create error:', error);
      message.error(t('order_form.create_error'));
    },
  });

  // Обновление заказа
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ordersApi.update(id, data),
    onSuccess: async () => {
      message.success(t('order_form.order_updated'));
      
      // Если есть PDF файл для загрузки, загружаем его
      if (pdfFile && orderId) {
        try {
          console.log('📁 Uploading PDF for updated order:', orderId);
          // Извлекаем номер чертежа из формы
          const formData = getValues();
          const drawingNumber = formData.drawingNumber || `order_${orderId}`;
          const result = await pdfApi.uploadPdfSimple(orderId, pdfFile);
          message.success('PDF файл также обновлен');
        } catch (error) {
          console.error('❌ PDF upload error for updated order:', error);
          message.warning('Заказ обновлен, но PDF файл не загружен');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Update error:', error);
      message.error(t('order_form.update_error'));
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

  // PDF Upload Handler (исправленный)
  const handlePdfChange = (file: File | null) => {
    console.log('📄 PDF file changed:', file?.name);
    setPdfFile(file);
  };

  // PDF Remove Handler (исправленный)
  const handlePdfRemove = async () => {
    if (!orderId) {
      setPdfFile(null);
      return;
    }

    try {
      console.log('🗑️ Removing PDF for order:', orderId);
      const result = await pdfApi.deletePdf(orderId);
      
      // deletePdf теперь возвращает объект с success и message
      setCurrentPdfPath(undefined);
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      message.success(result.message || 'PDF файл удален');
    } catch (error) {
      console.error('❌ PDF remove error:', error);
      message.error('Ошибка при удалении PDF файла');
    }
  };

  // Функция для получения URL PDF
  const getCurrentPdfUrl = () => {
    if (currentPdfPath) {
      return pdfApi.getPdfUrlByPath(currentPdfPath);
    }
    return '';
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
    >
      <Spin spinning={loading || orderLoading}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          type="card"
          items={[
            {
              key: '1',
              label: (
                <Space>
                  <span>📋</span>
                  <span>Основная информация</span>
                </Space>
              ),
              children: (
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
                <Form.Item label={t('order_form.quantity')} required>
                  <Controller
                    name="quantity"
                    control={control}
                    rules={{ required: t('order_form.required_field'), min: 1 }}
                    render={({ field }) => (
                      <InputNumber {...field} min={1} style={{ width: 120 }} />
                    )}
                  />
                </Form.Item>

                <Form.Item label={t('order_form.priority')} required>
                  <Controller
                    name="priority"
                    control={control}
                    rules={{ required: t('order_form.required_field') }}
                    render={({ field }) => (
                      <Select {...field} style={{ width: 150 }}>
                        <Option value={Priority.HIGH}>{t('priority.high')}</Option>
                        <Option value={Priority.MEDIUM}>{t('priority.medium')}</Option>
                        <Option value={Priority.LOW}>{t('priority.low')}</Option>
                      </Select>
                    )}
                  />
                </Form.Item>

                <Form.Item label={t('order_form.deadline')} required>
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
                <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                  {tWithParams('order_form.operations_count', { count: fields.length })}
                </div>
              </Form.Item>
            </Form>
              )
            },
            {
              key: '2',
              label: (
                <Space>
                  <FilePdfOutlined />
                  <span>PDF Документация</span>
                  {currentPdfPath && (
                    <span style={{ 
                      backgroundColor: '#52c41a', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: '8px', 
                      height: '8px', 
                      display: 'inline-block' 
                    }} />
                  )}
                </Space>
              ),
              children: (
            <div style={{ padding: '16px 0' }}>
              <Alert
                message="Диагностика PDF"
                description={
                  <div style={{ fontSize: '12px' }}>
                    <div>🔍 Current PDF path: {currentPdfPath || 'не установлен'}</div>
                    <div>📁 PDF file selected: {pdfFile?.name || 'не выбран'}</div>
                    <div>🆔 Order ID: {orderId || 'новый заказ'}</div>
                    <div>📄 URL: {currentPdfPath ? getCurrentPdfUrl() : 'не доступен'}</div>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* Кнопки управления PDF */}
              <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handlePdfChange(file);
                      }
                    };
                    input.click();
                  }}
                  disabled={loading}
                >
                  {currentPdfPath ? 'Заменить PDF' : 'Загрузить PDF'}
                </Button>

                {currentPdfPath && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handlePdfRemove}
                    disabled={loading}
                  >
                    Удалить PDF
                  </Button>
                )}

                {currentPdfPath && (
                  <Button
                    icon={<ExpandOutlined />}
                    onClick={() => window.open(getCurrentPdfUrl(), '_blank')}
                  >
                    Открыть в браузере
                  </Button>
                )}
              </Space>

              {/* Встроенный просмотрщик PDF */}
              {currentPdfPath ? (
                <InlinePdfViewer
                  pdfUrl={getCurrentPdfUrl()}
                  fileName={currentPdfPath.split('/').pop() || 'document.pdf'}
                  height={500}
                  showControls={true}
                />
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '8px',
                  border: '1px dashed #d9d9d9'
                }}>
                  <FilePdfOutlined style={{ fontSize: '64px', color: '#bfbfbf', marginBottom: '16px' }} />
                  <div style={{ color: '#8c8c8c', fontSize: '16px', marginBottom: '8px' }}>
                    PDF документация
                  </div>
                  <div style={{ color: '#bfbfbf', fontSize: '14px', marginBottom: '16px' }}>
                    {!isEdit || !orderId 
                      ? 'Сначала сохраните заказ, затем сможете загрузить PDF файлы'
                      : 'Нажмите "Загрузить PDF" чтобы добавить документацию'
                    }
                  </div>
                  {isEdit && orderId && (
                    <Button
                      type="primary"
                      size="large"
                      icon={<UploadOutlined />}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handlePdfChange(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      Загрузить PDF
                    </Button>
                  )}
                </div>
              )}
            </div>
              )
            }
          ]}
        />
      </Spin>
    </Modal>
  );
};
