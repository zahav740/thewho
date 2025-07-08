/**
 * @file: EnhancedExcelImportModal.tsx
 * @description: Улучшенный модальный компонент для импорта Excel с проверкой дубликатов
 * @created: 2025-07-08
 */
import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  message,
  Alert,
  Steps,
  Row,
  Col,
  Card,
  Radio,
  Space,
  Typography,
  Progress,
  Statistic
} from 'antd';
import {
  InboxOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import DuplicateResolutionModal from './DuplicateResolutionModal';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Step } = Steps;

// Типы данных
interface ImportResultWithDuplicates {
  created: number;
  updated: number;
  duplicatesFound: Array<{
    orderData: any;
    existingOrder: any;
    differences: string[];
  }>;
  errors: Array<{ order: string; error: string }>;
  needsUserDecision: boolean;
  fileId?: string;
}

interface DuplicateResolution {
  action: 'replace' | 'skip' | 'merge' | 'replace_completely' | 'restore';
  orderDrawingNumber: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (result: ImportResultWithDuplicates) => void;
}

// API сервис
class ExcelImportDuplicatesAPI {
  private baseUrl = '/api/excel-import-duplicates';

  async analyzeForDuplicates(file: File): Promise<ImportResultWithDuplicates> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка анализа файла: ${response.status}`);
    }

    return response.json();
  }

  async processWithResolutions(
    fileId: string,
    resolutions: DuplicateResolution[]
  ): Promise<ImportResultWithDuplicates> {
    const response = await fetch(`${this.baseUrl}/process-with-resolutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        resolutions: {
          resolutions,
          defaultAction: 'skip'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка обработки решений: ${response.status}`);
    }

    return response.json();
  }

  async importWithAutoResolve(
    file: File,
    autoAction: 'replace' | 'skip' = 'skip'
  ): Promise<ImportResultWithDuplicates> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('autoAction', autoAction);

    const response = await fetch(`${this.baseUrl}/import-auto`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка автоматического импорта: ${response.status}`);
    }

    return response.json();
  }
}

const api = new ExcelImportDuplicatesAPI();

