/**
 * @file: ExcelUploaderWithSettingsExample.tsx
 * @description: Пример использования компонента загрузки Excel с настройками импорта
 * @dependencies: ExcelUploaderWithSettings
 * @created: 2025-05-29
 */
import React from 'react';
import { message } from 'antd';
import ExcelUploaderWithSettings from './ExcelUploaderWithSettings';
import { ImportSettings } from './ImportSettingsModal';

const ExcelUploaderWithSettingsExample: React.FC = () => {
  // Обработчик загрузки файлов с настройками импорта
  const handleUpload = async (file: File, data?: any[], settings?: ImportSettings) => {
    try {
      console.log('Отправка файла на сервер:', file.name);
      console.log('Отфильтрованные данные:', data);
      console.log('Настройки импорта:', settings);
      
      // Подсчет заказов по цветам
      const colorCounts = data?.reduce((acc, row) => {
        acc[row.rowColor] = (acc[row.rowColor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const readyOrdersCount = colorCounts.green || 0;
      const criticalOrdersCount = colorCounts.red || 0;
      
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: `
          Файл "${file.name}" успешно обработан!
          🟢 Готовых заказов: ${readyOrdersCount}
          🔴 Критичных заказов: ${criticalOrdersCount}
          📊 Всего обработано: ${data?.length || 0} заказов
        `,
        ordersCount: data?.length || 0,
        readyForDownload: readyOrdersCount,
        criticalCount: criticalOrdersCount,
        colorBreakdown: colorCounts
      };
    } catch (error) {
      throw new Error('Ошибка загрузки файла на сервер');
    }
  };

  // Обработчик превью данных
  const handlePreview = (data: any[]) => {
    const readyCount = data.filter(row => row.rowColor === 'green').length;
    console.log('Предварительный просмотр данных:', data);
    message.info(`Отображено ${data.length} записей, готовых заказов: ${readyCount}`);
  };

  // Обработчик скачивания готовых заказов
  const handleDownload = (fileIndex: number) => {
    message.success('Начинается скачивание готовых заказов (зеленые строки)...');
    // Здесь должна быть логика скачивания только готовых заказов
    console.log('Скачивание готовых заказов из файла с индексом:', fileIndex);
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
      text: 'Обработка данных' 
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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ExcelUploaderWithSettings
        title="CRM Система - Загрузка заказов с цветовой фильтрацией"
        description="Загрузите Excel файл с заказами. Настройте фильтры по цветам строк и маппинг колонок."
        onUpload={handleUpload}
        onPreview={handlePreview}
        onDownload={handleDownload}
        maxFileSize={50} // 50MB
        acceptedFormats={['.xlsx', '.xls', '.csv']}
        showPreview={true}
        statusMapping={statusMapping}
      />
      
      <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
        <h4>Инструкция по использованию:</h4>
        <ul>
          <li><strong>🟢 Зеленые строки</strong> - готовые заказы, которые можно скачать (но не обязательно)</li>
          <li><strong>🟡 Желтые строки</strong> - обычные заказы в процессе производства</li>
          <li><strong>🔴 Красные строки</strong> - критичные заказы, требующие внимания</li>
          <li><strong>🔵 Синие строки</strong> - плановые заказы на будущее</li>
          <li><strong>⚙️ Кнопка "Настройки импорта"</strong> - позволяет выбрать какие цветные строки импортировать</li>
          <li><strong>📊 Маппинг колонок</strong> - настройка соответствия колонок Excel полям заказов</li>
          <li><strong>📥 Кнопки колонок</strong> - кликабельны в выпадающем списке для быстрого выбора</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelUploaderWithSettingsExample;