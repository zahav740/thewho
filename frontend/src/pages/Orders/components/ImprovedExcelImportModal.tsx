/**
 * @file: ImprovedExcelImportModal.tsx
 * @description: Улучшенное модальное окно импорта Excel с проверкой дубликатов
 * @created: 2025-07-08
 */
import React, { useState } from 'react';
import {
  Modal,
  Button,
  Upload,
  message,
  Steps,
  Alert,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Radio,
  Tooltip,
  Progress,
} from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  InboxOutlined,
  EyeOutlined,
  ReloadOutlined,
  MergeCellsOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;

interface ImprovedExcelImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

interface DuplicateInfo {
  orderData: any;
  existingOrder: any;
  differences: string[];
}

interface ImportResult {
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

export const ImprovedExcelImportModal: React.FC<ImprovedExcelImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImportResult | null>(null);
  const [resolutions, setResolutions] = useState<Map<string, 'replace' | 'skip' | 'merge'>>(new Map());
  const [processing, setProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ImportResult | null>(null);

  // Сброс состояния
  const handleReset = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setAnalysisResult(null);
    setResolutions(new Map());
    setFinalResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Обработка загрузки файла
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setUploadedFile(file);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/excel-import-duplicates/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка анализа файла: ${response.statusText}`);
      }

      const result = await response.json();
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
      const batchResolutions = {
        resolutions: Array.from(resolutions.entries()).map(([orderDrawingNumber, action]) => ({
          orderDrawingNumber,
          action,
        })),
        defaultAction: 'skip' as const,
      };

      const response = await fetch('/api/excel-import-duplicates/process-with-resolutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: analysisResult.fileId,
          resolutions: batchResolutions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка обработки решений: ${response.statusText}`);
      }

      const result = await response.json();
      
      setFinalResult(result);
      setCurrentStep(2);
      message.success(`Импорт завершен! Создано: ${result.created}, обновлено: ${result.updated}`);
      
      // Вызываем callback с результатом
      onSuccess(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Ошибка обработки: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
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
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: handleFileUpload,
    showUploadList: false,
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Alert
              message="Импорт Excel с проверкой дубликатов"
              description="Система проанализирует файл, найдет дубликаты и предложит выбрать действие для каждого."
              type="info"
              className="mb-4"
            />
            
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
          </div>
        );

      case 1:
        return analysisResult && (
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

            <div style={{ textAlign: 'center' }}>
              <Space>
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
              </Space>
            </div>
          </div>
        );

      case 2:
        return finalResult && (
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

            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={handleClose}>
                Закрыть
              </Button>
            </div>
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
          <FileExcelOutlined />
          Импорт Excel с проверкой дубликатов
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
          <Step
            title="Загрузка файла"
            description="Выбор Excel файла для анализа"
            icon={<UploadOutlined />}
          />
          <Step
            title="Решение по дубликатам"
            description="Выбор действий для найденных дубликатов"
            icon={<ExclamationCircleOutlined />}
          />
          <Step
            title="Результат"
            description="Импорт завершен"
            icon={<CheckCircleOutlined />}
          />
        </Steps>

        {renderStepContent()}
      </div>
    </Modal>
  );
};
