/**
 * @file: PdfViewer.tsx
 * @description: Компонент для просмотра PDF файлов в модальном окне
 * @dependencies: antd, react
 * @created: 2025-06-21
 */
import React, { useState } from 'react';
import { Modal, Spin, Alert, Button } from 'antd';
import { CloseOutlined, DownloadOutlined, ExpandOutlined } from '@ant-design/icons';
import { useTranslation } from '../../hooks/useTranslation';

interface PdfViewerProps {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName?: string;
  allowDownload?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  visible,
  onClose,
  pdfUrl,
  fileName = 'document.pdf',
  allowDownload = true,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Ошибка загрузки PDF файла');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{fileName}</span>
          <div>
            {allowDownload && (
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ marginRight: 8 }}
                title="Скачать PDF"
              />
            )}
            <Button
              type="text"
              icon={<ExpandOutlined />}
              onClick={handleOpenInNewTab}
              style={{ marginRight: 8 }}
              title="Открыть в новой вкладке"
            />
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              title="Закрыть"
            />
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width="90vw"
      style={{ top: 20 }}
      bodyStyle={{ height: '80vh', padding: 0 }}
      footer={null}
      closable={false}
    >
      <div style={{ 
        height: '100%', 
        position: 'relative',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              Загрузка PDF...
            </div>
          </div>
        )}
        
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '80%',
          }}>
            <Alert
              message="Ошибка загрузки PDF"
              description={error}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={handleOpenInNewTab}>
                  Открыть в новой вкладке
                </Button>
              }
            />
          </div>
        )}

        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            visibility: loading || error ? 'hidden' : 'visible'
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={fileName}
        />
      </div>
    </Modal>
  );
};