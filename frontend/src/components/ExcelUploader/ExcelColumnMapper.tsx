/**
 * @file: ExcelColumnMapper.tsx
 * @description: Компонент для выбора и маппинга колонок Excel файла
 * @dependencies: antd, react
 * @created: 2025-06-25
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Tag,
  Divider,
  Row,
  Col,
  Checkbox,
  InputNumber,
  message,
  Steps,
  Modal,
  Spin
} from 'antd';
import {
  FileExcelOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;

interface ExcelColumnInfo {
  columnIndex: number;
  columnLetter: string;
  header: string;
  sampleValues: string[];
  detectedType: 'text' | 'number' | 'date' | 'unknown';
  suggestedMapping: string | null;
  confidence: number;
}

interface ExcelSheetInfo {
  sheetName: string;
  sheetIndex: number;
  rowCount: number;
  columnCount: number;
  columns: ExcelColumnInfo[];
}

interface ExcelFileAnalysis {
  fileName: string;
  sheets: ExcelSheetInfo[];
  recommendedSheet: number;
  availableMappings: string[];
}

interface ColumnMapping {
  drawingNumber?: number;
  quantity?: number;
  deadline?: number;
  priority?: number;
  workType?: number;
  operations?: {
    startColumn: number;
    columnsPerOperation: number;
    maxOperations: number;
  };
}

interface ExcelImportSettings {
  sheetIndex: number;
  hasHeaders: boolean;
  startRow: number;
  columnMapping: ColumnMapping;
  colorFilters?: string[];
}

interface ExcelColumnMapperProps {
  file: File;
  onSettingsConfirm: (settings: ExcelImportSettings) => void;
  onCancel: () => void;
  visible: boolean;
}

const mappingLabels: Record<string, string> = {
  drawingNumber: '📝 Номер чертежа',
  quantity: '🔢 Количество',
  deadline: '📅 Срок выполнения',
  priority: '⭐ Приоритет',
  workType: '🔧 Тип работы',
  operations: '⚙️ Операции'
};

const typeIcons: Record<string, string> = {
  text: '📝',
  number: '🔢',
  date: '📅',
  unknown: '❓'
};

const ExcelColumnMapper: React.FC<ExcelColumnMapperProps> = ({
  file,
  onSettingsConfirm,
  onCancel,
  visible
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ExcelFileAnalysis | null>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [startRow, setStartRow] = useState(2);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [operationsSettings, setOperationsSettings] = useState({
    startColumn: 0,
    columnsPerOperation: 2,
    maxOperations: 5
  });

  // Анализ файла при открытии модального окна
  useEffect(() => {
    if (visible && file) {
      analyzeFile();
    }
  }, [visible, file]);

  const analyzeFile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/orders/analyze-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const result: ExcelFileAnalysis = await response.json();
      setAnalysis(result);
      setSelectedSheet(result.recommendedSheet);
      
      // Автоматически применяем предложенный маппинг
      applyAutoMapping(result.sheets[result.recommendedSheet]);
      
      message.success('Структура файла проанализирована');
    } catch (error: any) {
      console.error('Ошибка анализа файла:', error);
      message.error(`Ошибка анализа файла: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyAutoMapping = (sheet: ExcelSheetInfo) => {
    const newMapping: ColumnMapping = {};
    let operationsStart = 0;
    
    sheet.columns.forEach(col => {
      if (col.suggestedMapping && col.confidence > 60) {
        switch (col.suggestedMapping) {
          case 'drawingNumber':
            newMapping.drawingNumber = col.columnIndex;
            break;
          case 'quantity':
            newMapping.quantity = col.columnIndex;
            break;
          case 'deadline':
            newMapping.deadline = col.columnIndex;
            break;
          case 'priority':
            newMapping.priority = col.columnIndex;
            break;
          case 'workType':
            newMapping.workType = col.columnIndex;
            break;
          case 'operations':
            if (!operationsStart) {
              operationsStart = col.columnIndex;
            }
            break;
        }
      }
    });
    
    // Настройка операций
    if (operationsStart > 0) {
      newMapping.operations = {
        startColumn: operationsStart,
        columnsPerOperation: 2,
        maxOperations: 5
      };
      setOperationsSettings({
        startColumn: operationsStart,
        columnsPerOperation: 2,
        maxOperations: 5
      });
    }
    
    setColumnMapping(newMapping);
  };

  const handleSheetChange = (sheetIndex: number) => {
    setSelectedSheet(sheetIndex);
    if (analysis) {
      applyAutoMapping(analysis.sheets[sheetIndex]);
    }
  };

  const handleMappingChange = (field: string, columnIndex: number | undefined) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: columnIndex
    }));
  };

  const handleOperationsChange = (key: string, value: number) => {
    const newSettings = { ...operationsSettings, [key]: value };
    setOperationsSettings(newSettings);
    
    setColumnMapping(prev => ({
      ...prev,
      operations: newSettings.startColumn > 0 ? newSettings : undefined
    }));
  };

  const validateMapping = (): boolean => {
    if (!columnMapping.drawingNumber) {
      message.error('Необходимо указать колонку с номером чертежа');
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validateMapping()) return;
    
    const settings: ExcelImportSettings = {
      sheetIndex: selectedSheet,
      hasHeaders,
      startRow,
      columnMapping,
      colorFilters: []
    };
    
    onSettingsConfirm(settings);
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Анализируем структуру Excel файла...</Text>
          </div>
        </div>
      );
    }

    if (!analysis) {
      return (
        <Alert
          message="Ошибка анализа файла"
          description="Не удалось проанализировать структуру Excel файла"
          type="error"
          showIcon
        />
      );
    }

    switch (currentStep) {
      case 0:
        return renderSheetSelection();
      case 1:
        return renderColumnMapping();
      case 2:
        return renderSettingsReview();
      default:
        return null;
    }
  };

  const renderSheetSelection = () => {
    return (
      <div>
        <Title level={4}>
          <FileExcelOutlined /> Выберите лист для импорта
        </Title>
        <Paragraph type="secondary">
          Файл содержит {analysis!.sheets.length} лист(ов). Выберите лист с данными заказов.
        </Paragraph>
        
        <Row gutter={16}>
          {analysis!.sheets.map((sheet, index) => (
            <Col span={8} key={index}>
              <Card
                hoverable
                onClick={() => handleSheetChange(index)}
                style={{
                  border: selectedSheet === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: selectedSheet === index ? '#f0f8ff' : 'white'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <Title level={5} style={{ margin: '8px 0' }}>
                    {sheet.sheetName}
                  </Title>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">{sheet.rowCount} строк</Text>
                    <Text type="secondary">{sheet.columnCount} колонок</Text>
                    {index === analysis!.recommendedSheet && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Рекомендуется
                      </Tag>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Divider />
        
        <Card title="Настройки чтения" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Checkbox
                checked={hasHeaders}
                onChange={(e) => {
                  setHasHeaders(e.target.checked);
                  setStartRow(e.target.checked ? 2 : 1);
                }}
              >
                Первая строка содержит заголовки
              </Checkbox>
            </Col>
            <Col span={12}>
              <Space>
                <Text>Начать чтение с строки:</Text>
                <InputNumber
                  min={1}
                  max={100}
                  value={startRow}
                  onChange={(value) => setStartRow(value || 1)}
                />
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  const renderColumnMapping = () => {
    const sheet = analysis!.sheets[selectedSheet];
    
    const columns = [
      {
        title: 'Колонка',
        dataIndex: 'columnLetter',
        key: 'columnLetter',
        width: 80,
        render: (letter: string) => (
          <Tag color="blue">{letter}</Tag>
        )
      },
      {
        title: 'Заголовок',
        dataIndex: 'header',
        key: 'header',
        width: 150,
        ellipsis: true
      },
      {
        title: 'Тип',
        dataIndex: 'detectedType',
        key: 'detectedType',
        width: 80,
        render: (type: string) => (
          <Space>
            <span>{typeIcons[type]}</span>
            <Text type="secondary">{type}</Text>
          </Space>
        )
      },
      {
        title: 'Примеры данных',
        dataIndex: 'sampleValues',
        key: 'sampleValues',
        width: 200,
        render: (values: string[]) => (
          <div>
            {values.slice(0, 2).map((value, index) => (
              <div key={index}>
                <Text style={{ fontSize: 12 }}>{value || 'пусто'}</Text>
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Автоопределение',
        key: 'suggested',
        width: 150,
        render: (_: any, record: ExcelColumnInfo) => {
          if (record.suggestedMapping && record.confidence > 60) {
            return (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                {mappingLabels[record.suggestedMapping]}
              </Tag>
            );
          }
          return <Text type="secondary">—</Text>;
        }
      },
      {
        title: 'Использовать как',
        key: 'mapping',
        width: 200,
        render: (_: any, record: ExcelColumnInfo) => {
          const currentMapping = Object.entries(columnMapping).find(
            ([key, value]) => key !== 'operations' && value === record.columnIndex
          )?.[0];
          
          return (
            <Select
              style={{ width: '100%' }}
              placeholder="Не использовать"
              value={currentMapping}
              onChange={(value) => handleMappingChange(value, record.columnIndex)}
              allowClear
            >
              {Object.entries(mappingLabels)
                .filter(([key]) => key !== 'operations')
                .map(([key, label]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))
              }
            </Select>
          );
        }
      }
    ];

    return (
      <div>
        <Title level={4}>
          <SettingOutlined /> Настройка соответствия колонок
        </Title>
        <Paragraph type="secondary">
          Укажите, какие колонки соответствуют полям заказа. Колонка "Номер чертежа" обязательна.
        </Paragraph>

        <Alert
          message="Автоматическое определение"
          description="Система автоматически определила возможные соответствия колонок. Проверьте и откорректируйте при необходимости."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={sheet.columns}
          rowKey="columnIndex"
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
        />

        <Divider />
        
        <Card title="⚙️ Настройки операций" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <Space direction="vertical">
                <Text>Операции начинаются с колонки:</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Выберите колонку"
                  value={operationsSettings.startColumn || undefined}
                  onChange={(value) => handleOperationsChange('startColumn', value)}
                  allowClear
                >
                  {sheet.columns.map(col => (
                    <Option key={col.columnIndex} value={col.columnIndex}>
                      {col.columnLetter} - {col.header}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical">
                <Text>Колонок на операцию:</Text>
                <InputNumber
                  min={2}
                  max={6}
                  value={operationsSettings.columnsPerOperation}
                  onChange={(value) => handleOperationsChange('columnsPerOperation', value || 2)}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (номер, тип, время, оси)
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical">
                <Text>Максимум операций:</Text>
                <InputNumber
                  min={1}
                  max={10}
                  value={operationsSettings.maxOperations}
                  onChange={(value) => handleOperationsChange('maxOperations', value || 5)}
                />
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  const renderSettingsReview = () => {
    const sheet = analysis!.sheets[selectedSheet];
    const mappedFields = Object.entries(columnMapping)
      .filter(([key, value]) => key !== 'operations' && value)
      .map(([key, value]) => {
        const column = sheet.columns.find(col => col.columnIndex === value);
        return {
          field: mappingLabels[key],
          column: column ? `${column.columnLetter} - ${column.header}` : 'Не найдена'
        };
      });

    return (
      <div>
        <Title level={4}>
          <CheckCircleOutlined /> Проверьте настройки импорта
        </Title>
        <Paragraph type="secondary">
          Убедитесь, что все настройки корректны перед началом импорта.
        </Paragraph>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="📊 Общие настройки" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Файл:</Text> {analysis!.fileName}
                </div>
                <div>
                  <Text strong>Лист:</Text> {sheet.sheetName}
                </div>
                <div>
                  <Text strong>Строк данных:</Text> {sheet.rowCount - (hasHeaders ? 1 : 0)}
                </div>
                <div>
                  <Text strong>Заголовки:</Text> {hasHeaders ? 'Есть' : 'Нет'}
                </div>
                <div>
                  <Text strong>Начать с строки:</Text> {startRow}
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="🗂️ Соответствие колонок" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {mappedFields.map((item, index) => (
                  <div key={index}>
                    <Text strong>{item.field}:</Text>
                    <br />
                    <Text type="secondary">{item.column}</Text>
                  </div>
                ))}
                {columnMapping.operations && (
                  <div>
                    <Text strong>⚙️ Операции:</Text>
                    <br />
                    <Text type="secondary">
                      Начиная с колонки {operationsSettings.startColumn}, 
                      {operationsSettings.columnsPerOperation} кол./операция, 
                      макс. {operationsSettings.maxOperations} операций
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {!columnMapping.drawingNumber && (
          <Alert
            message="Внимание!"
            description="Не указана колонка с номером чертежа. Это поле обязательно для создания заказов."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    );
  };

  const steps = [
    {
      title: 'Выбор листа',
      description: 'Выберите лист с данными',
      icon: <FileExcelOutlined />
    },
    {
      title: 'Настройка колонок',
      description: 'Укажите соответствие колонок',
      icon: <SettingOutlined />
    },
    {
      title: 'Проверка',
      description: 'Проверьте настройки',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <Modal
      title={(
        <Space>
          <FileExcelOutlined />
          <span>Настройка импорта Excel</span>
        </Space>
      )}
      open={visible}
      onCancel={onCancel}
      width={1200}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button
          key="prev"
          disabled={currentStep === 0 || loading}
          onClick={() => setCurrentStep(prev => prev - 1)}
        >
          Назад
        </Button>,
        currentStep < 2 ? (
          <Button
            key="next"
            type="primary"
            disabled={loading}
            onClick={() => setCurrentStep(prev => prev + 1)}
            icon={<ArrowRightOutlined />}
          >
            Далее
          </Button>
        ) : (
          <Button
            key="confirm"
            type="primary"
            disabled={loading || !columnMapping.drawingNumber}
            onClick={handleConfirm}
            icon={<CheckCircleOutlined />}
          >
            Начать импорт
          </Button>
        )
      ]}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            icon={step.icon}
          />
        ))}
      </Steps>

      {renderStepContent()}
    </Modal>
  );
};

export default ExcelColumnMapper;
