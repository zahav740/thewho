/**
 * @file: ImprovedExcelUploader.tsx
 * @description: Улучшенный компонент загрузки Excel с фильтрацией и правильными статусами
 * @dependencies: antd, xlsx
 * @created: 2025-05-29
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  Card,
  Button,
  Progress,
  Alert,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Modal,
  Table,
  message,
  Spin,
  Input,
  Select,
  Checkbox,
  Tooltip,
  Badge,
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ExcelFile {
  file: File;
  data?: any[];
  headers?: string[];
  preview?: any[];
  filteredData?: any[];
  status: 'uploading' | 'done' | 'error' | 'processing';
  progress: number;
  error?: string;
  uploadResponse?: any;
}

interface ColumnFilter {
  column: string;
  values: string[];
  searchText?: string;
}

interface ImprovedExcelUploaderProps {
  onUpload?: (file: File, data?: any[]) => Promise<any>;
  onPreview?: (data: any[]) => void;
  onDownload?: (fileIndex: number) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  showColumnMapping?: boolean;
  columnMapping?: Record<string, string>;
  title?: string;
  description?: string;
  statusMapping?: Record<string, { color: string; text: string; canDownload?: boolean }>;
}

const ImprovedExcelUploader: React.FC<ImprovedExcelUploaderProps> = ({
  onUpload,
  onPreview,
  onDownload,
  maxFileSize = 10,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  showPreview = true,
  showColumnMapping = false,
  columnMapping = {},
  title = 'Загрузка Excel файлов',
  description = 'Перетащите файл сюда или нажмите для выбора',
  statusMapping = {
    'done': { color: 'success', text: 'Готов к скачиванию', canDownload: true },
    'error': { color: 'error', text: 'Ошибка' },
    'uploading': { color: 'processing', text: 'Загрузка' },
    'processing': { color: 'processing', text: 'Обработка' },
  }
}) => {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
  const [filters, setFilters] = useState<ColumnFilter[]>([]);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Симуляция чтения Excel файла с реалистичными данными
  const readExcelFile = useCallback(async (file: File): Promise<{ data: any[], headers: string[], preview: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Реалистичные данные для CRM системы
          const mockData = [
            { 
              id: 1,
              orderNumber: 'ORD-2025-001',
              customerName: 'ООО "Механика"',
              drawingNumber: 'DWG-001-Rev-A',
              quantity: 10,
              status: 'В производстве',
              priority: 'Высокий',
              dueDate: '2025-06-15',
              assignedTo: 'Иванов И.И.',
              notes: 'Срочный заказ'
            },
            { 
              id: 2,
              orderNumber: 'ORD-2025-002',
              customerName: 'ЗАО "Техпром"',
              drawingNumber: 'DWG-002-Rev-B',
              quantity: 25,
              status: 'Готов',
              priority: 'Средний',
              dueDate: '2025-06-20',
              assignedTo: 'Петров П.П.',
              notes: 'Стандартный заказ'
            },
            { 
              id: 3,
              orderNumber: 'ORD-2025-003',
              customerName: 'ИП Сидоров',
              drawingNumber: 'DWG-003-Rev-A',
              quantity: 5,
              status: 'Готов',
              priority: 'Низкий',
              dueDate: '2025-07-01',
              assignedTo: 'Сидоров С.С.',
              notes: 'Можно отложить'
            },
            { 
              id: 4,
              orderNumber: 'ORD-2025-004',
              customerName: 'ООО "Автодеталь"',
              drawingNumber: 'DWG-004-Rev-C',
              quantity: 50,
              status: 'Ожидание',
              priority: 'Высокий',
              dueDate: '2025-06-10',
              assignedTo: 'Козлов К.К.',
              notes: 'Ждем материалы'
            },
            { 
              id: 5,
              orderNumber: 'ORD-2025-005',
              customerName: 'ООО "Строймаш"',
              drawingNumber: 'DWG-005-Rev-A',
              quantity: 15,
              status: 'Готов',
              priority: 'Средний',
              dueDate: '2025-06-25',
              assignedTo: 'Новиков Н.Н.',
              notes: 'Проверить качество'
            }
          ];
          
          const headers = Object.keys(mockData[0]);
          resolve({
            data: mockData,
            headers,
            preview: mockData.slice(0, 5)
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const newFile: ExcelFile = {
      file,
      status: 'processing',
      progress: 0,
    };

    setFiles(prev => [...prev, newFile]);
    const fileIndex = files.length;

    try {
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { ...f, progress: 25 } : f
      ));

      const { data, headers, preview } = await readExcelFile(file);
      
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          data, 
          headers, 
          preview,
          filteredData: data,
          progress: 75 
        } : f
      ));

      if (onUpload) {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, status: 'uploading', progress: 90 } : f
        ));

        const response = await onUpload(file, data);
        
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { 
            ...f, 
            status: 'done', 
            progress: 100, 
            uploadResponse: response 
          } : f
        ));

        message.success(`Файл "${file.name}" успешно обработан и готов к скачиванию`);
      } else {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, status: 'done', progress: 100 } : f
        ));
      }
    } catch (error) {
      console.error('Ошибка обработки файла:', error);
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'error', 
          progress: 0, 
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        } : f
      ));
      message.error(`Ошибка обработки файла "${file.name}"`);
    }
  }, [files.length, onUpload, readExcelFile]);

  // Функция фильтрации данных
  const applyFilters = useCallback((fileIndex: number) => {
    const file = files[fileIndex];
    if (!file.data) return;

    let filteredData = [...file.data];

    // Применяем глобальный поиск
    if (globalSearch) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(globalSearch.toLowerCase())
        )
      );
    }

    // Применяем фильтры по колонкам
    filters.forEach(filter => {
      if (filter.values.length > 0) {
        filteredData = filteredData.filter(row =>
          filter.values.includes(String(row[filter.column]))
        );
      }
      if (filter.searchText) {
        filteredData = filteredData.filter(row =>
          String(row[filter.column]).toLowerCase().includes(filter.searchText!.toLowerCase())
        );
      }
    });

    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, filteredData } : f
    ));
  }, [files, filters, globalSearch]);

  // Получение уникальных значений для колонки
  const getUniqueColumnValues = useCallback((data: any[], column: string): string[] => {
    const values = data.map(row => String(row[column])).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, []);

  // Обработчик клика по колонке для фильтрации
  const handleColumnFilter = useCallback((column: string, fileIndex: number) => {
    const file = files[fileIndex];
    if (!file.data) return;

    const uniqueValues = getUniqueColumnValues(file.data, column);
    const existingFilter = filters.find(f => f.column === column);

    Modal.confirm({
      title: `Фильтр по колонке: ${column}`,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <Search
            placeholder={`Поиск в колонке ${column}`}
            style={{ marginBottom: 16 }}
            onChange={(e) => {
              const searchText = e.target.value;
              setFilters(prev => prev.map(f => 
                f.column === column ? { ...f, searchText } : f
              ));
            }}
          />
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <Checkbox.Group
              options={uniqueValues.map(value => ({ label: value, value }))}
              value={existingFilter?.values || []}
              onChange={(checkedValues) => {
                setFilters(prev => {
                  const newFilters = prev.filter(f => f.column !== column);
                  if (checkedValues.length > 0) {
                    newFilters.push({ column, values: checkedValues as string[] });
                  }
                  return newFilters;
                });
              }}
            />
          </div>
        </div>
      ),
      onOk: () => {
        applyFilters(fileIndex);
      },
      onCancel: () => {
        // Сбрасываем временные изменения
        setFilters(prev => prev.filter(f => f.column !== column));
      }
    });
  }, [files, filters, getUniqueColumnValues, applyFilters]);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: acceptedFormats.join(','),
    beforeUpload: (file) => {
      const isValidSize = file.size / 1024 / 1024 < maxFileSize;
      if (!isValidSize) {
        message.error(`Файл слишком большой! Максимальный размер: ${maxFileSize}MB`);
        return false;
      }

      const isValidFormat = acceptedFormats.some(format => 
        file.name.toLowerCase().endsWith(format.toLowerCase())
      );
      if (!isValidFormat) {
        message.error(`Неподдерживаемый формат! Поддерживаются: ${acceptedFormats.join(', ')}`);
        return false;
      }

      handleFileUpload(file);
      return false;
    },
    onDrop: (e) => {
      console.log('Файлы перетащены:', e.dataTransfer.files);
    },
  };

  const handlePreview = (index: number) => {
    setSelectedFileIndex(index);
    setPreviewModalVisible(true);
    onPreview?.(files[index].filteredData || files[index].data || []);
  };

  const handleDownload = (index: number) => {
    if (onDownload) {
      onDownload(index);
    } else {
      message.success(`Скачивание файла "${files[index].file.name}"`);
    }
  };

  const handleRemoveFile = (index: number) => {
    Modal.confirm({
      title: 'Удалить файл?',
      content: `Вы уверены, что хотите удалить файл "${files[index].file.name}"?`,
      onOk: () => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        message.success('Файл удален');
      },
    });
  };

  const handleRetry = (index: number) => {
    const file = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    handleFileUpload(file.file);
  };

  const clearAllFilters = () => {
    setFilters([]);
    setGlobalSearch('');
    files.forEach((_, index) => {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, filteredData: f.data } : f
      ));
    });
    message.success('Все фильтры очищены');
  };

  const getStatusColor = (status: string) => statusMapping[status]?.color || 'default';
  const getStatusText = (status: string) => statusMapping[status]?.text || status;
  const canDownload = (status: string) => statusMapping[status]?.canDownload || false;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'uploading': return <CloudUploadOutlined style={{ color: '#1890ff' }} />;
      case 'processing': return <Spin size="small" />;
      default: return <FileExcelOutlined />;
    }
  };

  // Создание колонок для таблицы превью
  const createPreviewColumns = (headers: string[], fileIndex: number): ColumnsType<any> => {
    return headers.map(header => ({
      title: (
        <div style={{ cursor: 'pointer', userSelect: 'none' }}>
          <Space>
            <span>{header}</span>
            <Tooltip title="Кликните для фильтрации">
              <FilterOutlined 
                onClick={() => handleColumnFilter(header, fileIndex)}
                style={{ 
                  color: filters.some(f => f.column === header) ? '#1890ff' : '#8c8c8c',
                  fontSize: '12px'
                }}
              />
            </Tooltip>
          </Space>
        </div>
      ),
      dataIndex: header,
      key: header,
      ellipsis: true,
      render: (text: any, record: any) => {
        // Особое выделение для статуса "Готов"
        if (header === 'status' && text === 'Готов') {
          return <Tag color="success">Готов к скачиванию</Tag>;
        }
        return text;
      }
    }));
  };

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Title level={4}>
          <FileExcelOutlined /> {title}
        </Title>
        <Paragraph type="secondary">{description}</Paragraph>

        <Dragger {...uploadProps} style={{ marginBottom: 24 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '18px', marginBottom: '8px' }}>
            Перетащите файлы сюда или нажмите для выбора
          </p>
          <p className="ant-upload-hint" style={{ color: '#666' }}>
            Поддерживаемые форматы: {acceptedFormats.join(', ')}<br/>
            Максимальный размер: {maxFileSize}MB<br/>
            <Text type="success">💡 Зеленый статус = готовый заказ, можно скачивать</Text>
          </p>
        </Dragger>

        {files.length > 0 && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5}>Загруженные файлы ({files.length})</Title>
              <Space>
                <Search
                  placeholder="Глобальный поиск по всем данным"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onSearch={() => files.forEach((_, index) => applyFilters(index))}
                  style={{ width: 300 }}
                />
                <Badge count={filters.length} size="small">
                  <Button 
                    icon={<ClearOutlined />}
                    onClick={clearAllFilters}
                    disabled={filters.length === 0 && !globalSearch}
                  >
                    Очистить фильтры
                  </Button>
                </Badge>
              </Space>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {files.map((file, index) => (
                <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Row align="middle" gutter={16}>
                    <Col flex="auto">
                      <Space>
                        {getStatusIcon(file.status)}
                        <div>
                          <Text strong>{file.file.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            {file.data && ` • ${file.data.length} строк`}
                            {file.filteredData && file.filteredData.length !== file.data?.length && 
                              ` • ${file.filteredData.length} отфильтровано`
                            }
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color={getStatusColor(file.status)}>
                        {getStatusText(file.status)}
                      </Tag>
                    </Col>
                    <Col>
                      <Space>
                        {file.status === 'done' && canDownload(file.status) && (
                          <Tooltip title="Скачать готовый заказ">
                            <Button 
                              type="primary"
                              size="small" 
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownload(index)}
                            >
                              Скачать
                            </Button>
                          </Tooltip>
                        )}
                        {file.status === 'done' && showPreview && (
                          <Button 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(index)}
                          >
                            Превью
                          </Button>
                        )}
                        {file.status === 'error' && (
                          <Button 
                            size="small" 
                            icon={<ReloadOutlined />}
                            onClick={() => handleRetry(index)}
                          >
                            Повтор
                          </Button>
                        )}
                        <Button 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveFile(index)}
                        >
                          Удалить
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                  
                  {file.progress > 0 && file.progress < 100 && (
                    <Progress 
                      percent={file.progress} 
                      size="small" 
                      style={{ marginTop: 8 }}
                      status={file.status === 'error' ? 'exception' : 'active'}
                    />
                  )}
                  
                  {file.error && (
                    <Alert 
                      message="Ошибка обработки"
                      description={file.error}
                      type="error"
                      style={{ marginTop: 8 }}
                    />
                  )}
                  
                  {file.uploadResponse && (
                    <Alert 
                      message="Результат обработки"
                      description={file.uploadResponse.message || 'Файл успешно обработан и готов к скачиванию'}
                      type="success"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>
              ))}
            </Space>
          </>
        )}
      </Card>

      {/* Модальное окно превью с фильтрацией */}
      <Modal
        title={
          <Space>
            <span>Превью файла: {selectedFileIndex >= 0 ? files[selectedFileIndex]?.file.name : ''}</span>
            {filters.length > 0 && <Badge count={filters.length} title="Активных фильтров" />}
          </Space>
        }
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={1200}
        footer={[
          <Button key="clear" onClick={clearAllFilters} disabled={filters.length === 0}>
            Очистить фильтры
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
      >
        {selectedFileIndex >= 0 && files[selectedFileIndex] && (
          <div>
            <Alert 
              message="Превью данных с фильтрацией"
              description={
                <div>
                  <div>Показано: {files[selectedFileIndex].filteredData?.length || 0} из {files[selectedFileIndex].data?.length || 0} строк</div>
                  <div style={{ marginTop: 8 }}>
                    <Text type="success">💡 Кликните на заголовок колонки с иконкой фильтра для настройки фильтрации</Text>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="warning">🟢 Заказы со статусом "Готов" можно скачивать</Text>
                  </div>
                </div>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={files[selectedFileIndex].filteredData || files[selectedFileIndex].preview}
              columns={createPreviewColumns(
                files[selectedFileIndex].headers || [], 
                selectedFileIndex
              )}
              size="small"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} записей`
              }}
              scroll={{ x: true }}
              bordered
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImprovedExcelUploader;