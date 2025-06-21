/**
 * @file: InlinePdfViewer.tsx
 * @description: Встроенный просмотрщик PDF без отдельных модальных окон (ИСПРАВЛЕННЫЙ)
 * @created: 2025-06-21
 * @updated: 2025-06-21 - Исправлены проблемы с localhost и PDF.js
 */
import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Typography, Spin } from 'antd';
import { 
  EyeOutlined, 
  DownloadOutlined, 
  ExpandOutlined,
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface InlinePdfViewerProps {
  pdfUrl: string;
  fileName?: string;
  height?: number;
  showControls?: boolean;
}

export const InlinePdfViewer: React.FC<InlinePdfViewerProps> = ({
  pdfUrl,
  fileName = 'document.pdf',
  height = 400,
  showControls = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'direct' | 'browser' | 'object'>('direct');
  const [pdfStatus, setPdfStatus] = useState<'checking' | 'available' | 'error'>('checking');

  useEffect(() => {
    if (pdfUrl) {
      checkPdfAvailability();
    }
  }, [pdfUrl]);

  const checkPdfAvailability = async () => {
    setPdfStatus('checking');
    setLoading(true);
    
    try {
      console.log('🔍 Checking PDF availability:', pdfUrl);
      const response = await fetch(pdfUrl, { method: 'HEAD' });
      
      if (response.ok) {
        setPdfStatus('available');
        setError(null);
        console.log('✅ PDF available');
      } else {
        setPdfStatus('error');
        setError(`HTTP ${response.status}: ${response.statusText}`);
        console.log('❌ PDF not available:', response.status);
      }
    } catch (err: any) {
      setPdfStatus('error');
      setError(`Ошибка сети: ${err.message}`);
      console.error('❌ Network error:', err);
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

  const renderViewer = () => {
    if (loading) {
      return (
        <div style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px dashed #d9d9d9',
          borderRadius: '6px'
        }}>
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">Загрузка PDF...</Text>
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
          <Space direction="vertical" align="center" style={{ textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
            <Text type="danger" strong>Ошибка загрузки PDF</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{error}</Text>
            <Space>
              <Button size="small" onClick={handleOpenInNewTab}>
                Открыть в браузере
              </Button>
              <Button size="small" icon={<ReloadOutlined />} onClick={checkPdfAvailability}>
                Повторить
              </Button>
            </Space>
          </Space>
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
      case 'browser':
        // Используем object элемент для встроенного просмотра браузера
        return (
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
        );

      case 'object':
        // Попытка через embed элемент
        return (
          <embed
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            type="application/pdf"
            style={commonStyle}
          />
        );

      case 'direct':
      default:
        // Прямой iframe (может не работать с localhost)
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
                color: '#000'
              }}>
                ⚠️ Может не работать с localhost
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <FileTextOutlined />
          <Text strong>Просмотр PDF</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ({fileName})
          </Text>
        </Space>
      }
      extra={
        showControls && (
          <Space>
            <Text style={{ fontSize: '12px' }}>Режим:</Text>
            <Button.Group size="small">
              <Button 
                type={viewMode === 'direct' ? 'primary' : 'default'}
                onClick={() => setViewMode('direct')}
                title="Прямой iframe"
              >
                Прямой
              </Button>
              <Button 
                type={viewMode === 'browser' ? 'primary' : 'default'}
                onClick={() => setViewMode('browser')}
                title="Встроенный просмотрщик браузера"
              >
                Браузер
              </Button>
              <Button 
                type={viewMode === 'object' ? 'primary' : 'default'}
                onClick={() => setViewMode('object')}
                title="Embed элемент"
              >
                Embed
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
      <div style={{ padding: '8px 0' }}>
        {/* Статус PDF */}
        {pdfStatus === 'available' && (
          <Alert
            message="PDF готов к просмотру"
            type="success"
            showIcon
            style={{ marginBottom: 12, fontSize: '12px' }}
          />
        )}
        
        {pdfStatus === 'checking' && (
          <Alert
            message="Проверка доступности PDF..."
            type="info"
            showIcon
            style={{ marginBottom: 12, fontSize: '12px' }}
          />
        )}

        {/* PDF просмотрщик */}
        {renderViewer()}

        {/* Подсказки и кнопки быстрого доступа */}
        {pdfStatus === 'available' && (
          <div style={{ 
            marginTop: 8, 
            padding: '12px', 
            backgroundColor: '#f6ffed', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                💡 <strong>Рекомендации:</strong>
              </Text>
              <div>
                • Если PDF не отображается, попробуйте режим <strong>"Браузер"</strong> или <strong>"Embed"</strong>
              </div>
              <div>
                • Для localhost лучше всего работает кнопка <strong>"Открыть в новой вкладке"</strong>
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
                  onClick={() => setViewMode('browser')}
                  disabled={viewMode === 'browser'}
                >
                  Попробовать браузер
                </Button>
              </Space>
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
};
