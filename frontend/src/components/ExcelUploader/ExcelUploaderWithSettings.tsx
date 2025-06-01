/**
 * @file: ExcelUploaderWithSettings.tsx
 * @description: Компонент загрузки Excel с настройками импорта и цветовыми фильтрами
 * @dependencies: antd, xlsx, ImportSettingsModal
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
  Badge,
  Tooltip,
  Checkbox,
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
  SettingOutlined,
} from '@ant-design/icons';
import { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';
import ImportSettingsModal, { ImportSettings, ColorFilter, ColumnMapping } from './ImportSettingsModal';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface ExcelFileWithSettings {
  file: File;
  data?: any[];
  headers?: string[];
  preview?: any[];
  filteredData?: any[];
  colorFilteredData?: any[];
  status: 'uploading' | 'done' | 'error' | 'processing';
  progress: number;
  error?: string;
  uploadResponse?: any;
  importSettings?: ImportSettings;
}

interface ColumnFilter {
  column: string;
  values: string[];
  searchText?: string;
}

interface ExcelUploaderWithSettingsProps {
  onUpload?: (file: File, data?: any[], settings?: ImportSettings) => Promise<any>;
  onPreview?: (data: any[]) => void;
  onDownload?: (fileIndex: number) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  title?: string;
  description?: string;
  statusMapping?: Record<string, { color: string; text: string; canDownload?: boolean }>;
}

const ExcelUploaderWithSettings: React.FC<ExcelUploaderWithSettingsProps> = ({
  onUpload,
  onPreview,
  onDownload,
  maxFileSize = 10,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  showPreview = true,
  title = 'Загрузка Excel файлов с настройками',
  description = 'Перетащите файл сюда или нажмите для выбора',
  statusMapping = {
    'done': { color: 'success', text: 'Готов к скачиванию', canDownload: true },
    'error': { color: 'error', text: 'Ошибка' },
    'uploading': { color: 'processing', text: 'Загрузка' },
    'processing': { color: 'processing', text: 'Обработка' },
  }
}) => {
  const [files, setFiles] = useState<ExcelFileWithSettings[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
  const [filters, setFilters] = useState<ColumnFilter[]>([]);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showSettingsAfterUpload, setShowSettingsAfterUpload] = useState(true);
  const [pendingFileIndex, setPendingFileIndex] = useState<number>(-1);
  
  // Настройки импорта по умолчанию
  const [defaultImportSettings, setDefaultImportSettings] = useState<ImportSettings>({
    colorFilters: [
      { color: 'green', label: 'Зеленый (Приоритет 1)', description: 'Готовые заказы', priority: 1, selected: true },
      { color: 'yellow', label: 'Желтый (Приоритет 2)', description: 'Обычные заказы', priority: 2, selected: true },
      { color: 'red', label: 'Красный (Критический)', description: 'Критичные заказы', priority: 3, selected: true },
      { color: 'blue', label: 'Синий (Плановые)', description: 'Плановые заказы', priority: 4, selected: true },
    ],
    columnMapping: [
      { fieldName: 'Номер чертежа', excelColumn: 'Колонка C', description: 'Уникальный номер чертежа', required: true },
      { fieldName: 'Ревизия', excelColumn: 'Колонка D', description: 'Версия чертежа' },
      { fieldName: 'Количество', excelColumn: 'Колонка E', description: 'Количество изделий', required: true },
      { fieldName: 'Дедлайн', excelColumn: 'Колонка H', description: 'Срок выполнения' },
      { fieldName: 'Приоритет', excelColumn: 'Колонка K', description: 'Приоритет заказа (1-3)' },
    ],
    importOnlySelected: false,
  });

  // Симуляция чтения Excel файла с цветовыми данными
  const readExcelFileWithColors = useCallback(async (file: File): Promise<{ data: any[], headers: string[], preview: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Реалистичные данные с цветовыми статусами для CRM системы
          const mockData = [
            { 
              id: 1,
              orderNumber: 'ORD-2025-001',
              customerName: 'ООО "Механика"',
              drawingNumber: 'DWG-001-Rev-A',
              quantity: 10,
              status: 'Готов',
              priority: 'Высокий',
              dueDate: '2025-06-15',
              assignedTo: 'Иванов И.И.',
              notes: 'Готов к скачиванию',
              rowColor: 'green', // Зеленый = готовый заказ
              colorPriority: 1
            },
            { 
              id: 2,
              orderNumber: 'ORD-2025-002',
              customerName: 'ЗАО "Техпром"',
              drawingNumber: 'DWG-002-Rev-B',
              quantity: 25,
              status: 'В производстве',
              priority: 'Средний',
              dueDate: '2025-06-20',
              assignedTo: 'Петров П.П.',
              notes: 'Стандартный заказ',
              rowColor: 'yellow', // Желтый = обычный заказ
              colorPriority: 2
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
              notes: 'Готов к скачиванию',
              rowColor: 'green', // Зеленый = готовый заказ
              colorPriority: 1
            },
            { 
              id: 4,
              orderNumber: 'ORD-2025-004',
              customerName: 'ООО "Автодеталь"',
              drawingNumber: 'DWG-004-Rev-C',
              quantity: 50,
              status: 'Критичный',
              priority: 'Критичный',
              dueDate: '2025-06-10',
              assignedTo: 'Козлов К.К.',
              notes: 'Срочно! Критичные сроки',
              rowColor: 'red', // Красный = критичный заказ
              colorPriority: 3
            },
            { 
              id: 5,
              orderNumber: 'ORD-2025-005',
              customerName: 'ООО "Строймаш"',
              drawingNumber: 'DWG-005-Rev-A',
              quantity: 15,
              status: 'Запланирован',
              priority: 'Плановый',
              dueDate: '2025-06-25',
              assignedTo: 'Новиков Н.Н.',
              notes: 'Плановый заказ',
              rowColor: 'blue', // Синий = плановый заказ
              colorPriority: 4
            }
          ];
          
          const headers = Object.keys(mockData[0]).filter(key => key !== 'rowColor' && key !== 'colorPriority');
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

  // Применение цветовых фильтров
  const applyColorFilters = useCallback((data: any[], settings: ImportSettings): any[] => {
    if (!settings.importOnlySelected) {
      return data; // Если все цвета выбраны, возвращаем все данные
    }

    const selectedColors = settings.colorFilters
      .filter(filter => filter.selected)
      .map(filter => filter.color);

    return data.filter(row => selectedColors.includes(row.rowColor));
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const newFile: ExcelFileWithSettings = {
      file,
      status: 'processing',
      progress: 0,
      importSettings: defaultImportSettings,
    };

    setFiles(prev => [...prev, newFile]);
    const fileIndex = files.length;

    try {
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { ...f, progress: 25 } : f
      ));

      const { data, headers, preview } = await readExcelFileWithColors(file);
      
      // Применяем цветовые фильтры
      const colorFilteredData = applyColorFilters(data, defaultImportSettings);
      
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          data, 
          headers, 
          preview,
          filteredData: colorFilteredData,
          colorFilteredData,
          progress: 75 
        } : f
      ));

      if (onUpload) {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, status: 'uploading', progress: 90 } : f
        ));

        const response = await onUpload(file, colorFilteredData, defaultImportSettings);
        
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { 
            ...f, 
            status: 'done', 
            progress: 100, 
            uploadResponse: response 
          } : f
        ));

        const readyOrdersCount = colorFilteredData.filter(row => row.rowColor === 'green').length;
        message.success(`Файл "${file.name}" успешно обработан. Готовых заказов: ${readyOrdersCount}`);
        
        // Показываем настройки после загрузки
        if (showSettingsAfterUpload) {
          setPendingFileIndex(fileIndex);
          setSettingsModalVisible(true);
        }
      } else {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, status: 'done', progress: 100 } : f
        ));
        
        // Показываем настройки после загрузки
        if (showSettingsAfterUpload) {
          setPendingFileIndex(fileIndex);
          setSettingsModalVisible(true);
        }
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
  }, [files.length, onUpload, readExcelFileWithColors, applyColorFilters, defaultImportSettings]);

  const handleImportSettingsApply = useCallback((settings: ImportSettings) => {
    setDefaultImportSettings(settings);
    
    // Применяем новые настройки ко всем загруженным файлам
    setFiles(prev => prev.map(file => {
      if (file.data) {
        const colorFilteredData = applyColorFilters(file.data, settings);
        return {
          ...file,
          filteredData: colorFilteredData,
          colorFilteredData,
          importSettings: settings,
        };
      }
      return file;
    }));

    const totalFiles = files.length;
    const affectedFiles = pendingFileIndex >= 0 ? 1 : totalFiles;
    
    message.success(`Настройки импорта применены к ${affectedFiles} файлам`);
    
    // Сбрасываем подвешенный файл
    setPendingFileIndex(-1);
  }, [applyColorFilters, files.length, pendingFileIndex]);

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
  };

  const handlePreview = (index: number) => {
    setSelectedFileIndex(index);
    setPreviewModalVisible(true);
    onPreview?.(files[index].filteredData || files[index].data || []);
  };

  const handleDownload = (index: number) => {
    const file = files[index];
    const readyOrders = file.colorFilteredData?.filter(row => row.rowColor === 'green') || [];
    
    if (readyOrders.length === 0) {
      message.warning('В этом файле нет готовых заказов для скачивания');
      return;
    }

    if (onDownload) {
      onDownload(index);
    } else {
      message.success(`Скачивание ${readyOrders.length} готовых заказов из файла "${file.file.name}"`);
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

  const getRowColor = (record: any) => {
    const colorMap = {
      green: '#f6ffed',
      yellow: '#fffbe6', 
      red: '#fff2f0',
      blue: '#f0f5ff',
    };
    return colorMap[record.rowColor as keyof typeof colorMap] || '#ffffff';
  };

  // Создание колонок для таблицы превью
  const createPreviewColumns = (headers: string[], fileIndex: number): ColumnsType<any> => {
    return headers.map(header => ({
      title: header,
      dataIndex: header,
      key: header,
      ellipsis: true,
      render: (text: any, record: any) => {
        if (header === 'status' && record.rowColor === 'green') {
          return <Tag color="success">Готов к скачиванию</Tag>;
        }
        if (header === 'rowColor') {
          return null; // Скрываем техническую колонку
        }
        return text;
      }
    })).filter(col => col.dataIndex !== 'rowColor' && col.dataIndex !== 'colorPriority');
  };

  // Расширенный список колонок Excel от A до Z
  const availableColumns = [
    'Колонка A', 'Колонка B', 'Колонка C', 'Колонка D', 'Колонка E', 'Колонка F', 'Колонка G', 'Колонка H', 
    'Колонка I', 'Колонка J', 'Колонка K', 'Колонка L', 'Колонка M', 'Колонка N', 'Колонка O', 'Колонка P',
    'Колонка Q', 'Колонка R', 'Колонка S', 'Колонка T', 'Колонка U', 'Колонка V', 'Колонка W', 'Колонка X',
    'Колонка Y', 'Колонка Z'
  ];

  const totalReadyOrders = files.reduce((sum, file) => 
    sum + (file.colorFilteredData?.filter(row => row.rowColor === 'green').length || 0), 0
  );

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={4}>
              <FileExcelOutlined /> {title}
            </Title>
            <Paragraph type="secondary">{description}</Paragraph>
          </div>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsModalVisible(true)}
            type="default"
            size="large"
          >
            Настройки импорта
          </Button>
        </div>

        <Dragger {...uploadProps} style={{ marginBottom: 24 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '18px', marginBottom: '8px' }}>
            Перетащите файлы сюда или нажмите для выбора
          </p>
          <div className="ant-upload-hint" style={{ color: '#666' }}>
            <div>Поддерживаемые форматы: {acceptedFormats.join(', ')}</div>
            <div>Максимальный размер: {maxFileSize}MB</div>
            <Space direction="vertical" size="small">
            <Text type="success">🟢 Зеленые строки = готовые заказы (можно скачать, а можно не скачивать)</Text>
            <Text type="warning">🟡 Желтые строки = обычные заказы в работе</Text>
            <Text type="danger">🔴 Красные строки = критичные заказы (срочно!)</Text>
            <Text style={{ color: '#1890ff' }}>🔵 Синие строки = плановые заказы (без спешки)</Text>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                  <Checkbox
                    checked={showSettingsAfterUpload}
                    onChange={(e) => setShowSettingsAfterUpload(e.target.checked)}
                  >
                    <Text style={{ fontSize: '12px' }}>Показывать настройки после загрузки</Text>
                  </Checkbox>
                </div>
              </Space>
          </div>
        </Dragger>

        {files.length > 0 && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5}>
                Загруженные файлы ({files.length})
                {totalReadyOrders > 0 && (
                  <Badge count={totalReadyOrders} style={{ marginLeft: 8 }}>
                    <Tag color="success">Готовых заказов: {totalReadyOrders}</Tag>
                  </Badge>
                )}
              </Title>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {files.map((file, index) => {
                const readyOrdersCount = file.colorFilteredData?.filter(row => row.rowColor === 'green').length || 0;
                const totalOrdersCount = file.colorFilteredData?.length || 0;
                
                return (
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
                              {totalOrdersCount > 0 && ` • ${totalOrdersCount} заказов`}
                              {readyOrdersCount > 0 && (
                                <Text type="success"> • {readyOrdersCount} готовых</Text>
                              )}
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
                          {file.status === 'done' && readyOrdersCount > 0 && (
                            <Tooltip title={`Скачать ${readyOrdersCount} готовых заказов`}>
                              <Button 
                                type="primary"
                                size="small" 
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(index)}
                              >
                                Скачать готовые ({readyOrdersCount})
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
                        description={file.uploadResponse.message || 'Файл успешно обработан'}
                        type="success"
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Card>
                );
              })}
            </Space>
          </>
        )}
      </Card>

      {/* Модальное окно настроек импорта */}
      <ImportSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        onApply={handleImportSettingsApply}
        availableColumns={availableColumns}
        currentSettings={defaultImportSettings}
      />

      {/* Модальное окно превью с цветовым выделением */}
      <Modal
        title={`Превью файла: ${selectedFileIndex >= 0 ? files[selectedFileIndex]?.file.name : ''}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={1400}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
      >
        {selectedFileIndex >= 0 && files[selectedFileIndex] && (
          <div>
            <Alert 
              message="Превью данных с цветовой фильтрацией"
              description={
                <div>
                  <div>Показано: {files[selectedFileIndex].filteredData?.length || 0} из {files[selectedFileIndex].data?.length || 0} строк</div>
                  <div style={{ marginTop: 8 }}>
                    <Space size="small">
                      <Tag color="success">🟢 Зеленые = готовые заказы</Tag>
                      <Tag color="warning">🟡 Желтые = обычные заказы</Tag>
                      <Tag color="error">🔴 Красные = критичные заказы</Tag>
                      <Tag color="processing">🔵 Синие = плановые заказы</Tag>
                    </Space>
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
              rowClassName={(record) => {
                const colorMap = {
                  green: 'row-green',
                  yellow: 'row-yellow',
                  red: 'row-red',
                  blue: 'row-blue',
                };
                return colorMap[record.rowColor as keyof typeof colorMap] || '';
              }}
              style={{
                '.row-green': { backgroundColor: '#f6ffed' },
                '.row-yellow': { backgroundColor: '#fffbe6' },
                '.row-red': { backgroundColor: '#fff2f0' },
                '.row-blue': { backgroundColor: '#f0f5ff' },
              } as any}
            />
          </div>
        )}
      </Modal>

      <div>
        <style>
          {`
            .row-green { background-color: #f6ffed !important; }
            .row-yellow { background-color: #fffbe6 !important; }
            .row-red { background-color: #fff2f0 !important; }
            .row-blue { background-color: #f0f5ff !important; }
          `}
        </style>
      </div>
    </div>
  );
};

export default ExcelUploaderWithSettings;