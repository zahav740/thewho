/**
 * @file: ExcelUploaderExample.tsx
 * @description: Пример использования улучшенного компонента загрузки Excel
 * @dependencies: ImprovedExcelUploader
 * @created: 2025-05-29
 */
import React from 'react';
import { message } from 'antd';
import ImprovedExcelUploader from './ImprovedExcelUploader';

const ExcelUploaderExample: React.FC = () => {
  // Обработчик загрузки файлов
  const handleUpload = async (file: File, data?: any[]) => {
    try {
      // Имитация отправки данных на сервер
      console.log('Отправка файла на сервер:', file.name);
      console.log('Данные из Excel:', data);
      
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: `Файл "${file.name}" успешно обработан. Заказы готовы к производству.`,
        ordersCount: data?.length || 0,
        readyForDownload: data?.filter(row => row.status === 'Готов').length || 0
      };
    } catch (error) {
      throw new Error('Ошибка загрузки файла на сервер');
    }
  };

  // Обработчик превью данных
  const handlePreview = (data: any[]) => {
    console.log('Предварительный просмотр данных:', data);
    message.info(`Отображено ${data.length} записей в превью`);
  };

  // Обработчик скачивания готовых заказов
  const handleDownload = (fileIndex: number) => {
    message.success('Начинается скачивание готовых заказов...');
    // Здесь должна быть логика скачивания файла
    console.log('Скачивание файла с индексом:', fileIndex);
  };

  // Настройки статусов для CRM системы
  const statusMapping = {
    'done': { 
      color: 'success', 
      text: 'Готов к скачиванию', 
      canDownload: true 
    },
    'processing': { 
      color: 'processing', 
      text: 'В обработке' 
    },
    'uploading': { 
      color: 'processing', 
      text: 'Загрузка на сервер' 
    },
    'error': { 
      color: 'error', 
      text: 'Ошибка обработки' 
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <ImprovedExcelUploader
        title="CRM Система - Загрузка заказов"
        description="Загрузите Excel файл с заказами. Зеленый статус означает готовность к скачиванию."
        onUpload={handleUpload}
        onPreview={handlePreview}
        onDownload={handleDownload}
        maxFileSize={50} // 50MB
        acceptedFormats={['.xlsx', '.xls', '.csv']}
        showPreview={true}
        statusMapping={statusMapping}
      />
    </div>
  );
};

export default ExcelUploaderExample;