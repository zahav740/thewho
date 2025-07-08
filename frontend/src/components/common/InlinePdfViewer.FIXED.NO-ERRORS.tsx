/**
 * @file: InlinePdfViewer.FIXED.tsx
 * @description: ИСПРАВЛЕННЫЙ встроенный просмотрщик PDF без ошибок импорта
 * @created: 2025-07-08
 * @updated: 2025-07-08 - Исправлены все ошибки импорта TypeScript
 */
import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Typography, Spin, Result } from 'antd';
import { 
  EyeOutlined, 
  DownloadOutlined, 
  ExpandOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { pdfApiFixed } from '../../services/pdfApi.fixed';

const { Text } = Typography;

interface InlinePdfViewerProps {
  pdfUrl: string;
  fileName?: string;
  height?: number;
  showControls?: boolean;
  drawingNumber?: string;
}

export const InlinePdfViewerFixed: React.FC<InlinePdfViewerProps> = ({
  pdfUrl,
  fileName = 'document.pdf',
  height = 400,
  showControls = true,
  drawingNumber,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'iframe' | 'object' | 'embed' | 'link'>('iframe');
  const [pdfStatus, setPdfStatus] = useState<'checking' | 'available' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (pdfUrl) {
      checkPdfAvailability();
    }
  }, [pdfUrl, retryCount]);

  const checkPdfAvailability = async () => {
    setPdfStatus('checking');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking PDF availability:', pdfUrl);
      
      // Проверяем доступность PDF через наш API
      const result = await pdfApiFixed.checkAvailability(pdfUrl);
      
      if (result.accessible) {
        setPdfStatus('available');
        setError(null);
        console.log('✅ PDF available');
      } else {
        setPdfStatus('error');
        setError(`PDF файл недоступен (${result.status} ${result.statusText})`);
        console.log('❌ PDF not available:', result.status, result.statusText);
      }
    } catch (err: any) {
      setPdfStatus('error');
      setError(`Ошибка сети: ${err.message}`);
      console.error('❌ Network error:', err);
    }
    
    setLoading(false);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Download error:', error);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const renderViewer = () => {
    if (loading) {
      return (
        <div style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px dashed #d9d9d9',
          borderRadius: '6px',
          backgroundColor: '#fafafa'
        }}>
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">Проверка доступности PDF...</Text>
            <Text style={{ fontSize: '12px', color: '#bfbfbf' }}>
              URL: {pdfUrl}
            </Text>
          </Space>
        </div>
      );
    }

    if (error || pdfStatus === 'error') {
      return (
        <div style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px dashed #ff4d4f',
          borderRadius: '6px',
          backgroundColor: '#fff2f0'
        }}>
          <Result
            status="error"
            icon={<FileTextOutlined style={{ color: '#ff4d4f' }} />}
            title="PDF файл недоступен"
            subTitle={
              <div style={{ textAlign: 'center' }}>
                <div>{error}</div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  URL: {pdfUrl}
                </Text>
              </div>
            }
            extra={[
              <Button 
                key="retry"
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleRetry}
              >
                Повторить
              </Button>,
              <Button 
                key="open"
                onClick={handleOpenInNewTab}
                icon={<ExpandOutlined />}
              >
                Открыть в браузере
              </Button>,
            ]}
          />
        </div>
      );
    }

    // Рендерим PDF просмотрщик
    const commonStyle = {
      width: '100%',
      height: height,
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
    };

    switch (viewMode) {
      case 'object':
        return (
          <div style={{ position: 'relative' }}>
            <object
              data={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              type="application/pdf"
              style={commonStyle}
            >
              <div style={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                backgroundColor: '#fafafa'
              }}>
                <Space direction="vertical" align="center" style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#bfbfbf' }} />
                  <Text type="secondary">PDF не поддерживается в браузере</Text>
                  <Button onClick={handleOpenInNewTab}>Открыть в новой вкладке</Button>
                </Space>
              </div>
            </object>
          </div>
        );

      case 'embed':
        return (
          <div style={{ position: 'relative' }}>
            <embed
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              type="application/pdf"
              style={commonStyle}
            />
          </div>
        );

      case 'link':
        return (
          <div style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed #1890ff',
            borderRadius: '6px',
            backgroundColor: '#f0f8ff'
          }}>
            <Space direction="vertical" align="center" style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
              <Text strong style={{ fontSize: '16px' }}>PDF готов к просмотру</Text>
              <Text type="secondary">
                Файл: {fileName}
                {drawingNumber && <div>Чертеж: {drawingNumber}</div>}
              </Text>
              <Space style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleOpenInNewTab}
                  icon={<ExpandOutlined />}
                >
                  Открыть в браузере
                </Button>
                <Button 
                  size="large"
                  onClick={handleDownload}
                  icon={<DownloadOutlined />}
                >
                  Скачать
                </Button>
              </Space>
            </Space>
          </div>
        );

      case 'iframe':
      default:
        return (
          <div style={{ position: 'relative' }}>
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              style={commonStyle}
              title={fileName}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Ошибка загрузки в iframe');
                setLoading(false);
              }}
            />
            {/* Предупреждение для localhost */}
            {pdfUrl.includes('localhost') && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(255, 193, 7, 0.9)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#000',
                zIndex: 10
              }}>
                ⚠️ Localhost - может не работать
              </div>
            )}
          </div>
        );
    }
  };

  const renderStatusAlert = () => {
    switch (pdfStatus) {
      case 'available':
        return (
          <Alert
            message={
              <Space>
                <CheckCircleOutlined />
                <span>PDF файл готов к просмотру</span>
              </Space>
            }
            type="success"
            showIcon={false}
            style={{ marginBottom: 12, fontSize: '12px' }}
          />
        );
      case 'checking':
        return (
          <Alert
            message="Проверка доступности PDF..."
            type="info"
            showIcon
            style={{ marginBottom: 12, fontSize: '12px' }}
          />
        );
      case 'error':
        return (
          <Alert
            message={
              <Space>
                <ExclamationCircleOutlined />
                <span>PDF файл недоступен</span>
              </Space>
            }
            description={error}
            type="error"
            showIcon={false}
            style={{ marginBottom: 12, fontSize: '12px' }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <FileTextOutlined />
          <Text strong>PDF Просмотр</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ({fileName})
          </Text>
          {drawingNumber && (
            <Text code style={{ fontSize: '11px' }}>
              {drawingNumber}
            </Text>
          )}
        </Space>
      }
      extra={
        showControls && (
          <Space size="small">
            <Text style={{ fontSize: '12px' }}>Режим:</Text>
            <Button.Group size="small">
              <Button 
                type={viewMode === 'iframe' ? 'primary' : 'default'}
                onClick={() => setViewMode('iframe')}
                title="Iframe просмотр"
              >
                Iframe
              </Button>
              <Button 
                type={viewMode === 'object' ? 'primary' : 'default'}
                onClick={() => setViewMode('object')}
                title="Object элемент"
              >
                Object
              </Button>
              <Button 
                type={viewMode === 'embed' ? 'primary' : 'default'}
                onClick={() => setViewMode('embed')}
                title="Embed элемент"
              >
                Embed
              </Button>
              <Button 
                type={viewMode === 'link' ? 'primary' : 'default'}
                onClick={() => setViewMode('link')}
                title="Только ссылки"
              >
                Ссылки
              </Button>
            </Button.Group>
            <Button 
              size="small" 
              icon={<ExpandOutlined />} 
              onClick={handleOpenInNewTab}
              title="Открыть в новой вкладке"
            />
            <Button 
              size="small" 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
              title="Скачать"
            />
          </Space>
        )
      }
    >
      <div>
        {/* Статус PDF */}
        {renderStatusAlert()}
        
        {/* PDF просмотрщик */}
        {renderViewer()}

        {/* Подсказки и дополнительная информация */}
        {pdfStatus === 'available' && (
          <div style={{ 
            marginTop: 12, 
            padding: '12px', 
            backgroundColor: '#f6ffed', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                💡 <strong>Рекомендации по просмотру:</strong>
              </Text>
              <div style={{ marginLeft: 8 }}>
                • Для localhost используйте режим <strong>"Ссылки"</strong> или кнопку <strong>"Открыть в браузере"</strong>
              </div>
              <div style={{ marginLeft: 8 }}>
                • Если PDF не отображается, попробуйте режимы <strong>"Object"</strong> или <strong>"Embed"</strong>
              </div>
              <div style={{ marginLeft: 8 }}>
                • Современные браузеры лучше всего работают с режимом <strong>"Iframe"</strong>
              </div>
              <Space style={{ marginTop: 8 }}>
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={handleOpenInNewTab}
                  icon={<ExpandOutlined />}
                >
                  Новая вкладка
                </Button>
                <Button 
                  size="small" 
                  onClick={handleDownload}
                  icon={<DownloadOutlined />}
                >
                  Скачать
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setViewMode('link')}
                  disabled={viewMode === 'link'}
                >
                  Режим ссылок
                </Button>
              </Space>
            </Space>
          </div>
        )}

        {/* Диагностическая информация в режиме разработки */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: 8, 
            padding: '8px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px',
            fontSize: '11px',
            color: '#666'
          }}>
            <details>
              <summary style={{ cursor: 'pointer' }}>🔧 Диагностика (dev)</summary>
              <div style={{ marginTop: 4 }}>
                <div><strong>URL:</strong> {pdfUrl}</div>
                <div><strong>Статус:</strong> {pdfStatus}</div>
                <div><strong>Режим:</strong> {viewMode}</div>
                <div><strong>Ошибка:</strong> {error || 'нет'}</div>
                <div><strong>Попыток:</strong> {retryCount + 1}</div>
                {drawingNumber && <div><strong>Чертеж:</strong> {drawingNumber}</div>}
              </div>
            </details>
          </div>
        )}
      </div>
    </Card>
  );
};

// Экспортируем под старым именем для совместимости
export const InlinePdfViewer = InlinePdfViewerFixed;
