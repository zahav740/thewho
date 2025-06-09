/**
 * @file: CSVImportModal.tsx
 * @description: СТАБИЛЬНЫЙ ИМПОРТ CSV ДАННЫХ (замена проблемной загрузки Excel)
 * @dependencies: antd, order.types
 * @created: 2025-06-09
 */
import React, { useState } from 'react';
import {
  Modal,
  Button,
  Input,
  Table,
  message,
  Steps,
  Alert,
  Space,
  Typography,
  Progress,
  Card,
  Tag
} from 'antd';
import {
  CopyOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  UploadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { ordersApi } from '../../../services/ordersApi';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface CSVImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: number;
  workType: string;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvData, setCsvData] = useState('');
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const exampleData = `Номер чертежа\tКоличество\tСрок\tПриоритет\tТип работы
DWG-2025-001\t25\t2025-06-15\t1\tФрезерная обработка
DWG-2025-002\t10\t2025-06-20\t2\tТокарная обработка
DWG-2025-003\t5\t2025-07-01\t2\tШлифовка
DWG-2025-004\t30\t2025-06-25\t1\tКомплексная обработка`;

  const handleReset = () => {
    setCurrentStep(0);
    setCsvData('');
    setParsedOrders([]);
    setUploadProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const parseCSVData = () => {
    try {
      if (!csvData.trim()) {
        message.error('Введите данные для обработки');
        return;
      }

      const lines = csvData.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        message.error('Нужно минимум 2 строки: заголовки и данные');
        return;
      }

      // Определяем разделитель
      const firstLine = lines[0];
      const separator = firstLine.includes('\t') ? '\t' : ';';
      
      const orders: ParsedOrder[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(separator).map(v => v.trim());
          
          if (values.length >= 2 && values[0] && values[1]) {
            const order: ParsedOrder = {
              drawingNumber: values[0],
              quantity: parseInt(values[1]) || 1,
              deadline: parseDate(values[2]) || getDefaultDeadline(),
              priority: Math.max(1, Math.min(3, parseInt(values[3]) || 2)),
              workType: values[4] || 'Обработка'
            };
            orders.push(order);
          } else {
            errors.push(`Строка ${i + 1}: недостаточно данных`);
          }
        } catch (error) {
          errors.push(`Строка ${i + 1}: ошибка обработки`);
        }
      }

      if (orders.length === 0) {
        message.error('Не удалось извлечь данные. Проверьте формат.');
        return;
      }

      if (errors.length > 0) {
        console.warn('Ошибки при парсинге:', errors);
      }

      setParsedOrders(orders);
      setCurrentStep(1);
      message.success(`Обработано ${orders.length} заказов`);

    } catch (error) {
      message.error('Ошибка обработки данных: ' + (error as Error).message);
    }
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    try {
      // Пробуем разные форматы
      const date = new Date(dateStr.replace(/\./g, '-').replace(/\//g, '-'));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    
    return null;
  };

  const getDefaultDeadline = (): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const clearExistingOrders = async (): Promise<boolean> => {
    try {
      setLoading(true);
      await ordersApi.deleteAll();
      message.success('Старые заказы удалены');
      return true;
    } catch (error) {
      message.error('Ошибка при удалении старых заказов');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadOrders = async () => {
    if (parsedOrders.length === 0) {
      message.error('Нет данных для загрузки');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(2);
      
      let created = 0;
      let errors = 0;

      for (let i = 0; i < parsedOrders.length; i++) {
        try {
          // ✅ ИСПРАВЛЕНО: Добавляем поле operations для совместимости с API
          await ordersApi.create({
            ...parsedOrders[i],
            operations: [] // Пустой массив операций
          });
          created++;
        } catch (error) {
          errors++;
          console.error(`Ошибка создания заказа ${parsedOrders[i].drawingNumber}:`, error);
        }

        // Обновляем прогресс
        const progress = Math.round((i + 1) / parsedOrders.length * 100);
        setUploadProgress(progress);
      }

      const successRate = Math.round((created / parsedOrders.length) * 100);
      
      if (created > 0) {
        message.success(`Загружено ${created} из ${parsedOrders.length} заказов (${successRate}%)`);
        setCurrentStep(3);
        
        // Закрываем модальное окно через 2 секунды и обновляем данные
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        message.error('Не удалось загрузить ни одного заказа');
        setCurrentStep(1);
      }

    } catch (error) {
      message.error('Ошибка при загрузке данных');
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
        const texts = { 1: 'Высокий', 2: 'Средний', 3: 'Низкий' };
        return <Tag color={colors[priority as keyof typeof colors]}>{texts[priority as keyof typeof texts]}</Tag>;
      },
    },
    {
      title: 'Тип работы',
      dataIndex: 'workType',
      key: 'workType',
      ellipsis: true,
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Alert
              message="Инструкция по стабильному импорту"
              description={
                <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Откройте ваш Excel файл</li>
                  <li>Выделите данные включая заголовки (Ctrl+A)</li>
                  <li>Скопируйте данные (Ctrl+C)</li>
                  <li>Вставьте в поле ниже (Ctrl+V)</li>
                </ol>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16 }}>
              <Text strong>Пример правильного формата:</Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                fontFamily: 'monospace',
                fontSize: '12px',
                marginTop: '8px',
                borderRadius: '4px'
              }}>
                {exampleData.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(exampleData);
                  message.success('Пример скопирован');
                }}
                style={{ marginTop: 8 }}
              >
                Скопировать пример
              </Button>
            </Card>

            <TextArea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Вставьте данные из Excel здесь..."
              rows={8}
              style={{ fontFamily: 'monospace' }}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  onClick={parseCSVData}
                  disabled={!csvData.trim()}
                >
                  Обработать данные
                </Button>
                <Button onClick={() => setCsvData(exampleData)}>
                  Вставить пример
                </Button>
              </Space>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <Alert
              message={`Найдено ${parsedOrders.length} заказов`}
              description="Проверьте данные перед загрузкой в базу данных"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              columns={columns}
              dataSource={parsedOrders}
              rowKey="drawingNumber"
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ y: 200 }}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={clearExistingOrders}
                  loading={loading}
                >
                  Очистить старые заказы
                </Button>
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                  onClick={uploadOrders}
                  loading={loading}
                >
                  Загрузить в БД
                </Button>
                <Button onClick={() => setCurrentStep(0)}>
                  Назад
                </Button>
              </Space>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>Загрузка данных...</Title>
            <Progress 
              percent={uploadProgress} 
              status="active" 
              strokeColor="#1890ff"
              style={{ marginBottom: 16 }}
            />
            <Text type="secondary">
              Загружаем {parsedOrders.length} заказов в базу данных
            </Text>
          </div>
        );

      case 3:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined 
              style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} 
            />
            <Title level={4} style={{ color: '#52c41a' }}>
              Данные успешно загружены!
            </Title>
            <Paragraph>
              Заказы добавлены в базу данных. Страница автоматически обновится.
            </Paragraph>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          Стабильный импорт данных (CSV)
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <div style={{ padding: '20px 0' }}>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Вставка данных" description="Копипаст из Excel" />
          <Step title="Проверка" description="Предварительный просмотр" />
          <Step title="Загрузка" description="Сохранение в БД" />
          <Step title="Готово" description="Импорт завершен" />
        </Steps>

        {renderStepContent()}
      </div>
    </Modal>
  );
};
