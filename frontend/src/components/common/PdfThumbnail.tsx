/**
 * @file: PdfThumbnail.tsx
 * @description: Компонент для отображения миниатюр PDF в списке заказов
 * @created: 2025-07-07
 */
import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { FilePdfOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import { ordersApi } from '../../services/ordersApi';

interface PdfThumbnailProps {
  orderId: number;
  drawingNumber: string;
  pdfPath?: string;
  size?: 'small' | 'middle' | 'large'; // Исправлено: используем правильные типы Ant Design
  showPreview?: boolean;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  orderId,
  drawingNumber,
  pdfPath,
  size = 'small',
  showPreview = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const hasPdf = !!pdfPath;

  const handlePreview = async () => {
    if (!showPreview || !hasPdf) return;

    setLoading(true);
    try {
      // Открываем PDF в новой вкладке используя фиксированный URL
      const pdfUrl = ordersApi.getPdfUrlFixed(orderId);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Ошибка открытия PDF:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPdf) {
    return (
      <Tooltip title="PDF не загружен">
        <Button
          type="text"
          size={size}
          icon={<FilePdfOutlined />}
          style={{ 
            color: '#d9d9d9',
            cursor: 'default'
          }}
          disabled
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={error ? "Ошибка загрузки PDF" : `Открыть PDF: ${drawingNumber}`}>
      <Button
        type="text"
        size={size}
        icon={error ? <WarningOutlined /> : <FilePdfOutlined />}
        loading={loading}
        onClick={handlePreview}
        style={{
          color: error ? '#ff4d4f' : '#1890ff',
          fontSize: size === 'large' ? '18px' : size === 'small' ? '14px' : '16px'
        }}
      />
    </Tooltip>
  );
};

export default PdfThumbnail;
