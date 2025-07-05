/**
 * @file: AdvancedExcelUploader.tsx
 * @description: Продвинутый компонент загрузки Excel с выбором колонок
 * @dependencies: antd, react, ExcelColumnMapper
 * @created: 2025-06-25
 */
import React, { useState, useCallback } from 'react';
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
  App,
  Spin,
  Steps,
  Statistic
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
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { UploadProps } from 'antd/es/upload/interface';
import ExcelColumnMapper from './ExcelColumnMapper';

// Добавляем CSS анимацию для кнопки "Готово"
const pulseButtonStyle = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
    }
    70% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
    }
  }
`;

// Добавляем стили в head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = pulseButtonStyle;
  document.head.appendChild(styleElement);
}

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface ExcelFile {
  file: File;
  data?: any[];
  headers?: string[];
  preview?: any[];
  status: 'uploaded' | 'analyzing' | 'configuring' | 'importing' | 'done' | 'error';
  progress: number;
  error?: string;
  importResult?: any;
  customMapping?: boolean;
}

interface ExcelImportSettings {
  sheetIndex: number;
  hasHeaders: boolean;
  startRow: number;
  columnMapping: any;
  colorFilters?: string[];
}

interface AdvancedExcelUploaderProps {
  onUpload?: (file: File, settings: ExcelImportSettings) => Promise<any>;
  onPreview?: (data: any[]) => void;
  maxFileSize?: number; // в MB
  acceptedFormats?: string[];
  showPreview?: boolean;
  title?: string;
  description?: string;
}

const AdvancedExcelUploader: React.FC<AdvancedExcelUploaderProps> = ({
  onUpload,
  onPreview,
  maxFileSize = 10,
  acceptedFormats = ['.xlsx', '.xls'],
  showPreview = true,
  title = 'Загрузка Excel файлов с выбором колонок',
  description = 'Перетащите файл сюда или нажмите для выбора. Настройте соответствие колонок перед импортом.',
}) => {
  const { message } = App.useApp();
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [columnMapperVisible, setColumnMapperVisible] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
  const [currentFileForMapping, setCurrentFileForMapping] = useState<File | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    const newFile: ExcelFile = {
      file,
      status: 'uploaded',
      progress: 0,
      customMapping: true
    };

    setFiles(prev => [...prev, newFile]);
    const fileIndex = files.length;

    try {
      console.log('📁 Файл загружен, готов к настройке:', file.name);
      
      // Обновляем статус - файл готов к настройке колонок
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'configuring',
          progress: 25 
        } : f
      ));

      message.success(`Файл "${file.name}" готов к настройке колонок`);
    } catch (error: any) {
      console.error('❌ Ошибка обработки файла:', error);
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'error', 
          progress: 0, 
          error: error.message || 'Неизвестная ошибка'
        } : f
      ));
      message.error(`Ошибка обработки файла "${file.name}"`);
    }
  }, [files.length]);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: acceptedFormats.join(','),
    beforeUpload: (file) => {
      console.log('📤 Загружаем файл:', file.name, 'Тип:', file.type, 'Размер:', file.size);
      
      // Проверка размера файла
      const isValidSize = file.size / 1024 / 1024 < maxFileSize;
      if (!isValidSize) {
        message.error(`Файл слишком большой! Максимальный размер: ${maxFileSize}MB`);
        return false;
      }

      // Проверка формата
      const isValidFormat = acceptedFormats.some(format => 
        file.name.toLowerCase().endsWith(format.toLowerCase())
      );
      if (!isValidFormat) {
        message.error(`Неподдерживаемый формат! Поддерживаются: ${acceptedFormats.join(', ')}`);
        return false;
      }

      handleFileUpload(file);
      return false; // Предотвращаем автоматическую загрузку
    },
    onDrop: (e) => {
      console.log('📥 Файлы перетащены:', e.dataTransfer.files);
    },
  };

  const handleConfigureColumns = (index: number) => {
    const file = files[index];
    setCurrentFileForMapping(file.file);
    setSelectedFileIndex(index);
    setColumnMapperVisible(true);
  };

  const handleColumnMappingConfirm = async (settings: ExcelImportSettings) => {
    if (!currentFileForMapping || selectedFileIndex === -1) return;
    
    setColumnMapperVisible(false);
    
    try {
      // Обновляем статус на "импорт"
      setFiles(prev => prev.map((f, i) => 
        i === selectedFileIndex ? { 
          ...f, 
          status: 'importing',
          progress: 50 
        } : f
      ));

      console.log('📥 Импорт с настройками:', settings);

      let result: any;
      if (onUpload) {
        // Используем пользовательский обработчик
        result = await onUpload(currentFileForMapping, settings);
      } else {
        // Используем стандартный API импорта
        result = await importWithCustomMapping(currentFileForMapping, settings);
      }

      // Обновляем файл с результатами
      setFiles(prev => prev.map((f, i) => 
        i === selectedFileIndex ? { 
          ...f, 
          status: 'done',
          progress: 100,
          importResult: result
        } : f
      ));

      message.success(`Файл "${currentFileForMapping.name}" успешно импортирован в список заказов (📋 Данные сохранены!)`);

      // Обновляем список заказов через глобальный callback
      if (window.refreshOrdersList) {
        setTimeout(() => {
          window.refreshOrdersList?.();
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Ошибка импорта с маппингом:', error);
      setFiles(prev => prev.map((f, i) => 
        i === selectedFileIndex ? { 
          ...f, 
          status: 'error',
          progress: 0,
          error: error.message || 'Неизвестная ошибка'
        } : f
      ));
      message.error(`Ошибка импорта файла "${currentFileForMapping.name}"`);
    } finally {
      setCurrentFileForMapping(null);
      setSelectedFileIndex(-1);
    }
  };

  const importWithCustomMapping = async (file: File, settings: ExcelImportSettings) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('settings', JSON.stringify(settings));

    const response = await fetch('/api/orders/import-excel-with-mapping', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
    }

    return await response.json();
  };

  const handlePreview = (index: number) => {
    console.log('👁️ Показываем превью для файла:', files[index].file.name);
    setSelectedFileIndex(index);
    setPreviewModalVisible(true);
    onPreview?.(files[index].data || []);
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

  // Новая функция для сохранения в список заказов
  const handleSaveToList = async (index: number) => {
    const file = files[index];
    
    if (!file.importResult) {
      message.warning('Нет данных для сохранения');
      return;
    }

    try {
      console.log('📋 Сохраняем данные в список заказов:', file.importResult);
      
      // Показываем сообщение о том что данные уже сохранены
      message.success({
        content: (
          <div>
            <div>🎉 <strong>Данные уже сохранены в списке заказов!</strong></div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Создано: {file.importResult.data.created || 0}, 
              Обновлено: {file.importResult.data.updated || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              📋 Обновляем список заказов...
            </div>
          </div>
        ),
        duration: 3
      });

      // Закрываем модальное окно импорта и обновляем страницу
      setTimeout(() => {
        // Если есть callback для обновления списка - используем его
        if (window.refreshOrdersList) {
          window.refreshOrdersList();
        } else {
          // Иначе перезагружаем страницу
          window.location.reload();
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Ошибка при сохранении:', error);
      message.error('Ошибка при сохранении в список заказов');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'error': return 'error';
      case 'importing': return 'processing';
      case 'analyzing': return 'processing';
      case 'configuring': return 'warning';
      case 'uploaded': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleOutlined />;
      case 'error': return <ExclamationCircleOutlined />;
      case 'importing': return <Spin size="small" />;
      case 'analyzing': return <Spin size="small" />;
      case 'configuring': return <SettingOutlined />;
      case 'uploaded': return <FileExcelOutlined />;
      default: return <FileExcelOutlined />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return 'Загружен';
      case 'analyzing': return 'Анализ';
      case 'configuring': return 'Настройка';
      case 'importing': return 'Импорт';
      case 'done': return 'Данные в списке заказов';
      case 'error': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const renderImportResults = (file: ExcelFile) => {
    if (!file.importResult) return null;

    const { data } = file.importResult;
    
    return (
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col span={6}>
          <Statistic
            title="Создано"
            value={data.created || 0}
            valueStyle={{ fontSize: 14, color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Обновлено"
            value={data.updated || 0}
            valueStyle={{ fontSize: 14, color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Всего строк"
            value={data.totalRows || 0}
            valueStyle={{ fontSize: 14 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Ошибки"
            value={data.errors?.length || 0}
            valueStyle={{ fontSize: 14, color: data.errors?.length > 0 ? '#ff4d4f' : '#52c41a' }}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Title level={4}>
          <FileExcelOutlined /> {title}
        </Title>
        <Paragraph type="secondary">{description}</Paragraph>
        
        <Alert
          message="🎯 Настраиваемый импорт Excel"
          description="Выберите любые колонки из вашего Excel файла и настройте их соответствие полям заказа. Система автоматически предложит оптимальные настройки."
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />

        <Steps size="small" style={{ marginBottom: 24 }}>
          <Step title="Загрузка" description="Выберите файл" icon={<InboxOutlined />} />
          <Step title="Настройка" description="Выберите колонки" icon={<SettingOutlined />} />
          <Step title="Импорт" description="Импорт данных" icon={<CloudUploadOutlined />} />
          <Step title="Готово" description="📋 Нажмите кнопку 'Готово'" icon={<CheckCircleOutlined />} />
        </Steps>

        <Dragger {...uploadProps} style={{ marginBottom: 24 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '18px', marginBottom: '8px' }}>
            Перетащите Excel файлы сюда или нажмите для выбора
          </p>
          <p className="ant-upload-hint" style={{ color: '#666' }}>
            Поддерживаемые форматы: {acceptedFormats.join(', ')}<br/>
            Максимальный размер: {maxFileSize}MB<br/>
            <strong>🔧 После загрузки настройте соответствие колонок</strong>
          </p>
        </Dragger>

        {files.length > 0 && (
          <>
            <Divider orientation="left">Файлы для импорта ({files.length})</Divider>
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
                            {file.customMapping && ' • Пользовательский маппинг'}
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
                        {file.status === 'configuring' && (
                        <Button 
                        type="primary"
                        size="small" 
                        icon={<SettingOutlined />}
                        onClick={() => handleConfigureColumns(index)}
                        >
                        🆕 Настроить колонки
                        </Button>
                        )}
                        {file.status === 'done' && (
                          <>
                            <Button 
                              type="primary"
                              size="small" 
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleSaveToList(index)}
                              style={{ 
                                backgroundColor: '#52c41a', 
                                borderColor: '#52c41a',
                                animation: 'pulse 2s infinite',
                                boxShadow: '0 0 0 0 rgba(82, 196, 26, 0.7)'
                              }}
                            >
                              📋 Готово - Данные в списке заказов
                            </Button>
                            {showPreview && (
                              <Button 
                                size="small" 
                                icon={<BarChartOutlined />}
                                onClick={() => handlePreview(index)}
                              >
                                Результаты
                              </Button>
                            )}
                          </>
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
                      style={{ marginTop: 8, fontSize: '12px' }}
                    />
                  )}
                  
                  {file.status === 'done' && renderImportResults(file)}
                </Card>
              ))}
            </Space>
          </>
        )}
      </Card>

      {/* Компонент для настройки колонок */}
      {currentFileForMapping && (
        <ExcelColumnMapper
          file={currentFileForMapping}
          visible={columnMapperVisible}
          onSettingsConfirm={handleColumnMappingConfirm}
          onCancel={() => {
            setColumnMapperVisible(false);
            setCurrentFileForMapping(null);
            setSelectedFileIndex(-1);
          }}
        />
      )}

      {/* Модальное окно результатов импорта */}
      <Modal
        title={`📊 Результаты импорта: ${selectedFileIndex >= 0 ? files[selectedFileIndex]?.file.name : ''}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
      >
        {selectedFileIndex >= 0 && files[selectedFileIndex]?.importResult && (
          <div>
            <Alert 
              message="✅ Импорт завершен успешно"
              description={files[selectedFileIndex].importResult.message}
              type="success"
              style={{ marginBottom: 16 }}
              showIcon
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Создано новых заказов"
                  value={files[selectedFileIndex].importResult.data.created}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Обновлено заказов"
                  value={files[selectedFileIndex].importResult.data.updated}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CloudUploadOutlined />}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Всего строк"
                  value={files[selectedFileIndex].importResult.data.totalRows}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Импортировано"
                  value={files[selectedFileIndex].importResult.data.importedRows}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Ошибки"
                  value={files[selectedFileIndex].importResult.data.errors?.length || 0}
                  valueStyle={{ 
                    color: (files[selectedFileIndex].importResult.data.errors?.length || 0) > 0 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
            </Row>

            {files[selectedFileIndex].importResult.data.errors?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Ошибки импорта:</Title>
                <Table
                  dataSource={files[selectedFileIndex].importResult.data.errors}
                  columns={[
                    {
                      title: 'Заказ',
                      dataIndex: 'order',
                      key: 'order',
                      width: 150
                    },
                    {
                      title: 'Ошибка',
                      dataIndex: 'error',
                      key: 'error',
                      ellipsis: true
                    }
                  ]}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  rowKey={(record: any, index?: number) => index || 0}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdvancedExcelUploader;
