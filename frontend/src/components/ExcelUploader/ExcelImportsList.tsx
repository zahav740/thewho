/**
 * @file: ExcelImportsList.tsx
 * @description: Компонент для отображения списка Excel импортов
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip
} from 'antd';
import {
  FileExcelOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ExcelImport {
  id: number;
  filename: string;
  original_filename: string;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  headers_count: number;
  rows_count: number;
  upload_date: string;
  processed_date: string;
  imported_to_orders: boolean;
  imported_to_operations: boolean;
  error_message?: string;
}

export const ExcelImportsList: React.FC = () => {
  const [imports, setImports] = useState<ExcelImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedImport, setSelectedImport] = useState<ExcelImport | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [importDetails, setImportDetails] = useState<any>(null);

  useEffect(() => {
    loadImports();
  }, [page]);

  const loadImports = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/imports?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setImports(data.imports || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error('Ошибка загрузки списка импортов:', error);
      message.error(`Ошибка загрузки: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showImportDetails = async (importRecord: ExcelImport) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/imports/${importRecord.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const details = await response.json();
      setImportDetails(details);
      setSelectedImport(importRecord);
      setDetailsVisible(true);
    } catch (error: any) {
      console.error('Ошибка загрузки деталей импорта:', error);
      message.error(`Ошибка загрузки деталей: ${error.message}`);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      uploaded: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Загружен' },
      processing: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Обработка' },
      processed: { color: 'green', icon: <CheckCircleOutlined />, text: 'Обработан' },
      error: { color: 'red', icon: <CloseCircleOutlined />, text: 'Ошибка' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploaded;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getTargetTables = (importRecord: ExcelImport) => {
    const tables: string[] = [];
    if (importRecord.imported_to_orders) tables.push('Заказы');
    if (importRecord.imported_to_operations) tables.push('Операции');
    
    return tables.length > 0 ? (
      <Space>
        {tables.map(table => (
          <Tag key={table} color="blue">{table}</Tag>
        ))}
      </Space>
    ) : (
      <Text type="secondary">Не импортировано</Text>
    );
  };

  const columns = [
    {
      title: 'Файл',
      key: 'filename',
      render: (record: ExcelImport) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.original_filename}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: ExcelImport) => (
        <Space direction="vertical" size="small">
          {getStatusTag(record.status)}
          {record.error_message && (
            <Tooltip title={record.error_message}>
              <Text type="danger" style={{ fontSize: '12px' }}>
                <ExclamationCircleOutlined /> Ошибка
              </Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Структура',
      key: 'structure',
      render: (record: ExcelImport) => (
        <Space direction="vertical" size="small">
          <Text>Колонок: {record.headers_count || 0}</Text>
          <Text>Строк: {record.rows_count || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Импортировано в',
      key: 'imported_to',
      render: (record: ExcelImport) => getTargetTables(record),
    },
    {
      title: 'Даты',
      key: 'dates',
      render: (record: ExcelImport) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            Загружен: {new Date(record.upload_date).toLocaleString('ru-RU')}
          </Text>
          {record.processed_date && (
            <Text style={{ fontSize: '12px' }}>
              Обработан: {new Date(record.processed_date).toLocaleString('ru-RU')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: ExcelImport) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showImportDetails(record)}
          >
            Детали
          </Button>
        </Space>
      ),
    },
  ];

  // Статистика импортов
  const stats = {
    total: imports.length,
    processed: imports.filter(i => i.status === 'processed').length,
    processing: imports.filter(i => i.status === 'processing').length,
    errors: imports.filter(i => i.status === 'error').length,
  };

  return (
    <Card>
      <Title level={3}>
        <FileExcelOutlined /> История импорта Excel файлов
      </Title>
      
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Всего импортов"
            value={stats.total}
            prefix={<FileExcelOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Обработано"
            value={stats.processed}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="В обработке"
            value={stats.processing}
            prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Ошибки"
            value={stats.errors}
            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
      </Row>

      <Divider />

      {/* Кнопка обновления */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={loadImports}
          loading={loading}
        >
          Обновить список
        </Button>
      </div>

      {/* Таблица импортов */}
      <Table
        columns={columns}
        dataSource={imports}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total: total,
          pageSize: 20,
          onChange: setPage,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} импортов`,
        }}
        scroll={{ x: 800 }}
      />

      {/* Модальное окно с деталями импорта */}
      <Modal
        title={`Детали импорта: ${selectedImport?.original_filename}`}
        open={detailsVisible}
        onCancel={() => {
          setDetailsVisible(false);
          setSelectedImport(null);
          setImportDetails(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Закрыть
          </Button>
        ]}
      >
        {importDetails && (
          <div>
            {/* Информация об импорте */}
            <Card size="small" title="Информация об импорте" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical">
                    <Text><strong>ID:</strong> {selectedImport?.id}</Text>
                    <Text><strong>Статус:</strong> {getStatusTag(selectedImport?.status || 'uploaded')}</Text>
                    <Text><strong>Файл:</strong> {selectedImport?.original_filename}</Text>
                    <Text><strong>Размер структуры:</strong> {selectedImport?.headers_count} колонок, {selectedImport?.rows_count} строк</Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical">
                    <Text><strong>Загружен:</strong> {selectedImport?.upload_date ? new Date(selectedImport.upload_date).toLocaleString('ru-RU') : 'Н/Д'}</Text>
                    <Text><strong>Обработан:</strong> {selectedImport?.processed_date ? new Date(selectedImport.processed_date).toLocaleString('ru-RU') : 'Не обработан'}</Text>
                    <Text><strong>Импортировано в:</strong> {getTargetTables(selectedImport!)}</Text>
                  </Space>
                </Col>
              </Row>
              
              {selectedImport?.error_message && (
                <div style={{ marginTop: 16 }}>
                  <Text type="danger"><strong>Ошибка:</strong></Text>
                  <div style={{ 
                    background: '#fff2f0', 
                    border: '1px solid #ffccc7', 
                    borderRadius: '4px', 
                    padding: '8px', 
                    marginTop: '8px'
                  }}>
                    <Text type="danger">{selectedImport.error_message}</Text>
                  </div>
                </div>
              )}
            </Card>

            {/* Превью данных */}
            {importDetails.dataPreview && importDetails.dataPreview.length > 0 && (
              <Card size="small" title="Превью данных">
                <Table
                  dataSource={importDetails.dataPreview.slice(0, 10)}
                  columns={Object.keys(importDetails.dataPreview[0] || {}).map(key => ({
                    title: key,
                    dataIndex: 'cell_value',
                    key: key,
                    render: (_, record: any) => record.column_name === key ? record.cell_value : null,
                    ellipsis: true,
                    width: 150
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: 800, y: 300 }}
                  rowKey={(record, index) => `preview-${index}`}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ExcelImportsList;
