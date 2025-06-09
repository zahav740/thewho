/**
 * @file: ExcelUploaderWithSettings.tsx
 * @description: ИСПРАВЛЕННЫЙ компонент загрузки Excel с настройками импорта и цветовыми фильтрами
 * @dependencies: antd, ImportSettingsModal
 * @created: 2025-05-29
 * @updated: 2025-06-09 // УБРАНЫ ЗАГЛУШКИ - ТОЛЬКО РЕАЛЬНЫЕ ДАННЫЕ
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

export interface ExcelUploaderWithSettingsProps {
  onUpload?: (file: File, data?: any[], settings?: ImportSettings) => Promise<any>;
  onPreview?: (data: any[]) => void;
  onDownload?: (fileIndex: number) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  title?: string;
  description?: string;
  statusMapping?: Record<string, { color: string; text: string; canDownload?: boolean }>;
  buttonProps?: {
    icon?: React.ReactNode;
    children?: React.ReactNode;
    type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
    size?: 'large' | 'middle' | 'small';
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  };
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
  },
  buttonProps
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

  // ИСПРАВЛЕНО: Реальное чтение Excel файла через API с правильной обработкой ошибок
  const readExcelFileWithColors = useCallback(async (file: File): Promise<{ data: any[], headers: string[], preview: any[] }> => {
    try {
      console.log('📂 РЕАЛЬНОЕ чтение Excel файла через API:', file.name, 'Размер:', file.size);
      
      // Создаем FormData для отправки файла через API
      const formData = new FormData();
      formData.append('file', file);
      
      // ИСПРАВЛЕНО: Используем полный URL для исключения проблем с proxy
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${API_URL}/files/excel/parse`, {
        method: 'POST',
        body: formData,
        // НЕ добавляем Content-Type - браузер сам установит правильный для FormData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка API response:', response.status, errorText);
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      const result = await response.json();
      
      console.log('📊 API вернул РЕАЛЬНЫЕ данные:', {
        headers: result.headers?.length || 0,
        rows: result.rows?.length || 0,
        sheetsCount: result.sheetsCount || 0
      });

      const headers: string[] = result.headers || [];
      const realData: any[] = result.rows || [];

      // Преобразуем реальные данные в формат для отображения
      const dataWithIds = realData.map((row, index) => {
        // Добавляем техническую информацию для совместимости с интерфейсом
        return {
          ...row,
          id: index + 1,
          // Если в реальных данных нет цветовой информации, определяем цвет по приоритету
          rowColor: determineRowColor(row),
          colorPriority: determineColorPriority(row)
        };
      });

      // Создаем превью (первые 5 строк)
      const preview = dataWithIds.slice(0, 5);

      console.log('✅ РЕАЛЬНЫЕ данные обработаны:', {
        headers: headers.length,
        rows: dataWithIds.length,
        preview: preview.length,
        firstRow: dataWithIds[0] || 'Нет данных',
        sampleData: preview.slice(0, 2) // Первые 2 строки для проверки
      });

      return {
        data: dataWithIds,
        headers,
        preview
      };
    } catch (error: any) {
      console.error('❌ Ошибка чтения РЕАЛЬНОГО Excel файла:', error);
      throw new Error(`Ошибка чтения Excel: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, []);

  // Функция определения цвета строки на основе реальных данных
  const determineRowColor = (row: any): string => {
    // Пытаемся определить цвет по различным полям
    const status = String(row.status || row.статус || '').toLowerCase();
    const priority = String(row.priority || row.приоритет || '').toLowerCase();
    
    // Логика определения цвета:
    if (status.includes('готов') || status.includes('ready') || status.includes('completed')) {
      return 'green'; // Готовые заказы
    } else if (status.includes('критич') || status.includes('срочн') || status.includes('critical') || priority.includes('критич') || priority === '1') {
      return 'red'; // Критичные заказы
    } else if (status.includes('план') || status.includes('plan') || priority.includes('план') || priority === '4') {
      return 'blue'; // Плановые заказы
    } else {
      return 'yellow'; // Обычные заказы по умолчанию
    }
  };

  // Функция определения приоритета по цвету
  const determineColorPriority = (row: any): number => {
    const color = determineRowColor(row);
    const priorityMap = { green: 1, red: 3, blue: 4, yellow: 2 };
    return priorityMap[color as keyof typeof priorityMap] || 2;
  };

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
      console.log('🔄 Начинаем обработку РЕАЛЬНОГО файла:', file.name);
      
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { ...f, progress: 25 } : f
      ));

      // Читаем РЕАЛЬНЫЙ файл через API
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
    } catch (error: any) {
      console.error('❌ Ошибка обработки РЕАЛЬНОГО файла:', error);
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'error', 
          progress: 0, 
          error: error.message || 'Неизвестная ошибка'
        } : f
      ));
      message.error(`Ошибка обработки файла "${file.name}": ${error.message}`);
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
      console.log('📤 Загружаем РЕАЛЬНЫЙ файл:', file.name, 'Тип:', file.type, 'Размер:', file.size);
      
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
    console.log('👁️ Показываем превью РЕАЛЬНОГО файла:', files[index].file.name);
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
            
            <Alert
              message="✅ Исправлено: Реальное чтение Excel файлов"
              description="Теперь превью показывает НАСТОЯЩИЕ данные из ваших Excel файлов через backend API"
              type="success"
              style={{ marginBottom: 16 }}
              showIcon
            />
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
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
              🎯 Превью покажет РЕАЛЬНЫЕ данные из вашего файла!
            </div>
            <Space direction="vertical" size="small" style={{ marginTop: '8px' }}>
              <Text type="success">🟢 Зеленые строки = готовые заказы (автоопределение по статусу)</Text>
              <Text type="warning">🟡 Желтые строки = обычные заказы</Text>
              <Text type="danger">🔴 Красные строки = критичные заказы</Text>
              <Text style={{ color: '#1890ff' }}>🔵 Синие строки = плановые заказы</Text>
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
                // Определяем количество заказов в зависимости от режима отображения
                const currentData = file.filteredData || file.colorFilteredData || [];
                const allData = file.data || [];
                const readyOrdersCount = currentData.filter(row => row.rowColor === 'green').length;
                const totalOrdersCount = currentData.length;
                const isShowingAll = !file.importSettings?.importOnlySelected;
                
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
                              {totalOrdersCount > 0 && (
                                <>
                                  {` • ${totalOrdersCount} строк`}
                                  {!isShowingAll && allData.length > totalOrdersCount && (
                                    <Text type="warning"> (фильтр из {allData.length})</Text>
                                  )}
                                </>
                              )}
                              {readyOrdersCount > 0 && (
                                <Text type="success"> • {readyOrdersCount} готовых</Text>
                              )}
                              {isShowingAll && allData.length > 0 && (
                                <Text style={{ color: '#1890ff' }}> • Показаны все</Text>
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
                          {file.status === 'done' && file.data && (
                            <Space direction="vertical" size="small">
                              <Space size="small">
                                <Tooltip title="Показать только выбранные строки (с цветовыми фильтрами)">
                                  <Button 
                                    size="small"
                                    icon={<FilterOutlined />}
                                    type={file.importSettings?.importOnlySelected ? "primary" : "default"}
                                    onClick={() => {
                                      const newSettings: ImportSettings = {
                                        ...defaultImportSettings,
                                        ...file.importSettings,
                                        importOnlySelected: true
                                      };
                                      const colorFilteredData = applyColorFilters(file.data!, newSettings);
                                      setFiles(prev => prev.map((f, i) => 
                                        i === index ? {
                                          ...f,
                                          importSettings: newSettings,
                                          filteredData: colorFilteredData,
                                          colorFilteredData
                                        } : f
                                      ));
                                      message.info(`Показаны выбранные строки (${colorFilteredData.length} из ${file.data!.length})`);
                                    }}
                                  >
                                    Выборочно ({file.filteredData?.length || 0})
                                  </Button>
                                </Tooltip>
                                
                                <Tooltip title="Показать все строки из файла">
                                  <Button 
                                    size="small"
                                    icon={<EyeOutlined />}
                                    type={!file.importSettings?.importOnlySelected ? "primary" : "default"}
                                    onClick={() => {
                                      const newSettings: ImportSettings = {
                                        ...defaultImportSettings,
                                        ...file.importSettings,
                                        importOnlySelected: false
                                      };
                                      const allData = file.data!;
                                      setFiles(prev => prev.map((f, i) => 
                                        i === index ? {
                                          ...f,
                                          importSettings: newSettings,
                                          filteredData: allData,
                                          colorFilteredData: allData
                                        } : f
                                      ));
                                      message.info(`Показаны все строки (${allData.length})`);
                                    }}
                                  >
                                    Все ({file.data?.length || 0})
                                  </Button>
                                </Tooltip>
                              </Space>
                              
                              <Space size="small">
                                {readyOrdersCount > 0 && (
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
                                {showPreview && (
                                  <Button 
                                    size="small" 
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview(index)}
                                  >
                                    Превью
                                  </Button>
                                )}
                              </Space>
                            </Space>
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

      {/* Модальное окно превью с РЕАЛЬНЫМИ данными */}
      <Modal
        title={`📄 Превью файла: ${selectedFileIndex >= 0 ? files[selectedFileIndex]?.file.name : ''}`}
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
              message="✅ Превью РЕАЛЬНЫХ данных из вашего Excel файла"
              description={
                <div>
                  <div>Показано: {files[selectedFileIndex].filteredData?.length || 0} из {files[selectedFileIndex].data?.length || 0} строк</div>
                  <div style={{ marginTop: 8 }}>
                    <Space size="small">
                      <Tag color="success">🟢 Зеленые = готовые заказы (автоопределение)</Tag>
                      <Tag color="warning">🟡 Желтые = обычные заказы</Tag>
                      <Tag color="error">🔴 Красные = критичные заказы</Tag>
                      <Tag color="processing">🔵 Синие = плановые заказы</Tag>
                    </Space>
                  </div>
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#1890ff' }}>
                    🎯 Это НАСТОЯЩИЕ данные из вашего Excel файла!
                  </div>
                </div>
              }
              type="success"
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