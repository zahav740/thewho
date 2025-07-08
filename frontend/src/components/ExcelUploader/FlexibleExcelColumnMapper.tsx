/**
 * @file: FlexibleExcelColumnMapper.tsx  
 * @description: Гибкий компонент для маппинга колонок Excel (без react-dnd)
 * @dependencies: antd, react
 * @created: 2025-01-28
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Steps,
  Card,
  Row,
  Col,
  Button,
  Typography,
  Alert,
  Table,
  Tag,
  Space,
  Divider,
  message,
  Spin,
  Select,
  Empty
} from 'antd';
import {
  FileExcelOutlined,
  SettingOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { ExcelColumn, FlexibleImportSettings, ExcelAnalysisResult } from '../../types/excel-import.types';

const { Step } = Steps;
const { Title, Text } = Typography;

interface FlexibleExcelColumnMapperProps {
  file: File;
  visible: boolean;
  onSettingsConfirm: (settings: FlexibleImportSettings) => void;
  onCancel: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
  description: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date';
}

const SYSTEM_FIELDS: FieldConfig[] = [
  {
    key: 'drawingNumber',
    label: 'מק"ט / מספר שרטוט',
    description: 'מספר זיהוי יחודי של הפריט',
    required: true,
    type: 'string'
  },
  {
    key: 'quantity', 
    label: 'כמות',
    description: 'כמות היחידות לייצור',
    type: 'number'
  },
  {
    key: 'deadline',
    label: 'תאריך יעד',
    description: 'מועד סיום נדרש',
    type: 'date'
  },
  {
    key: 'priority',
    label: 'דחיפות',
    description: 'רמת עדיפות (1-5)',
    type: 'number'
  },
  {
    key: 'workType',
    label: 'סוג עבודה',
    description: 'קטגוריית העבודה',
    type: 'string'
  }
];

const FlexibleExcelColumnMapper: React.FC<FlexibleExcelColumnMapperProps> = ({
  file,
  visible,
  onSettingsConfirm,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [excelStructure, setExcelStructure] = useState<ExcelAnalysisResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

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

      const response = await fetch('/api/orders/analyze-excel-structure', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка анализа файла');
      }

      const result: ExcelAnalysisResult = await response.json();
      setExcelStructure(result);
      setSelectedSheet(result.selectedSheet.name);
      
      // Автоматический маппинг на основе названий колонок
      autoMapColumns(result.columns);
      
      setCurrentStep(1);
    } catch (error: any) {
      message.error(`Ошибка анализа файла: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const autoMapColumns = (columns: ExcelColumn[]) => {
    const mapping: Record<string, string> = {};
    
    columns.forEach(column => {
      const headerLower = column.header.toLowerCase();
      
      // Автоматическое определение колонок по ключевым словам
      if (headerLower.includes('מקט') || headerLower.includes('drawing') || headerLower.includes('part')) {
        mapping[column.letter] = 'drawingNumber';
      } else if (headerLower.includes('כמות') || headerLower.includes('quantity') || headerLower.includes('qty')) {
        mapping[column.letter] = 'quantity';
      } else if (headerLower.includes('תאריך') || headerLower.includes('date') || headerLower.includes('deadline')) {
        mapping[column.letter] = 'deadline';
      } else if (headerLower.includes('דחיפות') || headerLower.includes('priority') || headerLower.includes('urgent')) {
        mapping[column.letter] = 'priority';
      } else if (headerLower.includes('עבודה') || headerLower.includes('work') || headerLower.includes('type')) {
        mapping[column.letter] = 'workType';
      }
    });
    
    setColumnMapping(mapping);
  };

  const handleColumnMapping = (columnLetter: string, fieldKey: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev };
      
      // Удаляем предыдущий маппинг для этого поля
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === fieldKey) {
          delete newMapping[key];
        }
      });
      
      // Добавляем новый маппинг
      if (fieldKey) {
        newMapping[columnLetter] = fieldKey;
      } else {
        delete newMapping[columnLetter];
      }
      
      return newMapping;
    });
  };

  const handlePreview = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    try {
      const settings: FlexibleImportSettings = {
        columnMapping,
        sheetName: selectedSheet,
        startRow: 2
      };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('settings', JSON.stringify(settings));

      const response = await fetch('/api/orders/preview-flexible-import?limit=10', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка предварительного просмотра');
      }

      const result = await response.json();
      setPreviewData(result.preview || []);
      setCurrentStep(2);
    } catch (error: any) {
      message.error(`Ошибка предварительного просмотра: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateMapping = (): boolean => {
    const mappedFields = Object.values(columnMapping);
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required).map(f => f.key);
    
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingRequired.length > 0) {
      message.error(`Необходимо указать колонки для обязательных полей: ${missingRequired.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleConfirm = () => {
    if (!validateMapping()) return;

    const settings: FlexibleImportSettings = {
      columnMapping,
      sheetName: selectedSheet,
      startRow: 2,
      updateExisting: true
    };

    onSettingsConfirm(settings);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Title level={4}>Анализ структуры Excel файла</Title>
              <Text type="secondary">Пожалуйста, подождите...</Text>
            </div>
          </div>
        );

      case 1:
        return renderMappingStep();

      case 2:
        return renderPreviewStep();

      default:
        return null;
    }
  };

  const renderMappingStep = () => {
    if (!excelStructure) return null;

    return (
      <div>
        <Alert
          message="Настройка соответствия колонок"
          description="Выберите колонки Excel, которые соответствуют полям системы. Обязательные поля отмечены звездочкой."
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />

        {excelStructure.sheets.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Выберите лист: </Text>
            <Select
              value={selectedSheet}
              onChange={setSelectedSheet}
              style={{ width: 200 }}
            >
              {excelStructure.sheets.map(sheet => (
                <Select.Option key={sheet.name} value={sheet.name}>
                  {sheet.name} ({sheet.rowCount} строк)
                </Select.Option>
              ))}
            </Select>
          </div>
        )}

        <Row gutter={24}>
          <Col span={12}>
            <Card title="Колонки Excel" size="small">
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {excelStructure.columns.map(column => (
                  <Card
                    key={column.letter}
                    size="small"
                    style={{ marginBottom: 8 }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Tag color="blue">{column.letter}</Tag>
                        <Text strong>{column.header}</Text>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          Образцы: {column.sampleData.slice(0, 2).join(', ')}
                          {column.sampleData.length > 2 && '...'}
                        </div>
                      </div>
                      <Select
                        placeholder="Выберите поле"
                        style={{ width: 140 }}
                        value={columnMapping[column.letter] || undefined}
                        onChange={(value) => handleColumnMapping(column.letter, value)}
                        allowClear
                      >
                        {SYSTEM_FIELDS.map(field => (
                          <Select.Option key={field.key} value={field.key}>
                            {field.label}
                            {field.required && <span style={{ color: 'red' }}>*</span>}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Поля системы" size="small">
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {SYSTEM_FIELDS.map(field => {
                  const mappedColumn = Object.keys(columnMapping).find(
                    key => columnMapping[key] === field.key
                  );
                  
                  return (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: 8 }}
                      bodyStyle={{ padding: 12 }}
                    >
                      <div>
                        <Text strong>
                          {field.label}
                          {field.required && <span style={{ color: 'red' }}>*</span>}
                        </Text>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          {field.description}
                        </div>
                        {mappedColumn && (
                          <div style={{ marginTop: 8 }}>
                            <Tag color="green">
                              Колонка {mappedColumn}
                              <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleColumnMapping(mappedColumn, '')}
                                style={{ marginLeft: 4, padding: 0, fontSize: 10 }}
                              />
                            </Tag>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderPreviewStep = () => {
    const columns = [
      ...Object.values(columnMapping).map(fieldKey => {
        const field = SYSTEM_FIELDS.find(f => f.key === fieldKey);
        return {
          title: field?.label || fieldKey,
          dataIndex: fieldKey,
          key: fieldKey,
          render: (value: any) => {
            if (fieldKey === 'deadline' && value) {
              return new Date(value).toLocaleDateString('he-IL');
            }
            if (fieldKey === 'priority' && value) {
              return <Tag color={value <= 2 ? 'red' : value <= 3 ? 'orange' : 'green'}>{value}</Tag>;
            }
            return value || '-';
          }
        };
      })
    ];

    return (
      <div>
        <Alert
          message="Предварительный просмотр данных"
          description={`Показаны первые ${previewData.length} записей из файла`}
          type="success"
          style={{ marginBottom: 16 }}
          showIcon
        />

        {previewData.length > 0 ? (
          <Table
            dataSource={previewData}
            columns={columns}
            pagination={false}
            size="small"
            scroll={{ x: true }}
            rowKey={(record, index) => index || 0}
          />
        ) : (
          <Empty description="Нет данных для предварительного просмотра" />
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined />
          Гибкая настройка импорта: {file?.name}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={
        <Space>
          <Button onClick={onCancel}>Отмена</Button>
          {currentStep === 1 && (
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handlePreview}
              loading={loading}
            >
              Предварительный просмотр
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirm}
            >
              Подтвердить импорт
            </Button>
          )}
        </Space>
      }
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Анализ файла" icon={<FileExcelOutlined />} />
        <Step title="Настройка колонок" icon={<SettingOutlined />} />
        <Step title="Предварительный просмотр" icon={<EyeOutlined />} />
      </Steps>

      {renderStepContent()}
    </Modal>
  );
};

export default FlexibleExcelColumnMapper;
