/**
 * @file: PdfPreview.tsx
 * @description: Компонент для отображения превью PDF рядом с номером чертежа
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
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { ordersApi } from '../../services/ordersApi';
import { pdfEnhancedApi } from '../../services/pdfEnhancedApi';
import { PdfViewer } from './PdfViewer';

interface PdfPreviewProps {
  orderId: number;
  drawingNumber: string;
  pdfPath?: string;
  onPdfUpdate?: (pdfPath: string | null) => void;
  size?: 'small' | 'large';
  showUpload?: boolean;
  showDelete?: boolean;
  disabled?: boolean;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
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
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);

  // Проверка дубликатов PDF
  const checkPdfDuplicate = async (file: File): Promise<boolean> => {
    try {
      console.log('🔍 Проверка дубликата PDF для:', file.name, 'чертеж:', drawingNumber);
      
      // Проверяем по номеру чертежа
      const duplicateCheck = await pdfEnhancedApi.checkDuplicate(drawingNumber);
      
      if (duplicateCheck.isDuplicate && duplicateCheck.existingFile) {
        setExistingOrder({
          drawingNumber: duplicateCheck.existingFile.drawingNumber,
          id: duplicateCheck.existingFile.orderId,
          filePath: duplicateCheck.existingFile.filePath
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка проверки дубликата PDF:', error);
      return false;
    }
  };

  // Загрузка PDF файла
  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      console.log(`📄 Загрузка PDF для заказа ${orderId}, чертеж: ${drawingNumber}`);
      
      // Проверяем дубликаты
      const duplicate = await checkPdfDuplicate(file);
      if (duplicate) {
        setIsDuplicate(true);
        setExistingOrder({ drawingNumber, id: orderId });
        return false;
      }

      const result = await pdfEnhancedApi.uploadPdf(orderId, drawingNumber, file, {
        replaceDuplicate: false,
        useExisting: false
      });
      
      // Обновляем заказ через обычный API
      const updatedOrder = await ordersApi.getById(orderId);
      
      message.success('PDF успешно загружен');
      onPdfUpdate?.(updatedOrder.pdfPath || null);
      setShowUploadModal(false);
      
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
        } catch (error: any) {
          message.error(`Ошибка удаления PDF: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Обработка дубликатов
  const handleDuplicateAction = (action: 'replace' | 'keep' | 'cancel') => {
    switch (action) {
      case 'replace':
        // Продолжаем загрузку с заменой
        setIsDuplicate(false);
        // Здесь можно добавить логику замены
        break;
      case 'keep':
        // Используем существующий файл
        if (existingOrder?.filePath) {
          onPdfUpdate?.(existingOrder.filePath);
        }
        message.info('Используется существующий PDF файл');
        setIsDuplicate(false);
        setShowUploadModal(false);
        break;
      case 'cancel':
        // Отменяем загрузку
        setIsDuplicate(false);
        setShowUploadModal(false);
        break;
    }
  };

  const pdfUrl = pdfPath ? ordersApi.getPdfUrlByPath(pdfPath) : null;
  const hasPdf = !!pdfPath;

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
        {isDuplicate ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
              Обнаружен дубликат PDF файла
            </div>
            <p>PDF файл для чертежа "{existingOrder?.drawingNumber}" уже существует.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => handleDuplicateAction('cancel')}>
                Отмена
              </Button>
              <Button onClick={() => handleDuplicateAction('keep')}>
                Использовать существующий
              </Button>
              <Button type="primary" onClick={() => handleDuplicateAction('replace')}>
                Заменить
              </Button>
            </div>
          </div>
        ) : (
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
              Файл будет сохранен в папке: {drawingNumber}
            </p>
          </Upload.Dragger>
        )}
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
    </>
  );
};

export default PdfPreview;