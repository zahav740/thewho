/**
 * @file: InteractiveColumnMapper.tsx
 * @description: Интерактивный компонент для выбора и маппинга колонок Excel к БД
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Checkbox, 
  Select, 
  Button, 
  Upload, 
  Alert, 
  Typography,
  Space,
  Tag,
  Tooltip,
  Progress,
  Divider,
  message
} from 'antd';
import { 
  FileExcelOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface ExcelColumn {
  name: string;
  index: number;
  dataType: string;
  sampleValues: any[];
  totalValues: number;
  uniqueValues: number;
  fillRate: number;
  isEmpty: boolean;
  suggestedDbColumn: string | null;
}

interface DbColumn {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ColumnMapping {
  excelColumn: string;
  dbColumn: string | null;
  selected: boolean;
  dataType: string;
}

export const InteractiveColumnMapper: React.FC = () => {
  const [excelStructure, setExcelStructure] = useState<any>(null);
  const [dbSchema, setDbSchema] = useState<DbColumn[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [targetTable, setTargetTable] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [importing, setImporting] = useState(false);

  // Загружаем схему БД при изменении целевой таблицы
  useEffect(() => {
    loadDatabaseSchema();
  }, [targetTable]);

  const loadDatabaseSchema = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/database-schema/${targetTable}`);
      const schema = await response.json();
      setDbSchema(schema.columns || []);
    } catch (error) {
      console.error('Ошибка загрузки схемы БД:', error);
    }
  };

  const analyzeExcelFile = async (file: File) => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/excel-import-db/analyze-excel`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const structure = await response.json();
      // Сохраняем оригинальный файл для последующего импорта
      structure.originalFile = file;
      setExcelStructure(structure);
      
      // Создаем начальные маппинги
      const initialMappings: ColumnMapping[] = structure.columns.map((col: ExcelColumn) => ({
        excelColumn: col.name,
        dbColumn: col.suggestedDbColumn,
        selected: col.suggestedDbColumn !== null && !col.isEmpty,
        dataType: col.dataType
      }));
      
      setColumnMappings(initialMappings);
      setAnalysisComplete(true);
    } catch (error: any) {
      console.error('Ошибка анализа файла:', error);
      message.error(`Ошибка анализа файла: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnSelectionChange = (excelColumn: string, selected: boolean) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.excelColumn === excelColumn 
          ? { ...mapping, selected }
          : mapping
      )
    );
  };

  const handleDbColumnChange = (excelColumn: string, dbColumn: string | null) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.excelColumn === excelColumn 
          ? { ...mapping, dbColumn }
          : mapping
      )
    );
  };

  const handleImport = async () => {
    if (!excelStructure || !excelStructure.originalFile) {
      message.error('Файл не загружен');
      return;
    }

    const selectedMappings = columnMappings.filter(m => m.selected && m.dbColumn);
    
    if (selectedMappings.length === 0) {
      message.error('Выберите хотя бы одну колонку для импорта');
      return;
    }

    setImporting(true);
    try {
      // Создаем FormData с файлом
      const formData = new FormData();
      formData.append('file', excelStructure.originalFile);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      
      // Создаем фильтр на основе выбранных маппингов
      const columnMapping: Record<string, string> = {};
      selectedMappings.forEach(mapping => {
        columnMapping[mapping.excelColumn] = mapping.dbColumn!;
      });

      console.log('🚀 Импорт с маппингом:', columnMapping);

      // Используем базовый фильтр для целевой таблицы
      let filterId = targetTable === 'orders' ? 1 : 2;

      // Импортируем файл
      const importResponse = await fetch(`${apiUrl}/excel-import-db/upload?targetTable=${targetTable}&filterId=${filterId}`, {
        method: 'POST',
        body: formData,
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.message || 'Ошибка импорта');
      }

      const result = await importResponse.json();
      
      message.success(
        `Импорт успешно завершен! 
        Создано: ${result.created}, 
        Обновлено: ${result.updated}, 
        Пропущено: ${result.skipped}, 
        Ошибок: ${result.errors?.length || 0}`
      );
      
      // Показываем детали ошибок если есть
      if (result.errors && result.errors.length > 0) {
        console.log('Ошибки импорта:', result.errors);
        message.warning(`Обнаружены ошибки в ${result.errors.length} строках. Проверьте консоль для деталей.`);
      }
      
      // Обновляем список заказов если есть глобальная функция
      if (typeof window !== 'undefined' && (window as any).refreshOrdersList) {
        try {
          await (window as any).refreshOrdersList();
          console.log('✅ Список заказов обновлён после импорта');
        } catch (refreshError) {
          console.warn('⚠️ Не удалось обновить список заказов:', refreshError);
        }
      }
      
      // Сбрасываем состояние для нового импорта
      setAnalysisComplete(false);
      setExcelStructure(null);
      setColumnMappings([]);
      
    } catch (error: any) {
      console.error('Ошибка импорта:', error);
      message.error(`Ошибка импорта: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const getColumnIcon = (dataType: string) => {
    switch (dataType) {
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'text': return '📝';
      default: return '❓';
    }
  };

  const getDbColumnColor = (dbColumn: DbColumn) => {
    if (dbColumn.required) return 'red';
    return 'blue';
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      analyzeExcelFile(file);
      return false;
    },
    showUploadList: false,
  };

  const columns = [
    {
      title: 'Выбрать',
      key: 'select',
      width: 80,
      render: (record: any) => (
        <Checkbox
          checked={record.selected}
          onChange={(e) => handleColumnSelectionChange(record.excelColumn, e.target.checked)}
          disabled={record.isEmpty}
        />
      ),
    },
    {
      title: 'Колонка Excel',
      key: 'excelColumn',
      render: (record: any) => {
        const excelCol = excelStructure?.columns.find((c: ExcelColumn) => c.name === record.excelColumn);
        return (
          <Space direction="vertical" size="small">
            <Text strong>{record.excelColumn}</Text>
            <Space>
              <Tag>{getColumnIcon(record.dataType)} {record.dataType}</Tag>
              {excelCol && (
                <Tooltip title={`Заполнено: ${excelCol.fillRate}%, Уникальных: ${excelCol.uniqueValues}`}>
                  <Tag color={excelCol.isEmpty ? 'red' : excelCol.fillRate > 80 ? 'green' : 'orange'}>
                    {excelCol.fillRate}%
                  </Tag>
                </Tooltip>
              )}
            </Space>
            {excelCol?.sampleValues.length > 0 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Примеры: {excelCol.sampleValues.slice(0, 2).join(', ')}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Колонка БД',
      key: 'dbColumn',
      render: (record: any) => (
        <Select
          style={{ width: '100%' }}
          value={record.dbColumn}
          onChange={(value) => handleDbColumnChange(record.excelColumn, value)}
          placeholder="Выберите колонку БД"
          allowClear
          disabled={!record.selected}
        >
          {dbSchema.map(col => (
            <Select.Option key={col.name} value={col.name}>
              <Space>
                <Text>{col.name}</Text>
                <Tag color={getDbColumnColor(col)}>
                  {col.type} {col.required && '*'}
                </Tag>
              </Space>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Описание',
      key: 'description',
      render: (record: any) => {
        const dbCol = dbSchema.find(col => col.name === record.dbColumn);
        return dbCol ? (
          <Text type="secondary">{dbCol.description}</Text>
        ) : null;
      },
    },
  ];

  const selectedCount = columnMappings.filter(m => m.selected).length;
  const requiredColumns = dbSchema.filter(col => col.required);
  const mappedRequiredColumns = columnMappings.filter(m => 
    m.selected && m.dbColumn && requiredColumns.some(req => req.name === m.dbColumn)
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <FileExcelOutlined /> Интерактивный маппинг колонок
        </Title>
        
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Выбор целевой таблицы */}
          <div>
            <Text strong>Целевая таблица:</Text>
            <Select
              style={{ width: 200, marginLeft: 8 }}
              value={targetTable}
              onChange={setTargetTable}
            >
              <Select.Option value="orders">Заказы</Select.Option>
              <Select.Option value="operations">Операции</Select.Option>
            </Select>
          </div>

          {/* Загрузка файла */}
          {!analysisComplete && (
            <Card size="small">
              <Dragger {...uploadProps} style={{ padding: '20px' }}>
                <p className="ant-upload-drag-icon">
                  <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">
                  Загрузите Excel файл для анализа структуры
                </p>
                <p className="ant-upload-hint">
                  Поддерживаются файлы .xlsx и .xls
                </p>
              </Dragger>
              {loading && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Progress percent={100} status="active" showInfo={false} />
                  <Text>Анализируем структуру файла...</Text>
                </div>
              )}
            </Card>
          )}

          {/* Результат анализа */}
          {analysisComplete && excelStructure && (
            <>
              <Alert
                message="Анализ завершен!"
                description={`Найдено ${excelStructure.columns.length} колонок, ${excelStructure.analysis.totalRows} строк данных. Язык: ${excelStructure.analysis.detectedLanguage}`}
                type="success"
                showIcon
              />

              {/* Статистика */}
              <Card size="small">
                <Space>
                  <Text>Выбрано колонок: <Tag color="blue">{selectedCount}</Tag></Text>
                  <Text>Обязательных полей: <Tag color="red">{mappedRequiredColumns.length}/{requiredColumns.length}</Tag></Text>
                  {mappedRequiredColumns.length < requiredColumns.length && (
                    <Text type="warning">
                      <ExclamationCircleOutlined /> Не все обязательные поля сопоставлены
                    </Text>
                  )}
                </Space>
              </Card>

              {/* Таблица маппинга */}
              <Table
                columns={columns}
                dataSource={columnMappings}
                rowKey="excelColumn"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />

              <Divider />

              {/* Схема БД */}
              <Card size="small" title="Схема таблицы БД">
                <Space wrap>
                  {dbSchema.map(col => (
                    <Tag key={col.name} color={getDbColumnColor(col)}>
                      {col.name} ({col.type}) {col.required && '*'}
                    </Tag>
                  ))}
                </Space>
                <br /><br />
                <Text type="secondary">
                  <InfoCircleOutlined /> * - обязательные поля
                </Text>
              </Card>

              {/* Кнопка импорта */}
              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                  loading={importing}
                >
                  {importing ? 'Импортируем...' : `Импортировать выбранные колонки (${selectedCount})`}
                </Button>
              </div>

              {/* Кнопка сброса */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  onClick={() => {
                    setAnalysisComplete(false);
                    setExcelStructure(null);
                    setColumnMappings([]);
                  }}
                  disabled={importing}
                >
                  Загрузить новый файл
                </Button>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default InteractiveColumnMapper;
