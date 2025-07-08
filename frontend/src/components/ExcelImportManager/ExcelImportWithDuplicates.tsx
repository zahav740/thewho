/**
 * @file: ExcelImportWithDuplicates.tsx
 * @description: Компонент для импорта Excel с проверкой дубликатов
 * @created: 2025-07-08
 */
import React, { useState, useCallback } from 'react';
import {
  FileExcelOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  InboxOutlined,
  EyeOutlined,
  CloseOutlined,
  CheckOutlined,
  MergeCellsOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  Button,
  Table,
  Card,
  Upload,
  message,
  Modal,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
  Alert,
  Radio,
  Collapse,
  Tooltip,
  Steps,
  Divider,
  Descriptions,
  Progress
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Panel } = Collapse;
const { Step } = Steps;

// Типы данных
interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: string;
  workType?: string;
  operations: Array<{
    operationNumber: number;
    operationType: string;
    machineAxes: number;
    estimatedTime: number;
  }>;
}

interface ExistingOrder {
  id: number;
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: string;
  workType?: string;
  operations: Array<{
    id: number;
    operationNumber: number;
    operationType: string;
    machineAxes: number;
    estimatedTime: number;
    status: string;
  }>;
}

interface DuplicateInfo {
  orderData: ParsedOrder;
  existingOrder: ExistingOrder;
  differences: string[];
}

interface ImportResultWithDuplicates {
  created: number;
  updated: number;
  duplicatesFound: DuplicateInfo[];
  errors: Array<{ order: string; error: string }>;
  needsUserDecision: boolean;
  fileId?: string;
}

interface DuplicateResolution {
  action: 'replace' | 'skip' | 'merge';
  orderDrawingNumber: string;
}

interface BatchDuplicateResolution {
  resolutions: DuplicateResolution[];
  defaultAction?: 'replace' | 'skip';
}

// Сервис для работы с API
class ExcelImportDuplicatesService {
  private baseUrl = '/api/excel-import-duplicates';

  async analyzeForDuplicates(file: File, colorFilters: string[] = []): Promise<ImportResultWithDuplicates> {
    const formData = new FormData();
    formData.append('file', file);
    if (colorFilters.length > 0) {
      formData.append('colorFilters', JSON.stringify(colorFilters));
    }

    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ошибка анализа файла: ${response.statusText}`);
    }

    return response.json();
  }

  async processWithResolutions(
    fileId: string,
    resolutions: BatchDuplicateResolution,
    colorFilters: string[] = []
  ): Promise<ImportResultWithDuplicates> {
    const response = await fetch(`${this.baseUrl}/process-with-resolutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        resolutions,
        colorFilters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка обработки решений: ${response.statusText}`);
    }

    return response.json();
  }

  async importWithAutoResolve(
    file: File,
    autoAction: 'replace' | 'skip' = 'skip',
    colorFilters: string[] = []
  ): Promise<ImportResultWithDuplicates> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('autoAction', autoAction);
    if (colorFilters.length > 0) {
      formData.append('colorFilters', JSON.stringify(colorFilters));
    }

    const response = await fetch(`${this.baseUrl}/import-auto`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ошибка автоматического импорта: ${response.statusText}`);
    }

    return response.json();
  }
}

const duplicatesService = new ExcelImportDuplicatesService();

// Компонент для отображения различий
const DifferencesDisplay: React.FC<{ differences: string[] }> = ({ differences }) => {
  if (differences.length === 0) {
    return <Text type="success">Нет различий</Text>;
  }

  return (
    <Space direction="vertical" size="small">
      {differences.map((diff, index) => (
        <Tag key={index} color="orange">
          {diff}
        </Tag>
      ))}
    </Space>
  );
};

