/**
 * @file: PdfPreviewFixed.tsx
 * @description: Исправленный компонент для отображения превью PDF с автодиагностикой
 * @created: 2025-07-07
 */
import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Upload, Modal, message, Popover, Badge, Alert } from 'antd';
import { 
  FilePdfOutlined, 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { ordersApi } from '../../services/ordersApi';
import { PdfViewer } from './PdfViewer';

interface PdfPreviewFixedProps {
  orderId: number;
  drawingNumber: string;
  pdfPath?: string;
  onPdfUpdate?: (pdfPath: string | null) => void;
  size?: 'small' | 'large'; // Оставляем только совместимые с Button размеры
  showUpload?: boolean;
  showDelete?: boolean;
  disabled?: boolean;
}

export const PdfPreviewFixed: React.FC<PdfPreviewFixedProps> = ({
  orderId,
  drawingNumber,
  pdfPath,
  onPdfUpdate,
  size = 'small',
  showUpload = true,
  showDelete = true,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [fixedPath, setFixedPath] = useState<string | null>(null);

  // Проверяем доступность PDF при монтировании
  useEffect(() => {
    if (pdfPath) {
      checkPdfAvailability();
    }
  }, [pdfPath, orderId]);

  // Проверка доступности PDF файла
  const checkPdfAvailability = async () => {
    try {
      console.log('🔍 Проверяем доступность PDF для заказа', orderId);
      const info = await ordersApi.getPdfInfo(orderId);
      
      if (!info.physicalFileExists && info.pdfPath) {
        console.log('⚠️ PDF файл не найден, пытаемся исправить');
        await autoFixPdf();
      }
    } catch (error) {
      console.error('Ошибка проверки PDF:', error);
    }
  };

  // Автоматическое исправление PDF
  const autoFixPdf = async () => {
    try {
      setLoading(true);
      console.log('🔧 Автоисправление PDF для заказа', orderId);
      
      const fixResult = await ordersApi.fixPdfPath(orderId);
      
      if (fixResult.success) {
        message.success('PDF файл автоматически исправлен');
        setFixedPath(fixResult.newPath);
        onPdfUpdate?.(fixResult.newPath);
        console.log('✅ PDF исправлен:', fixResult.newPath);
      } else {
        console.log('❌ Не удалось автоматически исправить PDF');
      }
    } catch (error) {
      console.error('Ошибка автоисправления PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  // Диагностика PDF
  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const info = await ordersApi.getPdfInfo(orderId);
      setDiagnosticsData(info);
      setShowDiagnostics(true);
    } catch (error) {
      message.error('Ошибка получения диагностики PDF');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка PDF файла
  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      console.log(`📄 Загрузка PDF для заказа ${orderId}, чертеж: ${drawingNumber}`);
      
      const result = await ordersApi.uploadPdf(orderId, file);
      
      message.success('PDF успешно загружен');
      onPdfUpdate?.(result.pdfPath || null);
      setShowUploadModal(false);
      setFixedPath(result.pdfPath || null);
      
    } catch (error: any) {
      console.error('Ошибка загрузки PDF:', error);
      message.error(`Ошибка загрузки PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
    
    return false; // Предотвращаем автоматическую загрузку
  };

  // Удаление PDF
  const handleDelete = () => {
    Modal.confirm({
      title: 'Удалить PDF?',
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите удалить PDF для чертежа ${drawingNumber}?`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        setLoading(true);
        try {
          await ordersApi.deletePdf(orderId);
          message.success('PDF удален');
          onPdfUpdate?.(null);
          setFixedPath(null);
        } catch (error: any) {
          message.error(`Ошибка удаления PDF: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const currentPdfPath = fixedPath || pdfPath;
  const hasPdf = !!currentPdfPath;
  
  // Выбираем правильный URL для просмотра
  const pdfUrl = hasPdf ? ordersApi.getPdfUrlFixed(orderId) : null;

  // Контент для попапа действий
  const actionContent = (
    <div style={{ padding: '8px 0' }}>
      {hasPdf && (
        <>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => setShowViewer(true)}
            style={{ padding: '4px 0', display: 'block', textAlign: 'left' }}
          >
            Просмотр PDF
          </Button>
          {showDelete && (
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
              loading={loading}
              style={{ padding: '4px 0', display: 'block', textAlign: 'left' }}
            >
              Удалить PDF
            </Button>
          )}
        </>
      )}
      {showUpload && (
        <Button 
          type="link" 
          icon={<UploadOutlined />} 
          onClick={() => setShowUploadModal(true)}
          style={{ padding: '4px 0', display: 'block', textAlign: 'left' }}
        >
          {hasPdf ? 'Заменить PDF' : 'Загрузить PDF'}
        </Button>
      )}
      <Button 
        type="link" 
        icon={<ToolOutlined />} 
        onClick={runDiagnostics}
        style={{ padding: '4px 0', display: 'block', textAlign: 'left' }}
      >
        Диагностика
      </Button>
    </div>
  );

  return (
    <>
      <Popover 
        content={actionContent} 
        trigger="hover"
        placement="topLeft"
      >
        <Badge 
          count={hasPdf ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 0}
          offset={[-5, 5]}
        >
          <Button
            type={hasPdf ? 'primary' : 'default'}
            icon={<FilePdfOutlined />}
            size={size}
            loading={loading}
            disabled={disabled}
            style={{
              color: hasPdf ? '#fff' : '#666',
              backgroundColor: hasPdf ? '#1890ff' : '#fafafa',
              borderColor: hasPdf ? '#1890ff' : '#d9d9d9',
            }}
          >
            {size !== 'small' && (hasPdf ? 'PDF' : 'Нет PDF')}
          </Button>
        </Badge>
      </Popover>

      {/* Модальное окно загрузки */}
      <Modal
        title={`Загрузка PDF для чертежа ${drawingNumber}`}
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
        width={400}
      >
        <Upload.Dragger
          accept=".pdf"
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={loading}
        >
          <p className="ant-upload-drag-icon">
            <FilePdfOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Нажмите или перетащите PDF файл сюда</p>
          <p className="ant-upload-hint">
            Файл будет сохранен для заказа: {drawingNumber}
          </p>
        </Upload.Dragger>
      </Modal>

      {/* Просмотрщик PDF */}
      {showViewer && pdfUrl && (
        <PdfViewer
          visible={showViewer}
          onClose={() => setShowViewer(false)}
          pdfUrl={pdfUrl}
          fileName={`${drawingNumber}.pdf`}
        />
      )}

      {/* Модальное окно диагностики */}
      <Modal
        title={`Диагностика PDF - Заказ ${orderId}`}
        open={showDiagnostics}
        onCancel={() => setShowDiagnostics(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setShowDiagnostics(false)}>
            Закрыть
          </Button>,
          diagnosticsData && !diagnosticsData.physicalFileExists && (
            <Button 
              key="fix" 
              type="primary" 
              icon={<ToolOutlined />}
              onClick={autoFixPdf}
              loading={loading}
            >
              Исправить автоматически
            </Button>
          )
        ]}
      >
        {diagnosticsData && (
          <div>
            <Alert
              message={diagnosticsData.physicalFileExists ? 'PDF файл найден' : 'PDF файл не найден'}
              type={diagnosticsData.physicalFileExists ? 'success' : 'error'}
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <strong>Информация о заказе:</strong>
              <ul>
                <li>ID заказа: {diagnosticsData.orderId}</li>
                <li>Номер чертежа: {diagnosticsData.drawingNumber}</li>
                <li>Путь в БД: {diagnosticsData.pdfPath || 'Не указан'}</li>
              </ul>
            </div>

            {diagnosticsData.searchResults && diagnosticsData.searchResults.length > 0 && (
              <div>
                <strong>Найденные файлы:</strong>
                <ul>
                  {diagnosticsData.searchResults.map((result: any, index: number) => (
                    <li key={index}>
                      <div>{result.path}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Существует: {result.exists ? '✅ Да' : '❌ Нет'}
                        {result.size && ` | Размер: ${Math.round(result.size / 1024)} KB`}
                        {result.possibleMatch && <span style={{ color: '#1890ff' }}> | Возможное совпадение</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default PdfPreviewFixed;
