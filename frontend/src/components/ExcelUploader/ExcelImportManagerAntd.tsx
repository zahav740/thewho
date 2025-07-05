/**
 * @file: ExcelImportManagerAntd.tsx
 * @description: Компонент для управления импортом Excel файлов с Ant Design
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Upload, 
  Select, 
  Table, 
  Modal, 
  Progress, 
  Alert, 
  Tag, 
  message,
  Row,
  Col,
  Typography,
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  EyeOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { format } from '../../utils/dateUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;

interface ExcelImport {
  id: number;
  filename: string;
  original_filename: string;
  upload_date: string;
  processed_date?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  error_message?: string;
  headers_count?: number;
  rows_count?: number;
  sheets_count?: number;
  imported_to_orders: boolean;
  imported_to_operations: boolean;
}

interface ImportFilter {
  id: number;
  name: string;
  description: string;
  target_table: string;
  is_active: boolean;
}

interface ImportResult {
  id: number;
  filename: string;
  status: string;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; error: string }>;
  headers: string[];
  rowsCount: number;
  dataPreview: any[];
}

export const ExcelImportManagerAntd: React.FC = () => {
  const [imports, setImports] = useState<ExcelImport[]>([]);
  const [filters, setFilters] = useState<ImportFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<number | undefined>();
  const [targetTable, setTargetTable] = useState('orders');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadImports();
    loadFilters();
  }, [currentPage]);

  useEffect(() => {
    loadFilters();
  }, [targetTable]);

  const loadImports = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/imports?page=${currentPage}&limit=20`);
      if (!response.ok) {
        console.warn('API endpoints not ready yet, using empty imports');
        setImports([]);
        return;
      }
      const data = await response.json();
      setImports(data.imports || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Ошибка загрузки импортов:', error);
      setImports([]); // Устанавливаем пустой массив по умолчанию
      message.error('API endpoints еще не готовы. Функция будет доступна после настройки backend.');
    }
  };

  const loadFilters = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/filters?targetTable=${targetTable}`);
      if (!response.ok) {
        console.warn('API endpoints not ready yet, using empty filters');
        setFilters([]);
        return;
      }
      const data = await response.json();
      setFilters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки фильтров:', error);
      setFilters([]); // Устанавливаем пустой массив по умолчанию
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const url = new URL(`${apiUrl}/excel-import-db/upload`);
      // URL уже содержит правильный хост и порт
      url.searchParams.append('targetTable', targetTable);
      if (selectedFilter) {
        url.searchParams.append('filterId', selectedFilter.toString());
      }

      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setImportResult(result);
      loadImports();
      
      message.success('Файл успешно загружен и обработан!');

    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error);
      message.error(`Ошибка загрузки файла: ${error?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleShowDetails = async (importId: number) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/imports/${importId}`);
      const data = await response.json();
      setDetailsData(data);
      setShowDetails(importId);
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
      message.error('Ошибка загрузки деталей импорта');
    }
  };

  const handleReImport = async (importId: number) => {
    if (!selectedFilter) {
      message.warning('Пожалуйста, выберите фильтр для повторного импорта');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/imports/${importId}/re-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetTable,
          filterId: selectedFilter,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setImportResult(result);
      loadImports();
      
      message.success('Повторный импорт выполнен успешно!');

    } catch (error: any) {
      console.error('Ошибка повторного импорта:', error);
      message.error(`Ошибка повторного импорта: ${error?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
      uploaded: { color: 'blue', text: 'Загружено', icon: <UploadOutlined /> },
      processing: { color: 'orange', text: 'Обработка', icon: <LoadingOutlined spin /> },
      processed: { color: 'green', text: 'Обработано', icon: <CheckCircleOutlined /> },
      error: { color: 'red', text: 'Ошибка', icon: <CloseCircleOutlined /> },
    };

    const config = statusConfig[status] || { color: 'default', text: status, icon: <FileTextOutlined /> };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      handleUpload(file);
      return false; // Предотвращаем автоматическую загрузку
    },
    showUploadList: false,
  };

  const columns = [
    {
      title: 'Файл',
      dataIndex: 'original_filename',
      key: 'filename',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Дата загрузки',
      dataIndex: 'upload_date',
      key: 'upload_date',
      render: (date: string) => format(new Date(date), 'dd.MM.yyyy HH:mm'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Строк',
      dataIndex: 'rows_count',
      key: 'rows_count',
      render: (count: number) => count || '-',
    },
    {
      title: 'Импорт в',
      key: 'imported_to',
      render: (record: ExcelImport) => (
        <div>
          {record.imported_to_orders && <Tag>Заказы</Tag>}
          {record.imported_to_operations && <Tag>Операции</Tag>}
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: ExcelImport) => (
        <div>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleShowDetails(record.id)}
          >
            Детали
          </Button>
          {record.status === 'processed' && (
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleReImport(record.id)}
              loading={loading}
            >
              Повторить
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <FileTextOutlined /> Импорт Excel файлов
        </Title>
        
        <Tabs defaultActiveKey="upload">
          <TabPane tab="Загрузка файла" key="upload">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Целевая таблица:</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={targetTable}
                    onChange={setTargetTable}
                  >
                    <Select.Option value="orders">Заказы</Select.Option>
                    <Select.Option value="operations">Операции</Select.Option>
                  </Select>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Фильтр импорта:</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={selectedFilter}
                    onChange={setSelectedFilter}
                    placeholder="Выберите фильтр (опционально)"
                    allowClear
                  >
                    {(filters && filters.length > 0) ? filters.map((filter) => (
                      <Select.Option key={filter.id} value={filter.id}>
                        {filter.name}
                      </Select.Option>
                    )) : (
                      <Select.Option disabled value="no-filters">
                        Нет доступных фильтров
                      </Select.Option>
                    )}
                  </Select>
                </div>
              </Col>
            </Row>

            <Divider />

            <Dragger {...uploadProps} disabled={loading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Нажмите или перетащите Excel файл в эту область для загрузки
              </p>
              <p className="ant-upload-hint">
                Поддерживаются файлы .xlsx и .xls. Максимальный размер: 50MB
              </p>
            </Dragger>

            {loading && uploadProgress > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text>Прогресс загрузки:</Text>
                <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
              </div>
            )}

            {importResult && (
              <Alert
                style={{ marginTop: 16 }}
                message="Импорт завершен успешно!"
                description={
                  <div>
                    <div>Файл: {importResult.filename}</div>
                    <div>Создано: {importResult.created}, Обновлено: {importResult.updated}, Пропущено: {importResult.skipped}</div>
                    <div>Обработано строк: {importResult.rowsCount}</div>
                    {importResult.errors.length > 0 && (
                      <div style={{ color: '#ff4d4f' }}>Ошибки: {importResult.errors.length}</div>
                    )}
                  </div>
                }
                type="success"
                showIcon
              />
            )}
          </TabPane>

          <TabPane tab="История импортов" key="history">
            <Table
              columns={columns}
              dataSource={imports}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                total: totalPages * 20,
                pageSize: 20,
                onChange: setCurrentPage,
                showSizeChanger: false,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Модальное окно с деталями */}
      <Modal
        title={`Детали импорта #${showDetails}`}
        open={showDetails !== null}
        onCancel={() => setShowDetails(null)}
        footer={null}
        width={800}
      >
        {detailsData && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Файл:</Text>
                <div>{detailsData.import?.original_filename}</div>
              </Col>
              <Col span={12}>
                <Text strong>Статус:</Text>
                <div>{getStatusTag(detailsData.import?.status)}</div>
              </Col>
              <Col span={12}>
                <Text strong>Дата загрузки:</Text>
                <div>{format(new Date(detailsData.import?.upload_date), 'dd.MM.yyyy HH:mm')}</div>
              </Col>
              <Col span={12}>
                <Text strong>Размер файла:</Text>
                <div>{detailsData.import?.file_size ? `${(detailsData.import.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}</div>
              </Col>
            </Row>

            {detailsData.import?.error_message && (
              <Alert
                style={{ marginTop: 16 }}
                message="Ошибка обработки"
                description={detailsData.import.error_message}
                type="error"
                showIcon
              />
            )}

            {detailsData.dataPreview && detailsData.dataPreview.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Превью данных:</Text>
                <Table
                  style={{ marginTop: 8 }}
                  size="small"
                  columns={[
                    { title: 'Лист', dataIndex: 'sheet_name', key: 'sheet' },
                    { title: 'Строка', dataIndex: 'row_number', key: 'row' },
                    { title: 'Колонка', dataIndex: 'column_name', key: 'column' },
                    { title: 'Значение', dataIndex: 'cell_value', key: 'value', ellipsis: true },
                  ]}
                  dataSource={detailsData.dataPreview.slice(0, 50)}
                  rowKey={(record: any, index?: number) => `preview-${index || 0}`}
                  pagination={false}
                  scroll={{ y: 300 }}
                />
                {detailsData.dataPreview.length > 50 && (
                  <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                    Показано первые 50 из {detailsData.dataPreview.length} ячеек
                  </Text>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExcelImportManagerAntd;
