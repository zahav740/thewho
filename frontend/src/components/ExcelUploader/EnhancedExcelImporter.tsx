/**
 * @file: EnhancedExcelImporter.tsx
 * @description: Улучшенный компонент для импорта Excel файлов с детальным анализом и выбором
 * @dependencies: enhancedOrdersApi, antd
 * @created: 2025-06-09
 */
import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Steps,
  Table,
  Tag,
  Row,
  Col,
  Card,
  Statistic,
  Alert,
  Checkbox,
  Space,
  Switch,
  Tooltip,
  Progress,
  message,
  Typography
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  EyeOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import enhancedOrdersApi, { ExcelPreviewResult, ExcelOrderPreview, ImportResult } from '../../services/enhancedOrdersApi';

const { Step } = Steps;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface EnhancedExcelImporterProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
}

export const EnhancedExcelImporter: React.FC<EnhancedExcelImporterProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ExcelPreviewResult | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(['green', 'yellow', 'red', 'blue']);
  const [clearExisting, setClearExisting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Сброс состояния при закрытии
  const handleClose = () => {
    setCurrentStep(0);
    setSelectedFile(null);
    setAnalysisResult(null);
    setSelectedOrders([]);
    setSelectedColors(['green', 'yellow', 'red', 'blue']);
    setClearExisting(false);
    setSkipDuplicates(true);
    setImportResult(null);
    onClose();
  };

  // Обработка выбора файла
  const handleFileSelect: UploadProps['customRequest'] = ({ file }) => {
    const uploadFile = file as File;
    setSelectedFile(uploadFile);
    setCurrentStep(1);
  };

  // Анализ файла
  const handleAnalyze = async () => {
    if (!selectedFile) {
      message.error('Выберите файл для анализа');
      return;
    }

    setLoading(true);
    try {
      const response = await enhancedOrdersApi.analyzeExcel(selectedFile);
      
      if (response.success) {
        setAnalysisResult(response.data);
        setSelectedOrders(response.data.orders.map(order => order.drawingNumber));
        setCurrentStep(2);
        message.success(`Найдено ${response.data.orders.length} заказов в файле`);
      } else {
        message.error('Ошибка анализа файла');
      }
    } catch (error: any) {
      message.error(`Ошибка анализа: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Импорт заказов
  const handleImport = async () => {
    if (!selectedFile || !analysisResult) {
      message.error('Файл не выбран или не проанализирован');
      return;
    }

    setLoading(true);
    try {
      const response = await enhancedOrdersApi.importFullExcel(selectedFile, {
        clearExisting,
        skipDuplicates,
        colorFilters: selectedColors
      });

      if (response.success) {
        setImportResult(response.data);
        setCurrentStep(3);
        message.success(response.message);
        onSuccess(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(`Ошибка импорта: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Получение цвета для тега
  const getColorTagColor = (color: string) => {
    const colorMap: Record<string, string> = {
      green: 'success',
      yellow: 'warning',
      red: 'error',
      blue: 'processing',
      other: 'default'
    };
    return colorMap[color] || 'default';
  };

  // Колонки для таблицы заказов
  const ordersColumns = [
    {
      title: 'Выбрать',
      key: 'select',
      width: 60,
      render: (_: any, record: ExcelOrderPreview) => (
        <Checkbox
          key={`checkbox-${record.rowNumber}-${record.drawingNumber}`}
          checked={selectedOrders.includes(record.drawingNumber)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders([...selectedOrders, record.drawingNumber]);
            } else {
              setSelectedOrders(selectedOrders.filter(id => id !== record.drawingNumber));
            }
          }}
        />
      ),
    },
    {
      title: 'Строка',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      width: 80,
    },
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      width: 150,
      render: (text: string) => <Text strong>{text}</Text>,
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
    },
    {
      title: 'Цвет',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string, record: ExcelOrderPreview) => (
        <Tag color={getColorTagColor(color)}>{record.colorLabel}</Tag>
      ),
    },
    {
      title: 'Операции',
      dataIndex: 'operations',
      key: 'operations',
      width: 100,
      render: (operations: any[]) => operations?.length || 0,
    },
  ];

  return (
    <Modal
      title="📊 Улучшенный импорт Excel заказов"
      open={visible}
      onCancel={handleClose}
      width={1200}
      footer={null}
      destroyOnHidden
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Выбор файла" icon={<FileExcelOutlined />} />
        <Step title="Анализ" icon={<EyeOutlined />} />
        <Step title="Настройки" icon={<FilterOutlined />} />
        <Step title="Результат" icon={<CheckCircleOutlined />} />
      </Steps>

      {/* Шаг 1: Выбор файла */}
      {currentStep === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Dragger
            accept=".xlsx,.xls"
            customRequest={handleFileSelect}
            maxCount={1}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">
              Выберите Excel файл для импорта заказов
            </p>
            <p className="ant-upload-hint">
              Поддерживаются форматы .xlsx и .xls
            </p>
          </Dragger>
        </div>
      )}

      {/* Шаг 2: Анализ файла */}
      {currentStep === 1 && selectedFile && (
        <div>
          <Alert
            message="Файл выбран"
            description={
              <div>
                <Text strong>{selectedFile.name}</Text> ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
                <br />
                Нажмите "Анализировать" для детального анализа структуры файла
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<EyeOutlined />}
              onClick={handleAnalyze}
              loading={loading}
            >
              Анализировать файл
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 3: Результат анализа и настройки */}
      {currentStep === 2 && analysisResult && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Всего заказов"
                  value={analysisResult.orders.length}
                  prefix={<FileExcelOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="🟢 Готовые"
                  value={analysisResult.colorStatistics.green.count}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="🟡 Обычные"
                  value={analysisResult.colorStatistics.yellow.count}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="🔴 Критичные"
                  value={analysisResult.colorStatistics.red.count}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="⚙️ Настройки импорта" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Tooltip title="Удалить все существующие заказы перед импортом">
                        <div>
                          <Switch
                            checked={clearExisting}
                            onChange={setClearExisting}
                            checkedChildren="Да"
                            unCheckedChildren="Нет"
                          />
                          <Text style={{ marginLeft: 8 }}>Очистить существующие заказы</Text>
                        </div>
                      </Tooltip>
                    </Col>
                    <Col span={8}>
                      <Tooltip title="Пропускать заказы с дублирующимися номерами чертежей">
                        <div>
                          <Switch
                            checked={skipDuplicates}
                            onChange={setSkipDuplicates}
                            checkedChildren="Да"
                            unCheckedChildren="Нет"
                          />
                          <Text style={{ marginLeft: 8 }}>Пропускать дубликаты</Text>
                        </div>
                      </Tooltip>
                    </Col>
                    <Col span={8}>
                      <Text>Выбрано заказов: {selectedOrders.length}</Text>
                    </Col>
                  </Row>

                  <div>
                    <Text strong>Цветовые фильтры:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Checkbox.Group
                        value={selectedColors}
                        onChange={(checkedValues) => setSelectedColors(checkedValues as string[])}
                      >
                        <Row>
                          <Col span={6}>
                            <Checkbox value="green">🟢 Готовые ({analysisResult.colorStatistics.green.count})</Checkbox>
                          </Col>
                          <Col span={6}>
                            <Checkbox value="yellow">🟡 Обычные ({analysisResult.colorStatistics.yellow.count})</Checkbox>
                          </Col>
                          <Col span={6}>
                            <Checkbox value="red">🔴 Критичные ({analysisResult.colorStatistics.red.count})</Checkbox>
                          </Col>
                          <Col span={6}>
                            <Checkbox value="blue">🔵 Плановые ({analysisResult.colorStatistics.blue.count})</Checkbox>
                          </Col>
                        </Row>
                      </Checkbox.Group>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card 
            title="📋 Список заказов для импорта" 
            size="small"
            extra={
              <Space>
                <Button
                  size="small"
                  onClick={() => setSelectedOrders(analysisResult.orders.map(o => o.drawingNumber))}
                >
                  Выбрать все
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedOrders([])}
                >
                  Очистить выбор
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={analysisResult.orders}
              columns={ordersColumns}
              rowKey={(record) => `${record.rowNumber}-${record.drawingNumber}`}
              size="small"
              scroll={{ y: 300 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Всего ${total} заказов`
              }}
            />
          </Card>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space size="large">
              <Button onClick={() => setCurrentStep(1)}>
                Назад
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<ImportOutlined />}
                onClick={handleImport}
                loading={loading}
                disabled={selectedOrders.length === 0}
              >
                Импортировать ({selectedOrders.length} заказов)
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* Шаг 4: Результат импорта */}
      {currentStep === 3 && importResult && (
        <div>
          <Alert
            message="Импорт завершен успешно!"
            type="success"
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Создано"
                  value={importResult.created}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Обновлено"
                  value={importResult.updated}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ImportOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Пропущено"
                  value={importResult.duplicatesSkipped}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Ошибки"
                  value={importResult.errors.length}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<DeleteOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {importResult.errors.length > 0 && (
            <Card title="⚠️ Ошибки импорта" size="small">
              {importResult.errors.map((error, index) => (
                <Alert
                  key={index}
                  message={`Строка ${error.row}: ${error.order}`}
                  description={error.error}
                  type="error"
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Card>
          )}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleClose}
            >
              Готово
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EnhancedExcelImporter;
