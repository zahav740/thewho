/**
 * @file: PdfUpload.tsx
 * @description: Компонент для загрузки PDF файлов с превью
 * @dependencies: antd, react
 * @created: 2025-06-21
 */
import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Space, message } from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  InboxOutlined 
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import { useTranslation } from '../../hooks/useTranslation';
import { PdfViewer } from './PdfViewer';
import { PdfDebugViewer } from './PdfDebugViewer';
import { SimplePdfViewer } from './SimplePdfViewer';

const { Dragger } = Upload;
const { Text } = Typography;

interface PdfUploadProps {
  value?: string; // URL существующего PDF
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  disabled?: boolean;
  showPreview?: boolean;
  accept?: string;
  maxSize?: number; // в MB
}

export const PdfUpload: React.FC<PdfUploadProps> = ({
  value,
  onChange,
  onRemove,
  disabled = false,
  showPreview = true,
  accept = '.pdf,application/pdf',
  maxSize = 100, // 100MB по умолчанию
}) => {
  const { t } = useTranslation();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);
    
    if (info.file.status === 'done' || info.file.originFileObj) {
      const file = info.file.originFileObj;
      if (file && onChange) {
        onChange(file);
      }
    }
  };

  const handleRemove = () => {
    setFileList([]);
    if (onRemove) {
      onRemove();
    }
    if (onChange) {
      onChange(null);
    }
  };

  const beforeUpload = (file: File) => {
    const isPdf = file.type === 'application/pdf';
    if (!isPdf) {
      message.error('Можно загружать только PDF файлы!');
      return false;
    }

    const isValidSize = file.size / 1024 / 1024 < maxSize;
    if (!isValidSize) {
      message.error(`Размер файла не должен превышать ${maxSize}MB!`);
      return false;
    }

    return false; // Предотвращаем автоматическую загрузку
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const getPreviewUrl = () => {
    if (value) {
      return value;
    }
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      return URL.createObjectURL(fileList[0].originFileObj);
    }
    
    return '';
  };

  const getFileName = () => {
    if (fileList.length > 0) {
      return fileList[0].name;
    }
    
    if (value) {
      return value.split('/').pop() || 'document.pdf';
    }
    
    return 'document.pdf';
  };

  const hasFile = value || fileList.length > 0;

  return (
    <>
      <div style={{ width: '100%' }}>
        {!hasFile ? (
          <Dragger
            accept={accept}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            showUploadList={false}
            disabled={disabled}
            style={{ padding: '20px' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Нажмите или перетащите PDF файл для загрузки
            </p>
            <p className="ant-upload-hint">
              Поддерживаются только PDF файлы размером до {maxSize}MB
            </p>
          </Dragger>
        ) : (
          <Card 
            size="small"
            style={{ width: '100%' }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center">
                  <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div>
                    <Text strong>{getFileName()}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      PDF документ
                    </Text>
                  </div>
                </Space>
                
                <Space>
                  {showPreview && (
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={handlePreview}
                      title="Просмотр"
                    />
                  )}
                  {!disabled && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemove}
                      title="Удалить"
                    />
                  )}
                </Space>
              </Space>

              {!disabled && (
                <Upload
                  accept={accept}
                  beforeUpload={beforeUpload}
                  onChange={handleChange}
                  showUploadList={false}
                  disabled={disabled}
                  style={{ width: '100%' }}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    style={{ width: '100%' }}
                    size="small"
                  >
                    Заменить файл
                  </Button>
                </Upload>
              )}
            </Space>
          </Card>
        )}
      </div>

      {/* Модальное окно для просмотра PDF с диагностикой */}
      <PdfDebugViewer
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        pdfUrl={getPreviewUrl()}
        fileName={getFileName()}
        allowDownload={true}
      />

      {/* Альтернативный простой просмотрщик */}
      {/* 
      <SimplePdfViewer
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        pdfUrl={getPreviewUrl()}
        fileName={getFileName()}
      />
      */}
    </>
  );
};