/**
 * @file: SimplePdfViewer.tsx
 * @description: Простой просмотрщик PDF без iframe проблем
 * @created: 2025-06-21
 */
import React, { useState } from 'react';
import { Modal, Button, Space, Alert, Typography, Card } from 'antd';
import { 
  DownloadOutlined, 
  ExpandOutlined, 
  EyeOutlined,
  FileTextOutlined,
  CloseOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface SimplePdfViewerProps {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName?: string;
}

export const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({
  visible,
  onClose,
  pdfUrl,
  fileName = 'document.pdf',
}) => {
  const [viewerType, setViewerType] = useState<'pdfjs' | 'download' | 'newTab'>('pdfjs');

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

  const getPdfJsUrl = () => {
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Просмотр PDF: {fileName}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width="90vw"
      style={{ top: 20 }}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          Скачать
        </Button>,
        <Button key="newTab" icon={<ExpandOutlined />} onClick={handleOpenInNewTab}>
          Открыть в новой вкладке
        </Button>,
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
    >
      <div style={{ height: '70vh' }}>
        <Alert
          message="Выберите способ просмотра PDF"
          description="Из-за ограничений безопасности localhost, выберите наиболее подходящий способ просмотра PDF файла"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Button size="small" onClick={() => setViewerType('pdfjs')}>
                PDF.js
              </Button>
              <Button size="small" onClick={() => setViewerType('newTab')}>
                Новая вкладка
              </Button>
              <Button size="small" onClick={() => setViewerType('download')}>
                Скачать
              </Button>
            </Space>
          }
        />

        <Card>
          <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
            
            <Text strong style={{ fontSize: '16px' }}>
              {fileName}
            </Text>
            
            <Text type="secondary">
              Файл готов к просмотру
            </Text>

            <Space size="large" style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<EyeOutlined />}
                onClick={() => window.open(getPdfJsUrl(), '_blank')}
              >
                Открыть с PDF.js
              </Button>
              
              <Button
                size="large"
                icon={<ExpandOutlined />}
                onClick={handleOpenInNewTab}
              >
                Открыть в браузере
              </Button>
              
              <Button
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                Скачать файл
              </Button>
            </Space>

            <div style={{ marginTop: 24, padding: '16px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 <strong>Рекомендация:</strong> Используйте "Открыть с PDF.js" для лучшего опыта просмотра
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </Modal>
  );
};