const EnhancedExcelImportModal: React.FC<Props> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImportResultWithDuplicates | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [autoAction, setAutoAction] = useState<'replace' | 'skip'>('skip');
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [finalResult, setFinalResult] = useState<ImportResultWithDuplicates | null>(null);

  const resetState = () => {
    setCurrentStep(0);
    setLoading(false);
    setAnalysisResult(null);
    setUploadedFile(null);
    setDuplicateModalVisible(false);
    setFinalResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setUploadedFile(file);

    try {
      const result = await api.analyzeForDuplicates(file);
      setAnalysisResult(result);

      if (result.needsUserDecision && result.duplicatesFound.length > 0) {
        setCurrentStep(1);
        setDuplicateModalVisible(true);
        message.info(`Найдено ${result.duplicatesFound.length} дубликатов. Требуется принятие решения.`);
      } else {
        // Нет дубликатов - сразу показываем результат
        setCurrentStep(2);
        setFinalResult(result);
        message.success(`Импорт завершен! Создано: ${result.created}, обновлено: ${result.updated}`);
        onSuccess?.(result);
      }
    } catch (error) {
      console.error('Ошибка анализа файла:', error);
      message.error(error instanceof Error ? error.message : 'Ошибка анализа файла');
    } finally {
      setLoading(false);
    }

    return false; // Предотвращаем автоматическую загрузку
  };

  const handleAutoImport = async (file: File) => {
    setLoading(true);
    setUploadedFile(file);

    try {
      const result = await api.importWithAutoResolve(file, autoAction);
      setFinalResult(result);
      setCurrentStep(2);
      message.success(`Автоматический импорт завершен! Создано: ${result.created}, обновлено: ${result.updated}`);
      onSuccess?.(result);
    } catch (error) {
      console.error('Ошибка автоматического импорта:', error);
      message.error(error instanceof Error ? error.message : 'Ошибка автоматического импорта');
    } finally {
      setLoading(false);
    }

    return false;
  };

  const handleDuplicateResolutions = async (resolutions: DuplicateResolution[]) => {
    if (!analysisResult?.fileId) {
      message.error('Файл не найден. Повторите загрузку.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.processWithResolutions(analysisResult.fileId, resolutions);
      setFinalResult(result);
      setCurrentStep(2);
      setDuplicateModalVisible(false);
      message.success(`Импорт завершен! Создано: ${result.created}, обновлено: ${result.updated}`);
      onSuccess?.(result);
    } catch (error) {
      console.error('Ошибка обработки решений:', error);
      message.error(error instanceof Error ? error.message : 'Ошибка обработки решений');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: handleFileUpload,
    showUploadList: false,
  };

  const autoUploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: handleAutoImport,
    showUploadList: false,
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <FileExcelOutlined />
            Импорт Excel с проверкой дубликатов
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        width={800}
        footer={
          currentStep === 2 ? [
            <Button key="close" type="primary" onClick={handleClose}>
              Закрыть
            </Button>,
            <Button key="new" onClick={resetState}>
              Импортировать еще один файл
            </Button>
          ] : [
            <Button key="cancel" onClick={handleClose}>
              Отмена
            </Button>
          ]
        }
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step
            title="Загрузка файла"
            description="Выберите режим импорта"
            icon={currentStep === 0 && loading ? <LoadingOutlined /> : <UploadOutlined />}
          />
          <Step
            title="Обработка дубликатов"
            description="Решение по найденным дубликатам"
            icon={<WarningOutlined />}
          />
          <Step
            title="Результат"
            description="Импорт завершен"
            icon={<CheckCircleOutlined />}
          />
        </Steps>

        {/* Шаг 1: Выбор режима импорта */}
        {currentStep === 0 && (
          <div>
            <Alert
              message="Выберите режим импорта Excel файла"
              description="Вы можете выполнить импорт с проверкой дубликатов или автоматический импорт с заданным поведением."
              type="info"
              style={{ marginBottom: 20 }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Card 
                  title="🔍 Импорт с анализом дубликатов" 
                  style={{ height: '100%' }}
                  hoverable
                >
                  <Paragraph>
                    Система проанализирует файл, найдет дубликаты и предложит выбрать действие для каждого.
                    Рекомендуется для сохранения прогресса выполненных операций.
                  </Paragraph>
                  
                  <Dragger {...uploadProps} disabled={loading} style={{ marginTop: 16 }}>
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
                <Card 
                  title="⚡ Автоматический импорт" 
                  style={{ height: '100%' }}
                  hoverable
                >
                  <Paragraph>
                    Быстрый импорт с автоматической обработкой всех дубликатов согласно выбранному правилу.
                  </Paragraph>
                  
                  <Radio.Group
                    value={autoAction}
                    onChange={(e) => setAutoAction(e.target.value)}
                    style={{ marginBottom: 16, width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Radio value="skip">
                        <Space>
                          <Text>Пропускать дубликаты</Text>
                          <Text type="secondary">(безопасно)</Text>
                        </Space>
                      </Radio>
                      <Radio value="replace">
                        <Space>
                          <Text>Заменять дубликаты</Text>
                          <Text type="secondary">(умное обновление)</Text>
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>
                  
                  <Upload {...autoUploadProps} disabled={loading}>
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
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* Шаг 2: Обработка дубликатов - показываем прогресс */}
        {currentStep === 1 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress type="circle" percent={100} status="active" />
            <Title level={4} style={{ marginTop: 16 }}>Анализ дубликатов завершен</Title>
            <Text type="secondary">Открывается окно для принятия решений по дубликатам...</Text>
          </div>
        )}

        {/* Шаг 3: Результат импорта */}
        {currentStep === 2 && finalResult && (
          <div>
            <Alert
              message="Импорт завершен успешно!"
              description={`Создано заказов: ${finalResult.created}, обновлено: ${finalResult.updated}, ошибок: ${finalResult.errors.length}`}
              type="success"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Создано заказов"
                    value={finalResult.created}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Обновлено заказов"
                    value={finalResult.updated}
                    prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Ошибок"
                    value={finalResult.errors.length}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: finalResult.errors.length > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {finalResult.errors.length > 0 && (
              <Alert
                message="Некоторые записи не удалось импортировать"
                description={`${finalResult.errors.length} записей содержали ошибки и были пропущены.`}
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно для разрешения дубликатов */}
      <DuplicateResolutionModal
        visible={duplicateModalVisible}
        analysisResult={analysisResult}
        onResolve={handleDuplicateResolutions}
        onCancel={() => {
          setDuplicateModalVisible(false);
          setCurrentStep(0);
        }}
        loading={loading}
      />
    </>
  );
};

export default EnhancedExcelImportModal;
