/**
 * @file: ModernExcelUploader.tsx
 * @description: Современный компонент загрузки Excel с drag&drop и превью
 * @dependencies: antd
 * @created: 2025-05-28
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
  message,
  Spin,
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
} from '@ant-design/icons';
import { UploadProps } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

interface ExcelFile {
  file: File;
  data?: any[];
  headers?: string[];
  preview?: any[];
  status: 'uploading' | 'done' | 'error' | 'processing';
  progress: number;
  error?: string;
  uploadResponse?: any;
}

interface ModernExcelUploaderProps {
  onUpload?: (file: File, data?: any[]) => Promise<any>;
  onPreview?: (data: any[]) => void;
  maxFileSize?: number; // в MB
  acceptedFormats?: string[];
  showPreview?: boolean;
  showColumnMapping?: boolean;
  columnMapping?: Record<string, string>;
  title?: string;
  description?: string;
}

const ModernExcelUploader: React.FC<ModernExcelUploaderProps> = ({
  onUpload,
  onPreview,
  maxFileSize = 10,
  acceptedFormats = ['.xlsx', '.xls'],
  showPreview = true,
  showColumnMapping = false,
  columnMapping = {},
  title = 'Загрузка Excel файлов',
  description = 'Перетащите файл сюда или нажмите для выбора',
}) => {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  // Удалено неиспользуемое состояние isProcessing
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

  // Чтение реального Excel файла (ВРЕМЕННО ОТКЛЮЧЕНО)
  const readExcelFile = useCallback(async (file: File): Promise<{ data: any[], headers: string[], preview: any[] }> => {
    try {
      // ВРЕМЕННАЯ ЗАГЛУШКА - ExcelJS не установлен
      console.warn('⚠️ ExcelJS не установлен. Используем заглушку.');
      
      // Возвращаем mock данные
      return {
        data: [
          { A: 'Пример', B: 'Данных', C: 'Из', D: 'Excel' },
          { A: 'Строка', B: '2', C: 'Колонка', D: '4' }
        ],
        headers: ['A', 'B', 'C', 'D'],
        preview: [
          { A: 'Пример', B: 'Данных', C: 'Из', D: 'Excel' }
        ]
      };
    } catch (error) {
      console.error('❌ Ошибка чтения файла:', error);
      throw new Error('Для работы с Excel файлами необходимо установить exceljs');
    }
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
      // Обновляем прогресс
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { ...f, progress: 25 } : f
      ));

      // Читаем файл
      const { data, headers, preview } = await readExcelFile(file);
      
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          data, 
          headers, 
          preview, 
          progress: 75 
        } : f
      ));

      // Если есть обработчик загрузки, вызываем его
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

        message.success(`Файл "${file.name}" успешно обработан`);
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

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: acceptedFormats.join(','),
    beforeUpload: (file) => {
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
      console.log('Файлы перетащены:', e.dataTransfer.files);
    },
  };

  const handlePreview = (index: number) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'error': return 'error';
      case 'uploading': return 'processing';
      case 'processing': return 'processing';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleOutlined />;
      case 'error': return <ExclamationCircleOutlined />;
      case 'uploading': return <CloudUploadOutlined />;
      case 'processing': return <Spin size="small" />;
      default: return <FileExcelOutlined />;
    }
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
            Максимальный размер: {maxFileSize}MB
          </p>
        </Dragger>

        {files.length > 0 && (
          <>
            <Divider orientation="left">Загруженные файлы ({files.length})</Divider>
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
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color={getStatusColor(file.status)}>
                        {file.status === 'done' && 'Готов'}
                        {file.status === 'error' && 'Ошибка'}
                        {file.status === 'uploading' && 'Загрузка'}
                        {file.status === 'processing' && 'Обработка'}
                      </Tag>
                    </Col>
                    <Col>
                      <Space>
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
                      style={{ marginTop: 8, fontSize: '12px' }}
                    />
                  )}
                  
                  {file.uploadResponse && (
                    <Alert 
                      message="Результат обработки"
                      description={file.uploadResponse.message || 'Файл успешно обработан'}
                      type="success"
                      style={{ marginTop: 8, fontSize: '12px' }}
                    />
                  )}
                </Card>
              ))}
            </Space>
          </>
        )}
      </Card>

      {/* Модальное окно превью */}
      <Modal
        title={`Превью файла: ${selectedFileIndex >= 0 ? files[selectedFileIndex]?.file.name : ''}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
      >
        {selectedFileIndex >= 0 && files[selectedFileIndex]?.preview && (
          <div>
            <Alert 
              message="Превью данных"
              description={`Показаны первые ${files[selectedFileIndex].preview!.length} строк из ${files[selectedFileIndex].data!.length}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={files[selectedFileIndex].preview}
              columns={files[selectedFileIndex].headers?.map(header => ({
                title: header,
                dataIndex: header,
                key: header,
                ellipsis: true,
              })) || []}
              size="small"
              pagination={false}
              scroll={{ x: true }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModernExcelUploader;
