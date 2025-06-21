/**
 * @file: PdfDebugViewer.tsx
 * @description: Исправленный компонент для отладки PDF превью с поддержкой PDF.js
 * @created: 2025-06-21
 * @updated: 2025-06-21 - Добавлена поддержка PDF.js для iframe проблем
 */
import React, { useState, useEffect } from 'react';
import { Modal, Spin, Alert, Button, Card, Typography, Space, Divider, Switch } from 'antd';
import { 
  CloseOutlined, 
  DownloadOutlined, 
  ExpandOutlined, 
  BugOutlined,
  FileTextOutlined,
  EyeOutlined 
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface PdfDebugViewerProps {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName?: string;
  allowDownload?: boolean;
}

export const PdfDebugViewer: React.FC<PdfDebugViewerProps> = ({
  visible,
  onClose,
  pdfUrl,
  fileName = 'document.pdf',
  allowDownload = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'iframe' | 'pdfjs' | 'object'>('pdfjs');

  useEffect(() => {
    if (visible && pdfUrl) {
      checkPdfAvailability();
    }
  }, [visible, pdfUrl]);

  const checkPdfAvailability = async () => {
    console.log('🔍 Проверка доступности PDF:', pdfUrl);
    
    try {
      const response = await fetch(pdfUrl, { method: 'HEAD' });
      
      const info = {
        url: pdfUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        accessible: response.ok,
        timestamp: new Date().toISOString()
      };
      
      console.log('📋 Информация о PDF:', info);
      setDebugInfo(info);
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${response.statusText}`);
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('❌ Ошибка проверки PDF:', err);
      setError(`Сетевая ошибка: ${err.message}`);
      setDebugInfo({
        url: pdfUrl,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
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

  const handleTestDirectAccess = () => {
    window.open(pdfUrl, '_blank');
  };

  // PDF.js URL для загрузки PDF
  const getPdfJsUrl = () => {
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
  };

  // Объект embed URL
  const getObjectUrl = () => {
    return `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`;
  };

  const renderPdfViewer = () => {
    if (loading) {
      return (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            Загрузка PDF...
          </div>
        </div>
      );
    }

    if (error) {
      return (
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
            description={
              <div>
                <div>{error}</div>
                <div style={{ marginTop: 8, fontSize: '12px' }}>
                  URL: <Text code>{pdfUrl}</Text>
                </div>
              </div>
            }
            type="error"
            showIcon
            action={
              <Space direction="vertical">
                <Button size="small" onClick={handleTestDirectAccess}>
                  Открыть напрямую
                </Button>
                <Button size="small" onClick={checkPdfAvailability}>
                  Повторить проверку
                </Button>
              </Space>
            }
          />
        </div>
      );
    }

    // Рендерим PDF в зависимости от выбранного режима
    switch (viewMode) {
      case 'pdfjs':
        return (
          <iframe
            src={getPdfJsUrl()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={fileName}
          />
        );

      case 'object':
        return (
          <object
            data={getObjectUrl()}
            type="application/pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          >
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Alert
                message="PDF не может быть отображен"
                description="Ваш браузер не поддерживает встроенный просмотр PDF"
                type="warning"
                action={
                  <Button onClick={handleOpenInNewTab}>
                    Открыть в новой вкладке
                  </Button>
                }
              />
            </div>
          </object>
        );

      case 'iframe':
      default:
        return (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={fileName}
          />
        );
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><FileTextOutlined style={{ marginRight: 8 }} />{fileName}</span>
          <div>
            <Button
              type="text"
              icon={<BugOutlined />}
              onClick={checkPdfAvailability}
              style={{ marginRight: 8 }}
              title="Обновить диагностику"
            />
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
      width="95vw"
      style={{ top: 10 }}
      bodyStyle={{ height: '85vh', padding: 0 }}
      footer={null}
      closable={false}
    >
      <div style={{ height: '100%', display: 'flex' }}>
        {/* Панель диагностики */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #f0f0f0',
          padding: '16px',
          overflow: 'auto',
          backgroundColor: '#fafafa'
        }}>
          <Title level={5}>🔍 Диагностика PDF</Title>
          
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text strong>URL:</Text>
            <br />
            <Text code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
              {pdfUrl}
            </Text>
          </Card>

          {debugInfo && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Text strong>Статус HTTP:</Text>
              <br />
              <Text type={debugInfo.accessible ? 'success' : 'danger'}>
                {debugInfo.status} {debugInfo.statusText}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Проверено: {new Date(debugInfo.timestamp).toLocaleTimeString()}
              </Text>
            </Card>
          )}

          {/* Переключатель режима просмотра */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text strong>Режим просмотра:</Text>
            <br />
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              <Button
                size="small"
                type={viewMode === 'pdfjs' ? 'primary' : 'default'}
                onClick={() => setViewMode('pdfjs')}
                block
              >
                📄 PDF.js (рекомендуется)
              </Button>
              <Button
                size="small"
                type={viewMode === 'object' ? 'primary' : 'default'}
                onClick={() => setViewMode('object')}
                block
              >
                🖼️ Object элемент
              </Button>
              <Button
                size="small"
                type={viewMode === 'iframe' ? 'primary' : 'default'}
                onClick={() => setViewMode('iframe')}
                block
              >
                🌐 Iframe (может не работать)
              </Button>
            </Space>
          </Card>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              size="small" 
              block 
              onClick={handleTestDirectAccess}
              icon={<ExpandOutlined />}
            >
              Прямой доступ
            </Button>
            
            <Button 
              size="small" 
              block 
              onClick={checkPdfAvailability}
              icon={<BugOutlined />}
            >
              Повторить проверку
            </Button>
          </Space>

          <Divider />

          <div style={{ fontSize: '12px' }}>
            <Text strong>Режимы просмотра:</Text>
            <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '11px' }}>
              <li><strong>PDF.js</strong> - использует Mozilla PDF.js для надежного отображения</li>
              <li><strong>Object</strong> - встроенный просмотрщик браузера</li>
              <li><strong>Iframe</strong> - может блокироваться localhost</li>
            </ul>
            
            <Text strong>Помощь:</Text>
            <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '11px' }}>
              <li>Проверьте, что backend запущен</li>
              <li>Убедитесь, что файл существует</li>
              <li>Попробуйте разные режимы просмотра</li>
              <li>Используйте "Прямой доступ" для тестирования</li>
            </ul>
          </div>
        </div>

        {/* Область просмотра PDF */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          border: '1px solid #d9d9d9',
          margin: '16px',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {renderPdfViewer()}
        </div>
      </div>
    </Modal>
  );
};