// Компонент для выбора действия с дубликатом
const DuplicateActionSelector: React.FC<{
  duplicate: DuplicateInfo;
  selectedAction: string;
  onChange: (action: 'replace' | 'skip' | 'merge') => void;
}> = ({ duplicate, selectedAction, onChange }) => {
  return (
    <Radio.Group value={selectedAction} onChange={(e) => onChange(e.target.value)}>
      <Space direction="vertical">
        <Radio value="replace">
          <Space>
            <ReloadOutlined style={{ color: '#ff7875' }} />
            <Text>Заменить существующий заказ</Text>
          </Space>
        </Radio>
        <Radio value="merge">
          <Space>
            <MergeCellsOutlined style={{ color: '#1890ff' }} />
            <Text>Объединить с существующим</Text>
          </Space>
        </Radio>
        <Radio value="skip">
          <Space>
            <StepForwardOutlined style={{ color: '#faad14' }} />
            <Text>Пропустить (оставить как есть)</Text>
          </Space>
        </Radio>
      </Space>
    </Radio.Group>
  );
};

// Основной компонент
const ExcelImportWithDuplicates: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImportResultWithDuplicates | null>(null);
  const [resolutions, setResolutions] = useState<Map<string, 'replace' | 'skip' | 'merge'>>(new Map());
  const [defaultAction, setDefaultAction] = useState<'replace' | 'skip'>('skip');
  const [processing, setProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ImportResultWithDuplicates | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateInfo | null>(null);

  // Обработка загрузки файла
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setUploadedFile(file);
    
    try {
      const result = await duplicatesService.analyzeForDuplicates(file);
      setAnalysisResult(result);
      
      if (result.needsUserDecision) {
        setCurrentStep(1);
        message.info(`Найдено ${result.duplicatesFound.length} дубликатов. Необходимо принять решение.`);
      } else {
        setCurrentStep(2);
        setFinalResult(result);
        message.success(`Импорт завершен успешно! Создано: ${result.created}, обновлено: ${result.updated}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Ошибка анализа файла: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
    
    return false; // Предотвращаем автоматическую загрузку
  };

  // Обработка решений по дубликатам
  const handleProcessResolutions = async () => {
    if (!analysisResult?.fileId || !uploadedFile) {
      message.error('Файл не найден. Повторите загрузку.');
      return;
    }

    setProcessing(true);
    
    try {
      const batchResolutions: BatchDuplicateResolution = {
        resolutions: Array.from(resolutions.entries()).map(([orderDrawingNumber, action]) => ({
          orderDrawingNumber,
          action,
        })),
        defaultAction,
      };

      const result = await duplicatesService.processWithResolutions(
        analysisResult.fileId,
        batchResolutions
      );
      
      setFinalResult(result);
      setCurrentStep(2);
      message.success(`Импорт завершен! Создано: ${result.created}, обновлено: ${result.updated}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Ошибка обработки: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  // Автоматический импорт
  const handleAutoImport = async (file: File, action: 'replace' | 'skip') => {
    setLoading(true);
    setUploadedFile(file);
    
    try {
      const result = await duplicatesService.importWithAutoResolve(file, action);
      setFinalResult(result);
      setCurrentStep(2);
      message.success(`Автоматический импорт завершен! Создано: ${result.created}, обновлено: ${result.updated}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Ошибка автоматического импорта: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  // Сброс состояния
  const handleReset = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setAnalysisResult(null);
    setResolutions(new Map());
    setFinalResult(null);
    setSelectedDuplicate(null);
  };

  // Применить действие ко всем дубликатам
  const applyToAll = (action: 'replace' | 'skip' | 'merge') => {
    if (!analysisResult) return;
    
    const newResolutions = new Map<string, 'replace' | 'skip' | 'merge'>();
    analysisResult.duplicatesFound.forEach(duplicate => {
      newResolutions.set(duplicate.orderData.drawingNumber, action);
    });
    setResolutions(newResolutions);
  };

  // Показать детали дубликата
  const showDuplicateDetails = (duplicate: DuplicateInfo) => {
    setSelectedDuplicate(duplicate);
    setDetailsModalVisible(true);
  };

  // Колонки для таблицы дубликатов
  const duplicatesColumns = [
    {
      title: 'Номер чертежа',
      dataIndex: ['orderData', 'drawingNumber'],
      key: 'drawingNumber',
      render: (text: string) => (
        <Text strong>{text}</Text>
      ),
    },
    {
      title: 'Различия',
      dataIndex: 'differences',
      key: 'differences',
      render: (differences: string[]) => (
        <DifferencesDisplay differences={differences} />
      ),
    },
    {
      title: 'Действие',
      key: 'action',
      render: (_: any, record: DuplicateInfo) => {
        const currentAction = resolutions.get(record.orderData.drawingNumber) || 'skip';
        return (
          <DuplicateActionSelector
            duplicate={record}
            selectedAction={currentAction}
            onChange={(action) => {
              const newResolutions = new Map(resolutions);
              newResolutions.set(record.orderData.drawingNumber, action);
              setResolutions(newResolutions);
            }}
          />
        );
      },
    },
    {
      title: 'Детали',
      key: 'details',
      render: (_: any, record: DuplicateInfo) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => showDuplicateDetails(record)}
        >
          Подробно
        </Button>
      ),
    },
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: handleFileUpload,
    showUploadList: false,
  };

  return (
    <div className="excel-import-with-duplicates">
      <Title level={2}>
        <FileExcelOutlined /> Импорт Excel с проверкой дубликатов
      </Title>

      <Card className="mb-6">
        <Steps current={currentStep} className="mb-6">
          <Step
            title="Загрузка файла"
            description="Выберите Excel файл для анализа"
            icon={<UploadOutlined />}
          />
          <Step
            title="Решение по дубликатам"
            description="Выберите действия для найденных дубликатов"
            icon={<ExclamationCircleOutlined />}
          />
          <Step
            title="Результат"
            description="Импорт завершен"
            icon={<CheckCircleOutlined />}
          />
        </Steps>

        {/* Шаг 1: Загрузка файла */}
        {currentStep === 0 && (
          <div>
            <Alert
              message="Выберите режим импорта"
              description="Вы можете загрузить файл для анализа дубликатов или выполнить автоматический импорт."
              type="info"
              className="mb-4"
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Импорт с проверкой дубликатов" className="h-full">
                  <Paragraph>
                    Система проанализирует файл, найдет дубликаты и предложит выбрать действие для каждого.
                  </Paragraph>
                  
                  <Dragger {...uploadProps} disabled={loading}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">
                      Нажмите или перетащите файл для анализа
                    </p>
                    <p className="ant-upload-hint">
                      Поддерживаются файлы Excel (.xlsx, .xls)
                    </p>
                  </Dragger>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Автоматический импорт" className="h-full">
                  <Paragraph>
                    Быстрый импорт с автоматической обработкой всех дубликатов.
                  </Paragraph>
                  
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio.Group
                      value={defaultAction}
                      onChange={(e) => setDefaultAction(e.target.value)}
                      className="mb-4"
                    >
                      <Radio value="skip">Пропускать дубликаты</Radio>
                      <Radio value="replace">Заменять дубликаты</Radio>
                    </Radio.Group>
                    
                    <Upload
                      {...{
                        ...uploadProps,
                        beforeUpload: (file) => handleAutoImport(file, defaultAction),
                      }}
                      disabled={loading}
                    >
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        loading={loading}
                        size="large"
                        style={{ width: '100%' }}
                      >
                        Импортировать автоматически
                      </Button>
                    </Upload>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* Шаг 2: Решение по дубликатам */}
        {currentStep === 1 && analysisResult && (
          <div>
            <Alert
              message={`Найдено ${analysisResult.duplicatesFound.length} дубликатов`}
              description="Выберите действие для каждого дубликата или примените одно действие ко всем."
              type="warning"
              className="mb-4"
            />

            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Statistic
                  title="Новых заказов"
                  value={analysisResult.created}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Дубликатов найдено"
                  value={analysisResult.duplicatesFound.length}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Ошибок"
                  value={analysisResult.errors.length}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                />
              </Col>
            </Row>

            <Card title="Быстрые действия" className="mb-4">
              <Space>
                <Button onClick={() => applyToAll('skip')} icon={<StepForwardOutlined />}>
                  Пропустить все
                </Button>
                <Button onClick={() => applyToAll('replace')} icon={<ReloadOutlined />}>
                  Заменить все
                </Button>
                <Button onClick={() => applyToAll('merge')} icon={<MergeCellsOutlined />}>
                  Объединить все
                </Button>
              </Space>
            </Card>

            <Card title="Дубликаты" className="mb-4">
              <Table
                columns={duplicatesColumns}
                dataSource={analysisResult.duplicatesFound}
                rowKey={(record) => record.orderData.drawingNumber}
                pagination={false}
                size="small"
              />
            </Card>

            {analysisResult.errors.length > 0 && (
              <Card title="Ошибки" className="mb-4">
                <Collapse>
                  {analysisResult.errors.map((error, index) => (
                    <Panel header={error.order} key={index}>
                      <Text type="danger">{error.error}</Text>
                    </Panel>
                  ))}
                </Collapse>
              </Card>
            )}

            <Row justify="space-between">
              <Button onClick={handleReset}>
                Начать заново
              </Button>
              <Button
                type="primary"
                loading={processing}
                onClick={handleProcessResolutions}
                disabled={analysisResult.duplicatesFound.length === 0}
              >
                Применить решения
              </Button>
            </Row>
          </div>
        )}

        {/* Шаг 3: Результат */}
        {currentStep === 2 && finalResult && (
          <div>
            <Alert
              message="Импорт завершен успешно!"
              description={`Создано: ${finalResult.created}, обновлено: ${finalResult.updated}, ошибок: ${finalResult.errors.length}`}
              type="success"
              className="mb-4"
            />

            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Создано заказов"
                    value={finalResult.created}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Обновлено заказов"
                    value={finalResult.updated}
                    prefix={<SyncOutlined style={{ color: '#1890ff' }} />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Ошибок"
                    value={finalResult.errors.length}
                    prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  />
                </Card>
              </Col>
            </Row>

            {finalResult.errors.length > 0 && (
              <Card title="Ошибки" className="mb-4">
                <Collapse>
                  {finalResult.errors.map((error, index) => (
                    <Panel header={error.order} key={index}>
                      <Text type="danger">{error.error}</Text>
                    </Panel>
                  ))}
                </Collapse>
              </Card>
            )}

            <Button type="primary" onClick={handleReset}>
              Импортировать еще один файл
            </Button>
          </div>
        )}
      </Card>

      {/* Модальное окно деталей дубликата */}
      <Modal
        title={`Детали дубликата: ${selectedDuplicate?.orderData.drawingNumber}`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
      >
        {selectedDuplicate && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Новые данные" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Номер чертежа">
                      {selectedDuplicate.orderData.drawingNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Количество">
                      {selectedDuplicate.orderData.quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="Дедлайн">
                      {new Date(selectedDuplicate.orderData.deadline).toLocaleDateString('ru-RU')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Приоритет">
                      {selectedDuplicate.orderData.priority}
                    </Descriptions.Item>
                    <Descriptions.Item label="Тип работы">
                      {selectedDuplicate.orderData.workType || 'Не указан'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Операции">
                      {selectedDuplicate.orderData.operations.length}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Существующие данные" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Номер чертежа">
                      {selectedDuplicate.existingOrder.drawingNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Количество">
                      {selectedDuplicate.existingOrder.quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="Дедлайн">
                      {new Date(selectedDuplicate.existingOrder.deadline).toLocaleDateString('ru-RU')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Приоритет">
                      {selectedDuplicate.existingOrder.priority}
                    </Descriptions.Item>
                    <Descriptions.Item label="Тип работы">
                      {selectedDuplicate.existingOrder.workType || 'Не указан'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Операции">
                      {selectedDuplicate.existingOrder.operations?.length || 0}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            
            <Divider />
            
            <Card title="Различия" size="small">
              <DifferencesDisplay differences={selectedDuplicate.differences} />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExcelImportWithDuplicates;
