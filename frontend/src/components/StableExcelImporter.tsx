/**
 * @file: StableExcelImporter.tsx
 * @description: ИСПРАВЛЕННЫЙ стабильный компонент для импорта Excel файлов
 * @dependencies: antd, SheetJS (глобально подключен)
 * @created: 2025-06-09
 * @updated: 2025-06-09 // ИСПРАВЛЕНО: TypeScript ошибки
 */
import React, { useState, useRef } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Progress,
  Alert,
  Typography,
  Space,
  Card,
  Divider,
  Tag,
  notification,
  Spin
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';
// ✅ ИСПРАВЛЕНО: Правильный путь к ordersApi
import { ordersApi } from '../services/ordersApi';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

interface StableExcelImporterProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ✅ ИСПРАВЛЕНО: Добавлено поле operations для совместимости с CreateOrderDto
interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: number;
  workType: string;
  operations?: any[]; // Добавляем для совместимости с API
}

interface ConnectionStatus {
  online: boolean;
  checking: boolean;
}

export const StableExcelImporter: React.FC<StableExcelImporterProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    online: false,
    checking: true
  });
  const [csvData, setCsvData] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'uploading' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ ИСПРАВЛЕНО: Убрана опция timeout из fetch
  const checkApiConnection = async (): Promise<boolean> => {
    setConnectionStatus({ online: false, checking: true });
    
    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isOnline = response.ok;
      setConnectionStatus({ online: isOnline, checking: false });
      return isOnline;
    } catch (error) {
      setConnectionStatus({ online: false, checking: false });
      return false;
    }
  };

  // Инициализация при открытии модала
  React.useEffect(() => {
    if (visible) {
      checkApiConnection();
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setParsedOrders([]);
    setUploadProgress(0);
    setCsvData('');
    setCurrentStep('upload');
    setLoading(false);
  };

  // Парсинг даты
  const parseDate = (dateStr: string): string => {
    if (!dateStr) {
      // Дата по умолчанию - через месяц
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split('T')[0];
    }

    try {
      // Пробуем разные форматы
      const normalizedDate = dateStr.replace(/\./g, '-').replace(/\//g, '-');
      const date = new Date(normalizedDate);
      
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('Не удалось распарсить дату:', dateStr);
    }

    // Если не удалось, возвращаем дату через месяц
    const fallbackDate = new Date();
    fallbackDate.setMonth(fallbackDate.getMonth() + 1);
    return fallbackDate.toISOString().split('T')[0];
  };

  // Обработка Excel файла через SheetJS
  const handleExcelFile = (file: File) => {
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Используем глобальную библиотеку XLSX
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = (window as any).XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Конвертируем в CSV с табуляцией
        const csvText = (window as any).XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
        
        console.log('✅ Excel файл успешно прочитан через SheetJS');
        console.log('📊 CSV данные:', csvText.substring(0, 200) + '...');
        
        setCsvData(csvText);
        processCSVData(csvText);
        
        notification.success({
          message: 'Файл загружен',
          description: `Excel файл "${file.name}" успешно обработан`
        });
        
      } catch (error) {
        console.error('❌ Ошибка при чтении Excel:', error);
        notification.error({
          message: 'Ошибка чтения файла',
          description: 'Не удалось прочитать Excel файл. Проверьте формат.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Обработка CSV данных
  const processCSVData = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Файл должен содержать минимум 2 строки: заголовки и данные');
      }

      // Определяем разделитель
      const separator = lines[0].includes('\t') ? '\t' : ';';
      console.log('📋 Используем разделитель:', separator === '\t' ? 'TAB' : 'SEMICOLON');

      const orders: ParsedOrder[] = [];
      const errors: string[] = [];

      // Парсим строки данных (пропускаем заголовок)
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(separator).map(v => v.trim());
          
          if (values.length >= 2 && values[0] && values[1]) {
            const order: ParsedOrder = {
              drawingNumber: values[0],
              quantity: parseInt(values[1]) || 1,
              deadline: parseDate(values[2]),
              priority: Math.max(1, Math.min(3, parseInt(values[3]) || 2)),
              workType: values[4] || 'Обработка',
              operations: [] // ✅ ИСПРАВЛЕНО: Добавляем пустой массив операций
            };
            
            orders.push(order);
            console.log(`✅ Строка ${i + 1}: ${order.drawingNumber} (${order.quantity} шт.)`);
          } else {
            errors.push(`Строка ${i + 1}: недостаточно данных`);
          }
        } catch (error) {
          errors.push(`Строка ${i + 1}: ${error}`);
        }
      }

      if (orders.length === 0) {
        throw new Error('Не удалось извлечь данные. Проверьте формат файла.');
      }

      setParsedOrders(orders);
      setCurrentStep('preview');

      if (errors.length > 0) {
        notification.warning({
          message: 'Частичная обработка',
          description: `Обработано ${orders.length} заказов, пропущено ${errors.length} строк с ошибками`
        });
      } else {
        notification.success({
          message: 'Данные обработаны',
          description: `Успешно обработано ${orders.length} заказов`
        });
      }

    } catch (error) {
      notification.error({
        message: 'Ошибка обработки',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  };

  // Обработка вставки CSV данных
  const handleCSVPaste = () => {
    if (!csvData.trim()) {
      notification.warning({
        message: 'Нет данных',
        description: 'Вставьте данные из Excel в текстовое поле'
      });
      return;
    }

    processCSVData(csvData);
  };

  // Очистка базы данных
  const clearDatabase = async () => {
    try {
      setLoading(true);
      
      const result = await ordersApi.deleteAll();
      
      notification.success({
        message: 'База очищена',
        description: `Удалено ${result.deleted} заказов`
      });
      
    } catch (error) {
      notification.error({
        message: 'Ошибка очистки',
        description: 'Не удалось очистить базу данных'
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка в базу данных
  const uploadToDatabase = async () => {
    if (parsedOrders.length === 0) {
      notification.warning({
        message: 'Нет данных',
        description: 'Сначала обработайте Excel файл'
      });
      return;
    }

    try {
      setCurrentStep('uploading');
      setUploadProgress(0);
      
      let created = 0;
      let errors = 0;
      const total = parsedOrders.length;

      // Загружаем по одному заказу для стабильности
      for (let i = 0; i < parsedOrders.length; i++) {
        try {
          // ✅ ИСПРАВЛЕНО: Приводим к правильному типу для API
          await ordersApi.create(parsedOrders[i] as any);
          created++;
          console.log(`✅ Создан заказ: ${parsedOrders[i].drawingNumber}`);
        } catch (error) {
          errors++;
          console.error(`❌ Ошибка создания заказа ${parsedOrders[i].drawingNumber}:`, error);
        }

        // Обновляем прогресс
        const progress = Math.round((i + 1) / total * 100);
        setUploadProgress(progress);

        // Небольшая пауза для стабильности
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setCurrentStep('complete');

      const successRate = Math.round(created / total * 100);
      
      if (created > 0) {
        notification.success({
          message: 'Загрузка завершена!',
          description: `Успешно создано ${created} заказов из ${total} (${successRate}%)`
        });
        
        // Вызываем callback для обновления списка
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        notification.error({
          message: 'Загрузка не удалась',
          description: `Не удалось создать ни одного заказа из ${total}`
        });
      }

    } catch (error) {
      notification.error({
        message: 'Критическая ошибка',
        description: 'Произошла ошибка при загрузке данных'
      });
      setCurrentStep('preview');
    }
  };

  // Конфигурация Upload компонента
  const uploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      handleExcelFile(file);
      return false; // Предотвращаем автоматическую загрузку
    },
    showUploadList: false,
    multiple: false
  };

  // Колонки для таблицы превью
  const previewColumns = [
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      width: 150,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Срок',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => {
        const colors = { 1: 'red', 2: 'orange', 3: 'green' };
        const labels = { 1: 'Высокий', 2: 'Средний', 3: 'Низкий' };
        return <Tag color={colors[priority as keyof typeof colors]}>{labels[priority as keyof typeof labels]}</Tag>;
      }
    },
    {
      title: 'Тип работы',
      dataIndex: 'workType',
      key: 'workType',
      ellipsis: true,
    },
  ];

  return (
    <Modal
      title="🎯 Стабильный импорт Excel файлов"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Статус подключения */}
        <Alert
          message={
            connectionStatus.checking ? (
              <><Spin size="small" /> Проверяем подключение к серверу...</>
            ) : connectionStatus.online ? (
              <><CheckCircleOutlined style={{ color: '#52c41a' }} /> Сервер доступен</>
            ) : (
              <><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> Сервер недоступен. Запустите backend.</>
            )
          }
          type={connectionStatus.online ? 'success' : 'warning'}
          style={{ marginBottom: 20 }}
        />

        {/* Шаг 1: Загрузка файла */}
        {currentStep === 'upload' && (
          <Card title="📁 Загрузка Excel файла" style={{ marginBottom: 20 }}>
            <Dragger {...uploadProps} style={{ marginBottom: 20 }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                <strong>Перетащите Excel файл сюда или нажмите для выбора</strong>
              </p>
              <p className="ant-upload-hint">
                Поддерживаются файлы .xlsx и .xls
              </p>
            </Dragger>

            <Divider>ИЛИ</Divider>

            <Card size="small" title="📋 Вставка данных из Excel">
              <Paragraph>
                Скопируйте данные из Excel (Ctrl+C) и вставьте в поле ниже:
              </Paragraph>
              
              <textarea
                style={{
                  width: '100%',
                  height: 150,
                  fontFamily: 'Courier New, monospace',
                  fontSize: 14,
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: 12,
                  resize: 'vertical'
                }}
                placeholder={`Вставьте данные из Excel здесь...

Пример формата:
Номер чертежа	Количество	Срок	Приоритет	Тип работы
DWG-001	10	2025-06-15	1	Фрезерная обработка
DWG-002	5	2025-06-20	2	Токарная обработка`}
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
              />
              
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleCSVPaste}
                style={{ marginTop: 10 }}
                disabled={!csvData.trim()}
              >
                Обработать данные
              </Button>
            </Card>
          </Card>
        )}

        {/* Шаг 2: Превью данных */}
        {currentStep === 'preview' && (
          <Card title={`📋 Предварительный просмотр (${parsedOrders.length} заказов)`}>
            <Table
              columns={previewColumns}
              dataSource={parsedOrders.slice(0, 10)} // Показываем первые 10
              rowKey="drawingNumber"
              pagination={false}
              size="small"
              style={{ marginBottom: 20 }}
            />
            
            {parsedOrders.length > 10 && (
              <Text type="secondary">
                ... и еще {parsedOrders.length - 10} заказов
              </Text>
            )}

            <Divider />

            <Space>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={clearDatabase}
                loading={loading}
              >
                Очистить базу данных
              </Button>
              
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={uploadToDatabase}
                disabled={!connectionStatus.online}
              >
                Загрузить в БД ({parsedOrders.length} заказов)
              </Button>
              
              <Button onClick={() => setCurrentStep('upload')}>
                Назад
              </Button>
            </Space>
          </Card>
        )}

        {/* Шаг 3: Загрузка */}
        {currentStep === 'uploading' && (
          <Card title="🚀 Загрузка данных в базу">
            <Progress percent={uploadProgress} status="active" />
            <Text style={{ display: 'block', textAlign: 'center', marginTop: 10 }}>
              Загружаем заказы... {uploadProgress}%
            </Text>
          </Card>
        )}

        {/* Шаг 4: Завершение */}
        {currentStep === 'complete' && (
          <Card title="🎉 Загрузка завершена!">
            <Alert
              message="Данные успешно загружены"
              description="Ваши заказы добавлены в базу данных. Страница автоматически обновится."
              type="success"
              showIcon
            />
          </Card>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin size="large" />
            <div style={{ marginTop: 10 }}>Обрабатываем файл...</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StableExcelImporter;
