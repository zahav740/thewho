/**
 * @file: PdfUploader.tsx
 * @description: Исправленный компонент для загрузки PDF файлов с превью
 * @dependencies: antd, react, pdfApi
 * @created: 2025-06-21
 * @updated: 2025-06-21 - Исправлена генерация URL и добавлена диагностика
 */
import React, { useState } from 'react';
import {
  Upload,
  Button,
  Card,
  Space,
  message,
  Typography,
  Modal,
  Progress,
  Alert,
} from 'antd';
import {
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  BugOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import { useTranslation } from '../../../i18n';
import { pdfApi } from '../../../services/pdfApi';
import { PdfDebugViewer } from '../PdfDebugViewer';

const { Text } = Typography;

interface PdfUploaderProps {
  /** Текущий PDF файл (путь или URL) */
  pdfPath?: string;
  /** Callback при загрузке файла */
  onUpload?: (file: File) => Promise<void>;
  /** Callback при удалении файла */
  onRemove?: () => Promise<void>;
  /** Состояние загрузки */
  loading?: boolean;
  /** Отключить компонент */
  disabled?: boolean;
  /** Показать превью */
  showPreview?: boolean;
  /** Размер компонента */
  size?: 'small' | 'default' | 'large';
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  pdfPath,
  onUpload,
  onRemove,
  loading = false,
  disabled = false,
  showPreview = true,
  size = 'default',
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (file: File) => {
    if (!onUpload) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(file);

      // Завершение прогресса
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 500);

      message.success(t('pdf.upload_success'));
    } catch (error) {
      console.error('Ошибка загрузки PDF:', error);
      message.error(t('pdf.upload_error'));
      setUploadProgress(0);
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    Modal.confirm({
      title: t('pdf.remove_confirm_title'),
      content: t('pdf.remove_confirm_content'),
      okText: t('pdf.remove_yes'),
      cancelText: t('pdf.remove_no'),
      okType: 'danger',
      onOk: async () => {
        setRemoving(true);
        try {
          await onRemove();
          message.success(t('pdf.remove_success'));
        } catch (error) {
          console.error('Ошибка удаления PDF:', error);
          message.error(t('pdf.remove_error'));
        } finally {
          setRemoving(false);
        }
      },
    });
  };

  const uploadProps: UploadProps = {
    accept: '.pdf',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      // Проверка типа файла
      const isPdf = file.type === 'application/pdf';
      if (!isPdf) {
        message.error(t('pdf.wrong_format'));
        return false;
      }

      // Проверка размера файла (100MB)
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error(t('pdf.size_limit'));
        return false;
      }

      handleUpload(file);
      return false; // Предотвращаем автоматическую загрузку
    },
    disabled: disabled || loading || uploading,
  };

  const cardSize = size === 'small' ? 'small' : 'default';
  const buttonSize = size === 'large' ? 'large' : (size === 'small' ? 'small' : 'middle');

  // ✅ ИСПРАВЛЕНО: Используем правильную функцию из pdfApi
  const getPdfUrl = (pdfPath: string) => {
    console.log('🔍 Generating PDF URL for path:', pdfPath);
    const url = pdfApi.getPdfUrlByPath(pdfPath);
    console.log('📄 Generated PDF URL:', url);
    return url;
  };

  const getFileName = (pdfPath: string) => {
    return pdfPath.split('/').pop() || pdfPath;
  };

  return (
    <Card
      size={cardSize}
      title={
        <Space>
          <FilePdfOutlined />
          <Text strong>{t('pdf.title')}</Text>
        </Space>
      }
      style={{ width: '100%' }}
      extra={
        pdfPath && (
          <Button
            type="text"
            size="small"
            icon={<BugOutlined />}
            onClick={() => setPreviewVisible(true)}
            title="Диагностика PDF"
          />
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Состояние загрузки */}
        {uploading && (
          <Alert
            message={t('pdf.uploading')}
            description={
              <Progress
                percent={uploadProgress}
                size="small"
                status="active"
              />
            }
            type="info"
            showIcon
          />
        )}

        {/* Текущий файл */}
        {pdfPath && !uploading && (
          <Card
            size="small"
            style={{
              backgroundColor: '#f6ffed',
              borderColor: '#b7eb8f',
              borderRadius: '8px',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <FilePdfOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                  <Text strong>{getFileName(pdfPath)}</Text>
                </Space>
                <Space>
                  {showPreview && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setPreviewVisible(true)}
                      title={t('pdf.preview')}
                    />
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = getPdfUrl(pdfPath);
                      link.target = '_blank';
                      link.click();
                    }}
                    title={t('pdf.download')}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemove}
                    loading={removing}
                    title={t('pdf.remove')}
                  />
                </Space>
              </Space>
              
              {showPreview && (
                <div
                  style={{
                    width: '100%',
                    height: '120px',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewVisible(true)}
                >
                  <Space direction="vertical" align="center">
                    <FilePdfOutlined style={{ fontSize: '32px', color: '#666' }} />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {t('pdf.click_to_preview')}
                    </Text>
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        )}

        {/* Кнопка загрузки */}
        {!pdfPath && (
          <Upload {...uploadProps}>
            <Button
              type="dashed"
              icon={<UploadOutlined />}
              size={buttonSize}
              block
              loading={uploading}
              disabled={disabled || loading}
            >
              {t('pdf.upload_button')}
            </Button>
          </Upload>
        )}

        {/* Замена файла */}
        {pdfPath && !uploading && (
          <Upload {...uploadProps}>
            <Button
              type="default"
              icon={<UploadOutlined />}
              size={buttonSize}
              block
              disabled={disabled || loading || removing}
            >
              {t('pdf.replace_button')}
            </Button>
          </Upload>
        )}

        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
          {t('pdf.format_hint')}
        </Text>
      </Space>

      {/* ✅ ИСПРАВЛЕНО: Используем PdfDebugViewer вместо обычного Modal */}
      {pdfPath && (
        <PdfDebugViewer
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          pdfUrl={getPdfUrl(pdfPath)}
          fileName={getFileName(pdfPath)}
          allowDownload={true}
        />
      )}
    </Card>
  );
};
