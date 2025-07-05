/**
 * @file: ExcelImportModal.tsx (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @description: Исправленное модальное окно для импорта Excel с правильной кнопкой завершения
 * @dependencies: antd, ordersApi
 * @created: 2025-07-04
 * @fixed: Добавлена кнопка "Завершить загрузку" и улучшена обратная связь
 */
import React, { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Upload,
  Table,
  message,
  Steps,
  Alert,
  Space,
  Typography,
  Progress,
  Card,
  Tag,
  Divider,
  Tooltip,
  Statistic,
  Row,
  Col,
  Checkbox,
  Switch,
  Badge,
  Result,
} from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
  FlagOutlined,
  CalendarOutlined,
  SettingOutlined,
  DashboardOutlined,
  CloudUploadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { ordersApi } from '../../../services/ordersApi';
import api from '../../../services/api';
import { PriorityV2, OperationTypeV2, WorkTypeV2, CreateOrderV2Dto, getWorkTypeFromExcel, getOperationTypeFromWorkType, getPriorityV2FromString } from '../../../types/order-v2.types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;

interface ExcelImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: string;
  workType: string;
  calculatedPriority: string;
  priorityReason: string;
  daysLeft: number;
  rowIndex: number;
  selected: boolean;
  status: 'green' | 'yellow' | 'red' | 'default';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [excludeGreen, setExcludeGreen] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [fileUploaded, setFileUploaded] = useState(false); // НОВОЕ: флаг загрузки файла
  const [importStats, setImportStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    overdue: 0,
    selected: 0,
  });
  const fileInputRef = useRef<any>(null);

  const handleReset = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setParsedOrders([]);
    setUploadProgress(0);
    setSelectedRowKeys([]);
    setExcludeGreen(true);
    setFileUploaded(false); // НОВОЕ: сброс флага
    setImportStats({ total: 0, high: 0, medium: 0, low: 0, overdue: 0, selected: 0 });
  };

  // Определяем статус цвета на основе приоритета и дедлайна
  const getOrderStatus = (priority: string, daysLeft: number): 'green' | 'yellow' | 'red' | 'default' => {
    if (daysLeft < 0) return 'red';
    if (priority === 'HIGH' || daysLeft <= 3) return 'red';
    if (priority === 'MEDIUM' || daysLeft <= 7) return 'yellow';
    if (daysLeft > 14) return 'green';
    return 'default';
  };

  // Обновляем статистику на основе выбора
  const updateStats = (orders: ParsedOrder[], selectedKeys: number[]) => {
    const selectedOrders = orders.filter(order => selectedKeys.includes(order.rowIndex));
    
    const stats = {
      total: orders.length,
      high: orders.filter(o => o.calculatedPriority === 'HIGH').length,
      medium: orders.filter(o => o.calculatedPriority === 'MEDIUM').length,
      low: orders.filter(o => o.calculatedPriority === 'LOW').length,
      overdue: orders.filter(o => o.daysLeft < 0).length,
      selected: selectedOrders.length,
    };
    
    setImportStats(stats);
  };

  const calculatePriority = (deadline: string, quantity: number = 1) => {
    const deadlineDate = dayjs(deadline);
    const now = dayjs();
    const daysLeft = deadlineDate.diff(now, 'day');
    
    let priority = 'MEDIUM';
    let reason = '';
    
    const isLargeQuantity = quantity > 50;
    
    if (daysLeft < 0) {
      priority = 'HIGH';
      reason = `Просрочено на ${Math.abs(daysLeft)} дней`;
    } else if (daysLeft <= 3) {
      priority = 'HIGH';
      reason = `Критический дедлайн: ${daysLeft} дней`;
    } else if (daysLeft <= 7 && isLargeQuantity) {
      priority = 'HIGH';
      reason = `Срочный дедлайн + большое количество`;
    } else if (daysLeft <= 7) {
      priority = 'MEDIUM';
      reason = `Средний дедлайн: ${daysLeft} дней`;
    } else if (daysLeft <= 14 && isLargeQuantity) {
      priority = 'MEDIUM';
      reason = `Большое количество: ${quantity} шт.`;
    } else if (daysLeft <= 14) {
      priority = 'LOW';
      reason = `Стандартный дедлайн: ${daysLeft} дней`;
    } else {
      priority = 'LOW';
      reason = `Долгосрочный заказ: ${daysLeft} дней`;
    }
    
    return { priority, reason, daysLeft };
  };

  // НОВАЯ ФУНКЦИЯ: Обработка файла сразу после загрузки
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setFileUploaded(true);
    message.success(`Файл "${file.name}" загружен. Нажмите "Обработать файл" для продолжения.`);
    return false; // Предотвращаем автоматическую загрузку
  };

  // НОВАЯ ФУНКЦИЯ: Начать обработку файла
  const startProcessing = () => {
    if (!uploadedFile) {
      message.error('Сначала выберите файл');
      return;
    }
    parseExcelFile(uploadedFile);
  };

  const parseExcelFile = async (file: File) => {
    try {
      setLoading(true);
      setCurrentStep(1);
      
      console.log('📁 Начинаем парсинг Excel файла:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Отправляем запрос на: /v2/orders/parse-excel');
      
      const response = await api.post('/v2/orders/parse-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      const result = response.data;
      console.log('📊 Данные из Excel:', result);
      
      // НОВОЕ: Проверяем структуру ответа
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.error('❌ Неверная структура ответа от API:', result);
        throw new Error('API вернул некорректные данные. Проверьте формат Excel файла.');
      }
      
      console.log('📋 Количество строк для обработки:', result.data.length);
      
      // Обрабатываем данные и рассчитываем приоритеты
      const orders: ParsedOrder[] = result.data.map((row: any, index: number) => {
        console.log(`📋 Обработка строки ${index + 1}:`, row);
        
        const order = {
          drawingNumber: row.drawingNumber || row['Чертёж'] || row['Drawing Number'] || `DWG-${index + 1}`,
          quantity: parseInt(row.quantity || row['Количество'] || row['Quantity'] || '1') || 1,
          deadline: row.deadline || row['Срок'] || row['Deadline'] || dayjs().add(30, 'days').format('YYYY-MM-DD'),
          priority: row.priority || row['Приоритет'] || row['Priority'] || 'MEDIUM',
          workType: 'Обработка', // По умолчанию, так как в Excel нет этой колонки
          calculatedPriority: '',
          priorityReason: '',
          daysLeft: 0,
          rowIndex: index + 1,
          selected: true,
          status: 'default' as any,
        };
        
        console.log(`📝 Парсинг строки ${index + 1}: Чертёж=${order.drawingNumber}, Кол-во=${order.quantity}, Срок=${order.deadline}`);
        
        // Рассчитываем приоритет (убрали workType, так как его нет в Excel)
        const calc = calculatePriority(order.deadline, order.quantity);
        order.calculatedPriority = calc.priority;
        order.priorityReason = calc.reason;
        order.daysLeft = calc.daysLeft;
        order.status = getOrderStatus(order.calculatedPriority, order.daysLeft);
        
        // Фильтруем зеленые по умолчанию
        if (excludeGreen && order.status === 'green') {
          order.selected = false;
        }
        
        return order;
      });
      
      console.log('✅ Обработано заказов:', orders.length);
      console.log('🔍 Первые 3 заказа:', orders.slice(0, 3));
      
      // Выбираем все не-зеленые по умолчанию
      const initialSelectedKeys = orders
        .filter(order => order.selected)
        .map(order => order.rowIndex);
      
      setSelectedRowKeys(initialSelectedKeys);
      
      // Сортируем по приоритету и дедлайну
      orders.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aPriority = priorityOrder[a.calculatedPriority as keyof typeof priorityOrder];
        const bPriority = priorityOrder[b.calculatedPriority as keyof typeof priorityOrder];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.daysLeft - b.daysLeft;
      });
      
      setParsedOrders(orders);
      updateStats(orders, initialSelectedKeys);
      setCurrentStep(2);
      
      message.success(`Обработано ${orders.length} заказов с автоматическим распределением приоритетов`);
      
    } catch (error: any) {
      console.error('❌ Ошибка парсинга Excel:', error);
      
      let errorMessage = 'Ошибка при обработке файла';
      
      if (error.response) {
        errorMessage = `Ошибка сервера: ${error.response.status}`;
        if (error.response.data?.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage = 'Ошибка соединения с сервером';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      message.error(errorMessage);
      setCurrentStep(0);
      setFileUploaded(false);
    } finally {
      setLoading(false);
    }
  };

  const uploadToDatabase = async () => {
    if (selectedRowKeys.length === 0) {
      message.error('Нет выбранных данных для загрузки');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(3);
      
      const selectedOrders = parsedOrders.filter(order => selectedRowKeys.includes(order.rowIndex));
      
      console.log('🔍 Отладка данных перед отправкой:', {
        selectedCount: selectedOrders.length,
        firstOrder: selectedOrders[0],
        exampleData: selectedOrders.slice(0, 2)
      });
      
      const ordersToCreate = selectedOrders.map(order => {
        console.log(`📋 Подготовка заказа ${order.drawingNumber} БЕЗ операций (для технолога)`);
        
        return {
          drawingNumber: order.drawingNumber,
          quantity: order.quantity,
          deadline: order.deadline,
          priority: getPriorityV2FromString(order.calculatedPriority),
          // НЕ УКАЗЫВАЕМ workType и operations - технолог заполнит вручную
        };
      });
      
      let created = 0;
      let errors = 0;
      let duplicates = 0;
      const errorDetails = [];
      
      for (let i = 0; i < ordersToCreate.length; i++) {
        try {
          // 🔍 Проверяем на дубликаты по номеру чертежа
          const existingOrder = await ordersApi.checkDuplicate(ordersToCreate[i].drawingNumber);
          
          if (existingOrder) {
            console.log(`⚠️ Дубликат найден: ${ordersToCreate[i].drawingNumber}`);
            duplicates++;
            errorDetails.push({
              drawingNumber: ordersToCreate[i].drawingNumber,
              error: 'Заказ с таким номером чертежа уже существует'
            });
            continue; // Пропускаем дубликат
          }
          
          await ordersApi.createV2(ordersToCreate[i]);
          created++;
        } catch (error: any) {
          errors++;
          console.error(`Ошибка создания заказа ${ordersToCreate[i].drawingNumber}:`, error);
          errorDetails.push({
            drawingNumber: ordersToCreate[i].drawingNumber,
            error: error.response?.data?.message || error.message || 'Неизвестная ошибка'
          });
        }
        
        const progress = Math.round((i + 1) / ordersToCreate.length * 100);
        setUploadProgress(progress);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (created > 0 || duplicates > 0) {
        const result = {
          created,
          updated: 0,
          errors,
          duplicates,
          errorDetails,
          prioritized: true,
          stats: importStats,
        };
        
        setCurrentStep(4);
        
        // Показываем детальное сообщение
        let messageText = `Создано: ${created} заказов`;
        if (duplicates > 0) {
          messageText += `, Пропущено дубликатов: ${duplicates}`;
        }
        if (errors > 0) {
          messageText += `, Ошибок: ${errors}`;
        }
        
        if (duplicates > 0 || errors > 0) {
          message.warning(messageText);
        } else {
          message.success(messageText);
        }
        
        setTimeout(() => {
          onSuccess(result);
          handleClose();
        }, 2000);
      } else {
        message.error('Не удалось создать ни одного заказа. Проверьте данные.');
        setCurrentStep(2);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки в БД:', error);
      message.error('Ошибка при загрузке данных в базу');
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const columns = [
    {
      title: 'Позиция',
      key: 'position',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: index < 3 ? '#ff4d4f' : index < 10 ? '#faad14' : '#52c41a',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {index + 1}
        </div>
      ),
    },
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      width: 150,
      render: (text: string) => (
        <Text strong style={{ color: '#1890ff' }}>{text}</Text>
      ),
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number) => (
        <Text strong>{quantity}</Text>
      ),
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string, record: ParsedOrder) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('DD.MM.YYYY')}</Text>
          <Tag color={record.daysLeft < 0 ? 'red' : record.daysLeft <= 7 ? 'orange' : 'green'}>
            {record.daysLeft < 0 ? `Просрочено на ${Math.abs(record.daysLeft)} дн.` : `${record.daysLeft} дн.`}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'calculatedPriority',
      key: 'calculatedPriority',
      width: 120,
      render: (priority: string, record: ParsedOrder) => (
        <Space direction="vertical" size={0}>
          <Tag color={priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'orange' : 'green'}>
            {priority === 'HIGH' ? '🔥 Высокий' : priority === 'MEDIUM' ? '⚡ Средний' : '📋 Низкий'}
          </Tag>
          <Tooltip title={record.priorityReason}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.priorityReason.substring(0, 20)}...
            </Text>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Card>
              <Alert
                message="Инструкция по импорту Excel"
                description={
                  <div>
                    <Paragraph>
                      📊 Загрузите Excel файл с колонками:
                    </Paragraph>
                    <ul style={{ textAlign: 'left', marginLeft: '40px' }}>
                      <li><strong>Колонка C:</strong> Номер чертежа</li>
                      <li><strong>Колонка E:</strong> Количество</li>
                      <li><strong>Колонка I:</strong> Дедлайн (дата)</li>
                      <li><strong>Колонка K:</strong> Приоритет (необязательно)</li>
                    </ul>
                    <Alert
                      message="Важно!"
                      description="Тип работы и операции будут заполнены технологом вручную после загрузки."
                      type="warning"
                      showIcon
                      style={{ marginTop: 16, marginBottom: 16 }}
                    />
                    <Paragraph>
                      Система автоматически распределит приоритеты по дедлайнам.
                    </Paragraph>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              
              {/* Показываем информацию о загруженном файле */}
              {fileUploaded && uploadedFile && (
                <Alert
                  message="Файл загружен успешно!"
                  description={
                    <div>
                      <Text strong>{uploadedFile.name}</Text>
                      <br />
                      <Text type="secondary">
                        Размер: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </div>
                  }
                  type="success"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}
              
              <Dragger
                accept=".xlsx,.xls"
                beforeUpload={handleFileSelect}
                showUploadList={false}
                style={{ marginBottom: 16 }}
                disabled={loading}
              >
                <p className="ant-upload-drag-icon">
                  <FileExcelOutlined style={{ fontSize: 48, color: fileUploaded ? '#52c41a' : '#1890ff' }} />
                </p>
                <p className="ant-upload-text">
                  {fileUploaded ? 'Файл загружен' : 'Нажмите или перетащите Excel файл сюда'}
                </p>
                <p className="ant-upload-hint">
                  Поддерживаются форматы .xlsx и .xls
                </p>
              </Dragger>
              
              <Space>
                <Button
                  type="default"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Выбрать файл
                </Button>
                
                {/* НОВАЯ КНОПКА: Обработать файл */}
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={startProcessing}
                  loading={loading}
                  disabled={!fileUploaded}
                  size="large"
                >
                  Обработать файл
                </Button>
              </Space>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file);
                  }
                }}
              />
            </Card>
          </div>
        );

      case 1:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>Обработка Excel файла...</Title>
            <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Paragraph>
              Файл: {uploadedFile?.name}
            </Paragraph>
            <Progress type="circle" percent={50} status="active" />
            <Paragraph type="secondary">
              Парсинг данных и расчет приоритетов...
            </Paragraph>
          </div>
        );

      case 2:
        return (
          <div>
            <Card title="Статистика импорта" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={4}>
                  <Statistic
                    title="Всего заказов"
                    value={importStats.total}
                    prefix={<DashboardOutlined />}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="Высокий приоритет"
                    value={importStats.high}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<FlagOutlined />}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="Средний приоритет"
                    value={importStats.medium}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<SettingOutlined />}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="Низкий приоритет"
                    value={importStats.low}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="Просрочено"
                    value={importStats.overdue}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="Выбрано"
                    value={importStats.selected}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<DashboardOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            <Alert
              message="Предварительный просмотр"
              description={`Проверьте данные перед загрузкой в базу данных. Выбрано ${selectedRowKeys.length} из ${parsedOrders.length} заказов.`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              columns={columns}
              dataSource={parsedOrders}
              rowKey="rowIndex"
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ y: 400 }}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => {
                  setSelectedRowKeys(keys as number[]);
                  updateStats(parsedOrders, keys as number[]);
                },
              }}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button onClick={() => {
                  setCurrentStep(0);
                  setFileUploaded(false);
                }}>
                  Назад
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={uploadToDatabase}
                  loading={loading}
                  size="large"
                  disabled={selectedRowKeys.length === 0}
                >
                  Завершить загрузку ({selectedRowKeys.length} заказов)
                </Button>
              </Space>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>Загрузка в базу данных...</Title>
            <Progress 
              percent={uploadProgress} 
              status="active" 
              strokeColor="#1890ff"
              style={{ marginBottom: 16 }}
            />
            <Paragraph type="secondary">
              Сохранение {selectedRowKeys.length} выбранных заказов...
            </Paragraph>
          </div>
        );

      case 4:
        return (
          <Result
            status="success"
            title="Импорт завершен успешно!"
            subTitle={`Заказы загружены в базу данных с автоматическим распределением приоритетов.`}
            extra={[
              <Card key="stats" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Высокий приоритет"
                      value={importStats.high}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Средний приоритет"
                      value={importStats.medium}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Низкий приоритет"
                      value={importStats.low}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                </Row>
              </Card>
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>
        {`
          .row-green {
            background-color: #f6ffed !important;
          }
          .row-green:hover {
            background-color: #d9f7be !important;
          }
          .row-yellow {
            background-color: #fffbe6 !important;
          }
          .row-yellow:hover {
            background-color: #fff1b8 !important;
          }
          .row-red {
            background-color: #fff2f0 !important;
          }
          .row-red:hover {
            background-color: #ffccc7 !important;
          }
        `}
      </style>
      <Modal
        title={
          <Space>
            <FileExcelOutlined />
            Импорт Excel с автоматическим распределением приоритетов
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        width={1000}
        footer={null}
        destroyOnClose
      >
        <div style={{ padding: '20px 0' }}>
          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            <Step title="Загрузка файла" description="Выбор Excel файла" />
            <Step title="Обработка" description="Парсинг данных" />
            <Step title="Просмотр" description="Проверка данных" />
            <Step title="Загрузка" description="Сохранение в БД" />
            <Step title="Готово" description="Импорт завершен" />
          </Steps>

          {renderStepContent()}
        </div>
      </Modal>
    </>
  );
};
