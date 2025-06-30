/**
 * @file: ExcelUploaderNew.tsx
 * @description: Новый компонент загрузки Excel файлов с выбором колонок
 * @dependencies: antd, AdvancedExcelUploader
 * @created: 2025-06-25
 */
import React from 'react';
import { Button, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import AdvancedExcelUploader from '../../../components/ExcelUploader/AdvancedExcelUploader';

interface ExcelUploaderNewProps {
  onSuccess: () => void;
}

interface ExcelImportSettings {
  sheetIndex: number;
  hasHeaders: boolean;
  startRow: number;
  columnMapping: any;
  colorFilters?: string[];
}

export const ExcelUploaderNew: React.FC<ExcelUploaderNewProps> = ({ onSuccess }) => {
  const handleFileUpload = async (file: File, settings: ExcelImportSettings) => {
    try {
      console.log('🔄 Импорт файла с настройками:', { fileName: file.name, settings });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('settings', JSON.stringify(settings));

      const response = await fetch('/api/orders/import-excel-with-mapping', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
      }

      const result = await response.json();
      
      // Уведомляем родительский компонент об успешном импорте
      onSuccess();
      
      return result;
    } catch (error: any) {
      console.error('❌ Ошибка импорта:', error);
      message.error(`Ошибка импорта: ${error.message}`);
      throw error;
    }
  };

  return (
    <AdvancedExcelUploader
      onUpload={handleFileUpload}
      maxFileSize={20}
      title="Импорт заказов из Excel"
      description="Загрузите Excel файл и настройте соответствие колонок для точного импорта заказов"
    />
  );
};
