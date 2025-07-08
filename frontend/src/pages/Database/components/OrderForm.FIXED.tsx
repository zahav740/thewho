/**
 * @file: OrderForm.FIXED.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С НОВОЙ СИСТЕМОЙ PDF
 * @description: Полностью исправленная форма с новой системой PDF и организацией по папкам
 * @updated: 2025-07-07 - Интегрирована новая система PDF с обработкой дубликатов
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
  Alert,
  Typography,
  Card,
  Upload,
  Popconfirm,
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  FilePdfOutlined, 
  UploadOutlined, 
  ExpandOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import dayjs from 'dayjs';
import { ordersApi } from '../../../services/ordersApi';
import { pdfApi, PdfDuplicateCheck, PdfUploadResult } from '../../../services/pdfApi';
import { CreateOrderDto, Priority } from '../../../types/order.types';
import { OperationType } from '../../../types/operation.types';
import { useTranslation } from '../../../i18n';
import { InlinePdfViewer } from '../../../components/common/InlinePdfViewer.FIXED';

const { Option } = Select;
const { Text, Title } = Typography;

interface OrderFormProps {
  visible: boolean;
  orderId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrderFormFixed: React.FC<OrderFormProps> = ({
  visible,
  orderId,
  onClose,
  onSuccess,
}) => {
  const { t, tWithParams } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [currentPdfPath, setCurrentPdfPath] = useState<string | undefined>();
  const [currentDrawingNumber, setCurrentDrawingNumber] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [duplicateConflict, setDuplicateConflict] = useState<PdfDuplicateCheck | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const isEdit = !!orderId;
  const queryClient = useQueryClient();

  console.log('🔧 OrderForm (FIXED PDF) rendered:', { visible, orderId, isEdit });

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateOrderDto>({
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

  // Следим за изменением номера чертежа
  const watchedDrawingNumber = watch('drawingNumber');
  
  useEffect(() => {
    setCurrentDrawingNumber(watchedDrawingNumber || '');
  }, [watchedDrawingNumber]);

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
      setCurrentDrawingNumber(orderData.drawingNumber || '');
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
      setCurrentDrawingNumber('');
      setPdfFile(null);
      setDuplicateConflict(null);
      setShowDuplicateModal(false);
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
        await handlePdfUpload(newOrder.id, pdfFile);
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
        await handlePdfUpload(orderId, pdfFile);
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

  // PDF Upload Handler (полностью переписан)
  const handlePdfUpload = async (targetOrderId: number, file: File, action?: string) => {
    setPdfUploading(true);
    
    try {
      console.log('📁 Uploading PDF:', { targetOrderId, fileName: file.name, action });
      
      const result = await pdfApi.uploadPdf(targetOrderId, currentDrawingNumber, file, action ? { [action]: true } : {});
      
      // Успешная загрузка
      if (result.success) {
        console.log('✅ PDF uploaded successfully:', result);
        message.success(result.message || 'PDF файл успешно загружен');
        
        // Обновляем состояние
        setCurrentPdfPath(result.filename);
        setPdfFile(null);
        
        // Обновляем кэш
        queryClient.invalidateQueries({ queryKey: ['order', targetOrderId] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } else {
        throw new Error(result.message || 'Ошибка загрузки PDF');
      }
      
    } catch (error: any) {
      console.error('❌ PDF upload error:', error);
      message.error(error.message || 'Ошибка при загрузке PDF файла');
    } finally {
      setPdfUploading(false);
    }
  };

  // Обработчик выбора PDF файла
  const handlePdfFileSelect = (file: File) => {
    console.log('📄 PDF file selected:', file.name);
    setPdfFile(file);
    
    // Если это редактирование существующего заказа, можно сразу загрузить
    if (isEdit && orderId) {
      handlePdfUpload(orderId, file);
    }
  };

  // Обработчик разрешения конфликта дубликатов
  const handleDuplicateAction = async (action: string) => {
    if (!duplicateConflict || !pdfFile || !orderId) return;
    
    console.log('🔄 Resolving duplicate conflict:', action);
    setShowDuplicateModal(false);
    
    try {
      await handlePdfUpload(orderId, pdfFile, action);
    } catch (error) {
      console.error('❌ Error resolving duplicate:', error);
    } finally {
      setDuplicateConflict(null);
    }
  };

  // PDF Remove Handler (исправленный)
  const handlePdfRemove = async () => {
    if (!orderId) {
      setPdfFile(null);
      setCurrentPdfPath(undefined);
      return;
    }

    try {
      console.log('🗑️ Removing PDF for order:', orderId);
      await pdfApi.deletePdf(orderId);
      
      setCurrentPdfPath(undefined);
      setPdfFile(null);
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      message.success('PDF файл удален');
    } catch (error: any) {
      console.error('❌ PDF remove error:', error);
      message.error('Ошибка при удалении PDF файла');
    }
  };

  // Функция для получения URL PDF
  const getCurrentPdfUrl = () => {
    if (!currentPdfPath) return '';
    
    // Новый формат: drawingNumber/filename
    if (currentDrawingNumber && currentPdfPath) {
      return pdfApi.getPdfUrl(currentDrawingNumber, currentPdfPath);
    }
    
    // Fallback - просто возвращаем путь
    return `/api/orders/pdf/${currentPdfPath}`;
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
    <>
      <Modal
        title={isEdit ? t('order_form.edit_order') : t('order_form.new_order')}
        open={visible}
        onCancel={onClose}
        width={1000}
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
                    {/* Диагностическая информация */}
                    <Alert
                      message="Диагностика PDF (FIXED)"
                      description={
                        <div style={{ fontSize: '12px' }}>
                          <div>🔍 Номер чертежа: {currentDrawingNumber || 'не указан'}</div>
                          <div>📁 PDF path: {currentPdfPath || 'не установлен'}</div>
                          <div>📄 Выбранный файл: {pdfFile?.name || 'не выбран'}</div>
                          <div>🆔 Order ID: {orderId || 'новый заказ'}</div>
                          <div>📄 URL: {currentPdfPath ? getCurrentPdfUrl() : 'не доступен'}</div>
                          <div>🔄 Загрузка: {pdfUploading ? 'выполняется' : 'не активна'}</div>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    {/* Upload Component */}
                    <Card 
                      title="Загрузка PDF файла"
                      size="small"
                      style={{ marginBottom: 16 }}
                      extra={
                        <Space>
                          {currentPdfPath && (
                            <Button
                              icon={<ExpandOutlined />}
                              onClick={() => window.open(getCurrentPdfUrl(), '_blank')}
                              size="small"
                            >
                              Открыть
                            </Button>
                          )}
                          {currentPdfPath && (
                            <Popconfirm
                              title="Удалить PDF файл?"
                              description="Это действие нельзя отменить"
                              onConfirm={handlePdfRemove}
                              okText="Удалить"
                              cancelText="Отмена"
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                              >
                                Удалить
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
                      }
                    >
                      <Upload.Dragger
                        accept=".pdf"
                        multiple={false}
                        showUploadList={false}
                        beforeUpload={(file) => {
                          if (file.type !== 'application/pdf') {
                            message.error('Можно загружать только PDF файлы');
                            return false;
                          }
                          if (file.size > 100 * 1024 * 1024) {
                            message.error('Размер файла не должен превышать 100MB');
                            return false;
                          }
                          handlePdfFileSelect(file);
                          return false;
                        }}
                        disabled={pdfUploading}
                        style={{ backgroundColor: currentPdfPath ? '#f6ffed' : '#fafafa' }}
                      >
                        <p className="ant-upload-drag-icon">
                          {pdfUploading ? (
                            <Spin size="large" />
                          ) : currentPdfPath ? (
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '48px' }} />
                          ) : (
                            <FilePdfOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                          )}
                        </p>
                        <p className="ant-upload-text">
                          {pdfUploading ? (
                            <Text>Загрузка PDF файла...</Text>
                          ) : currentPdfPath ? (
                            <Text strong style={{ color: '#52c41a' }}>
                              PDF файл загружен
                            </Text>
                          ) : (
                            <Text>
                              Нажмите или перетащите PDF файл для загрузки
                            </Text>
                          )}
                        </p>
                        <p className="ant-upload-hint">
                          {currentPdfPath ? (
                            `Текущий файл: ${currentPdfPath.split('/').pop()}`
                          ) : (
                            'Поддерживаются только PDF файлы до 100MB'
                          )}
                        </p>
                      </Upload.Dragger>
                    </Card>

                    {/* PDF Viewer */}
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
                        <Title level={4} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
                          Нет PDF документации
                        </Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                          Загрузите PDF файл для просмотра документации заказа
                        </Text>
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </Spin>
      </Modal>

      {/* Модальное окно для разрешения конфликтов дубликатов */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Обнаружен дубликат PDF файла</span>
          </Space>
        }
        open={showDuplicateModal}
        onCancel={() => {
          setShowDuplicateModal(false);
          setDuplicateConflict(null);
        }}
        footer={null}
        width={600}
      >
        {duplicateConflict && (
          <div>
            <Alert
              message="Найден дубликат"
              description={`Обнаружен ${duplicateConflict.duplicateType} дубликат. Найдено ${duplicateConflict.existingFiles.length} файлов.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Информация о дубликатах */}
            {duplicateConflict.existingFiles.length > 0 && (
              <Card size="small" title="Найденные дубликаты" style={{ marginBottom: 16 }}>
                {duplicateConflict.existingFiles.map((file, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Text>
                      Заказ: {file.orderId} | 
                      Чертеж: {file.drawingNumber} | 
                      Файл: {file.filename}
                    </Text>
                  </div>
                ))}
              </Card>
            )}

            <div style={{ marginTop: 16 }}>
              <Text strong>Выберите действие:</Text>
              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  block
                  style={{ marginBottom: 8 }}
                  onClick={() => handleDuplicateAction('useExisting')}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div><strong>Использовать существующий</strong></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Ссылка на уже загруженный файл
                    </div>
                  </div>
                </Button>
                <Button
                  block
                  style={{ marginBottom: 8 }}
                  onClick={() => handleDuplicateAction('replaceDuplicate')}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div><strong>Заменить файл</strong></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Удалить старый и загрузить новый
                    </div>
                  </div>
                </Button>
                <Button
                  block
                  style={{ marginBottom: 8 }}
                  onClick={() => handleDuplicateAction('createRevision')}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div><strong>Создать ревизию</strong></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Сохранить как версию v2, v3...
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
