/**
 * @file: ExcelImportManager.tsx
 * @description: Компонент для управления Excel импортом
 * @created: 2025-07-02
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  FileExcelOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  InboxOutlined
} from '@ant-design/icons';
import {
  Button,
  Table,
  Card,
  Upload,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Pagination,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Divider,
  Typography,
  Tooltip,
  Alert
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

// Типы данных
interface ExcelFile {
  id: number;
  originalName: string;
  description: string;
  fileSize: number;
  rowsCount: number;
  sheetsCount: number;
  status: 'uploading' | 'parsed' | 'error' | 'processing';
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  headers?: string[];
}

interface ExcelFileData {
  file: ExcelFile;
  data: Record<string, any>[];
  totalRows: number;
  hasMore: boolean;
}

interface UploadOptions {
  description?: string;
  maxRows?: number;
  sheetIndex?: number;
  skipEmptyRows?: boolean;
  uploadedBy?: string;
}

interface Stats {
  totalFiles: number;
  totalSize: number;
  statusCounts: Record<string, number>;
  totalRows: number;
}

// Сервис для работы с API
class ExcelImportService {
  private baseUrl = '/api/excel-import';

  async uploadFile(file: File, options: UploadOptions = {}): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.description) formData.append('description', options.description);
    if (options.maxRows) formData.append('maxRows', options.maxRows.toString());
    if (options.sheetIndex !== undefined) formData.append('sheetIndex', options.sheetIndex.toString());
    if (options.skipEmptyRows !== undefined) formData.append('skipEmptyRows', options.skipEmptyRows.toString());

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.statusText}`);
    }

    return response.json();
  }

  async getFiles(page = 1, limit = 20, status?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseUrl}/files?${params}`);
    if (!response.ok) throw new Error('Ошибка получения списка файлов');
    return response.json();
  }

  async getFileData(id: number, offset = 0, limit = 100): Promise<ExcelFileData> {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/files/${id}/data?${params}`);
    if (!response.ok) throw new Error('Ошибка получения данных файла');
    return response.json();
  }

  async deleteFile(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/files/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Ошибка удаления файла');
  }

  async reparseFile(id: number, options: UploadOptions): Promise<any> {
    const response = await fetch(`${this.baseUrl}/files/${id}/reparse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!response.ok) throw new Error('Ошибка повторной обработки');
    return response.json();
  }

  async getStats(): Promise<Stats> {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error('Ошибка получения статистики');
    return response.json();
  }
}

const excelService = new ExcelImportService();

// Компонент статуса
const StatusTag: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'parsed':
        return { icon: <CheckCircleOutlined />, color: 'success', text: 'Обработан' };
      case 'processing':
        return { icon: <ClockCircleOutlined />, color: 'processing', text: 'Обработка' };
      case 'error':
        return { icon: <ExclamationCircleOutlined />, color: 'error', text: 'Ошибка' };
      default:
        return { icon: <LoadingOutlined />, color: 'default', text: 'Загрузка' };
    }
  };

  const { icon, color, text } = getStatusConfig(status);

  return (
    <Tag icon={icon} color={color}>
      {text}
    </Tag>
  );
};

// Компонент загрузки файла
const FileUploadSection: React.FC<{
  onUpload: (file: File, options: UploadOptions) => void;
  isUploading: boolean;
}> = ({ onUpload, isUploading }) => {
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUpload = async (file: File) => {
    const values = await form.validateFields();
    onUpload(file, values);
    return false; // Предотвращаем автоматическую загрузку Ant Design
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: handleUpload,
    showUploadList: false,
  };

  return (
    <Card title="Загрузка Excel файла" className="mb-6">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          skipEmptyRows: true,
          maxRows: 10000,
          sheetIndex: 0,
        }}
      >
        <Dragger {...uploadProps} disabled={isUploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            Нажмите или перетащите файл в эту область для загрузки
          </p>
          <p className="ant-upload-hint">
            Поддерживаются файлы Excel (.xlsx, .xls). Максимальный размер: 50MB
          </p>
        </Dragger>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="description"
              label="Описание файла"
            >
              <Input.TextArea 
                rows={3}
                placeholder="Опишите содержимое файла..."
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="link" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                icon={showAdvanced ? <LeftOutlined /> : <RightOutlined />}
              >
                {showAdvanced ? 'Скрыть' : 'Показать'} дополнительные настройки
              </Button>
              
              {showAdvanced && (
                <Card size="small">
                  <Form.Item
                    name="maxRows"
                    label="Максимальное количество строк"
                  >
                    <InputNumber
                      min={1}
                      max={100000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="sheetIndex"
                    label="Индекс листа"
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="skipEmptyRows"
                    label="Пропускать пустые строки"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

// Основной компонент
const ExcelImportManager: React.FC = () => {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<ExcelFile | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  // Загрузка списка файлов
  const loadFiles = useCallback(async (page = 1, status = '') => {
    setLoading(true);
    try {
      const response = await excelService.getFiles(page, pagination.pageSize, status);
      setFiles(response.files);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.total,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error('Ошибка загрузки списка файлов');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Загрузка статистики
  const loadStats = useCallback(async () => {
    try {
      const statsData = await excelService.getStats();
      setStats(statsData);
    } catch (error: any) {
      const errorMessage = error?.message || 'Неизвестная ошибка';
      console.error('Ошибка загрузки статистики:', error);
    }
  }, []);

  // Загрузка файла
  const handleUpload = async (file: File, options: UploadOptions) => {
    setUploading(true);
    try {
      const result = await excelService.uploadFile(file, {
        ...options,
        uploadedBy: 'current-user', // TODO: получать из контекста авторизации
      });
      
      message.success(`Файл "${file.name}" успешно загружен`);
      loadFiles(pagination.current, statusFilter);
      loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error(`Ошибка загрузки файла: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // Удаление файла
  const handleDelete = async (fileId: number, fileName: string) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: `Вы уверены, что хотите удалить файл "${fileName}"?`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await excelService.deleteFile(fileId);
          message.success('Файл удален');
          loadFiles(pagination.current, statusFilter);
          loadStats();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          message.error('Ошибка удаления файла');
        }
      },
    });
  };

  // Просмотр данных файла
  const handleViewData = async (file: ExcelFile) => {
    setSelectedFile(file);
    setDataLoading(true);
    setViewModalVisible(true);
    
    try {
      const result = await excelService.getFileData(file.id, 0, 100);
      setFileData(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      message.error('Ошибка загрузки данных файла');
      setFileData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Повторная обработка
  const handleReparse = async (fileId: number) => {
    Modal.confirm({
      title: 'Повторная обработка файла',
      content: 'Вы хотите переобработать файл с текущими настройками?',
      onOk: async () => {
        try {
          await excelService.reparseFile(fileId, {});
          message.success('Файл переобработан');
          loadFiles(pagination.current, statusFilter);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          message.error('Ошибка повторной обработки');
        }
      },
    });
  };

  // Инициализация
  useEffect(() => {
    loadFiles();
    loadStats();
  }, [loadFiles, loadStats]);

  // Колонки таблицы
  const columns = [
    {
      title: 'Имя файла',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text: string) => (
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || <Text type="secondary">Нет описания</Text>,
    },
    {
      title: 'Размер',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => {
        const mb = (size / 1024 / 1024).toFixed(2);
        return `${mb} MB`;
      },
    },
    {
      title: 'Строк',
      dataIndex: 'rowsCount',
      key: 'rowsCount',
    },
    {
      title: 'Листов',
      dataIndex: 'sheetsCount',
      key: 'sheetsCount',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Загружен',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: ExcelFile) => (
        <Space>
          <Tooltip title="Просмотреть данные">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewData(record)}
              disabled={record.status !== 'parsed'}
            />
          </Tooltip>
          
          <Tooltip title="Переобработать">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => handleReparse(record.id)}
              disabled={record.status === 'processing'}
            />
          </Tooltip>
          
          <Tooltip title="Удалить">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.originalName)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Колонки для отображения данных файла
  const dataColumns = selectedFile?.headers?.map((header: string) => ({
    title: header,
    dataIndex: header,
    key: header,
    render: (value: any) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    },
  })) || [];

  return (
    <div className="excel-import-manager">
      <Title level={2}>
        <FileExcelOutlined /> Управление Excel файлами
      </Title>

      {/* Статистика */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Всего файлов"
                value={stats.totalFiles}
                prefix={<FileExcelOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Общий размер"
                value={(stats.totalSize / 1024 / 1024).toFixed(2)}
                suffix="MB"
                prefix={<CloudUploadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Всего строк"
                value={stats.totalRows}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Обработано"
                value={stats.statusCounts.parsed || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Загрузка файла */}
      <FileUploadSection onUpload={handleUpload} isUploading={uploading} />

      {/* Фильтры */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col>
            <Text>Фильтр по статусу:</Text>
          </Col>
          <Col>
            <Select
              style={{ width: 200 }}
              placeholder="Все статусы"
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => {
                setStatusFilter(value || '');
                loadFiles(1, value || '');
              }}
            >
              <Option value="parsed">Обработан</Option>
              <Option value="processing">Обработка</Option>
              <Option value="error">Ошибка</Option>
              <Option value="uploading">Загрузка</Option>
            </Select>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadFiles(pagination.current, statusFilter)}
              loading={loading}
            >
              Обновить
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Таблица файлов */}
      <Card>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} файлов`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, pageSize: pageSize || 10 }));
              loadFiles(page, statusFilter);
            },
          }}
        />
      </Card>

      {/* Модальное окно просмотра данных */}
      <Modal
        title={`Данные файла: ${selectedFile?.originalName}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width="90%"
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
      >
        {selectedFile && (
          <div>
            <Alert
              message={`Показаны первые 100 строк из ${selectedFile.rowsCount} общих строк`}
              type="info"
              className="mb-4"
            />
            
            <Table
              columns={dataColumns}
              dataSource={fileData}
              rowKey={(record, index) => index?.toString() || '0'}
              loading={dataLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
              scroll={{ x: true }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export { ExcelImportManager };
export default ExcelImportManager;