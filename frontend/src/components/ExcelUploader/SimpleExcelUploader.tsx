/**
 * @file: SimpleExcelUploader.tsx
 * @description: Простой загрузчик Excel файлов без зависимости от ExcelJS
 * @dependencies: antd
 * @created: 2025-06-08
 */
import React, { useState, useCallback } from 'react';
import {
  Upload,
  Card,
  Button,
  Alert,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  message,
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { UploadProps } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

interface SimpleExcelFile {
  file: File;
  status: 'done' | 'error';
  error?: string;
}

interface SimpleExcelUploaderProps {
  onUpload?: (file: File) => Promise<any>;
  maxFileSize?: number; // в MB
  acceptedFormats?: string[];
  title?: string;
  description?: string;
}

const SimpleExcelUploader: React.FC<SimpleExcelUploaderProps> = ({
  onUpload,
  maxFileSize = 10,
  acceptedFormats = ['.xlsx', '.xls'],
  title = 'Загрузка Excel файлов',
  description = 'Перетащите файл сюда или нажмите для выбора',
}) => {
  const [files, setFiles] = useState<SimpleExcelFile[]>([]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      if (onUpload) {
        await onUpload(file);
      }
      
      const newFile: SimpleExcelFile = {
        file,
        status: 'done',
      };

      setFiles(prev => [...prev, newFile]);
      message.success(`Файл "${file.name}" успешно загружен`);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      const newFile: SimpleExcelFile = {
        file,
        status: 'error',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
      setFiles(prev => [...prev, newFile]);
      message.error(`Ошибка загрузки файла "${file.name}"`);
    }
  }, [onUpload]);

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

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    message.success('Файл удален');
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
            <Alert
              message="Загруженные файлы"
              description={`Загружено ${files.length} файлов`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {files.map((file, index) => (
                <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Row align="middle" gutter={16}>
                    <Col flex="auto">
                      <Space>
                        {file.status === 'done' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <FileExcelOutlined />}
                        <div>
                          <Text strong>{file.file.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color={file.status === 'done' ? 'success' : 'error'}>
                        {file.status === 'done' ? 'Готов' : 'Ошибка'}
                      </Tag>
                    </Col>
                    <Col>
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFile(index)}
                      >
                        Удалить
                      </Button>
                    </Col>
                  </Row>
                  
                  {file.error && (
                    <Alert 
                      message="Ошибка загрузки"
                      description={file.error}
                      type="error"
                      style={{ marginTop: 8, fontSize: '12px' }}
                    />
                  )}
                </Card>
              ))}
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default SimpleExcelUploader;