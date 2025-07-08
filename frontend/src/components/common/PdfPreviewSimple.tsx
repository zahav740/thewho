/**
 * @file: PdfPreviewSimple.tsx
 * @description: Простой компонент для отображения PDF с базовым исправлением
 * @created: 2025-07-07
 */
import React, { useState } from 'react';
import { Button, Tooltip, Upload, Modal, message, Popover, Badge } from 'antd';
import { 
  FilePdfOutlined, 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ordersApi } from '../../services/ordersApi';

interface PdfPreviewSimpleProps {
  orderId: number;
  drawingNumber: string;
  pdfPath?: string;
  onPdfUpdate?: (pdfPath: string | null) => void;
  size?: 'small' | 'large';
  showUpload?: boolean;
  showDelete?: boolean;
  disabled?: boolean;
}

export const PdfPreviewSimple: React.FC<PdfPreviewSimpleProps> = ({
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
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Загрузка PDF файла
  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      console.log(`📄 Загрузка PDF для заказа ${orderId}, чертеж: ${drawingNumber}`);
      
      const result = await ordersApi.uploadPdf(orderId, file);
      
      message.success('PDF успешно загружен');
      onPdfUpdate?.(result.pdfPath || null);
      setShowUploadModal(false);
      
    } catch (error: any) {
      console.error('Ошибка загрузки PDF:', error);
      message.error(`Ошибка загрузки PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
    
    return false;
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
        } catch (error: any) {
          message.error(`Ошибка удаления PDF: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const openPdf = () => {
    // Пробуем новый endpoint, если не работает - используем старый
    const pdfUrl = `${ordersApi.getPdfUrlFixed(orderId)}`;
    const fallbackUrl = `${ordersApi.getPdfUrl(orderId)}`;
    
    // Открываем в новой вкладке
    const newWindow = window.open(pdfUrl, '_blank');
    
    // Если основной URL не работает, пробуем fallback
    if (newWindow) {
      newWindow.onerror = () => {
        window.open(fallbackUrl, '_blank');
      };
    }
  };

  const hasPdf = !!pdfPath;

  // Контент для попапа действий
  const actionContent = (
    <div style={{ padding: '8px 0' }}>
      {hasPdf && (
        <>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={openPdf}
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
    </>
  );
};

export default PdfPreviewSimple;
