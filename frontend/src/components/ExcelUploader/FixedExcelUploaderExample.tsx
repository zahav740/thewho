/**
 * @file: FixedExcelUploaderExample.tsx
 * @description: Исправленный пример использования улучшенного компонента загрузки Excel
 * @created: 2025-07-03
 */
import React from 'react';
import ImprovedExcelUploader from './ImprovedExcelUploader';

const FixedExcelUploaderExample: React.FC = () => {
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
        readyForDownload: data?.filter((row: any) => row && row[6] === 'Готов').length || 0 // Проверяем 7-ю колонку (индекс 6) на статус "Готов"
      };
    } catch (error) {
      throw new Error('Ошибка загрузки файла на сервер');
    }
  };

  // Обработчик превью данных
  const handlePreview = (data: any[]) => {
    console.log('Предварительный просмотр данных:', data);
    console.log(`Отображено ${data.length} записей в превью`);
  };

  // Обработчик скачивания готовых заказов
  const handleDownload = (fileIndex: number) => {
    console.log('Начинается скачивание готовых заказов...');
    console.log('Скачивание файла с индексом:', fileIndex);
    
    // Создаем простой CSV файл для демонстрации
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Номер чертежа,Количество,Дедлайн,Приоритет\n"
      + "DWG-001,5,2025-07-15,1\n"
      + "DWG-002,10,2025-07-20,2\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "processed_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <ImprovedExcelUploader
        title="CRM Система - Загрузка заказов"
        description="Загрузите Excel файл с заказами. Система автоматически извлечет данные из колонок C, E, G, K.
Зеленый статус означает готовность к скачиванию."
        onUpload={handleUpload}
        onPreview={handlePreview}
        onDownload={handleDownload}
        maxFileSize={50} // 50MB
        acceptedFormats={['.xlsx', '.xls', '.csv']}
        showPreview={true}
      />
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>💡 Инструкция по использованию:</h3>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Колонка C:</strong> Номер чертежа (например: DWG-001)</li>
          <li><strong>Колонка E:</strong> Количество (например: 5)</li>
          <li><strong>Колонка G:</strong> Дедлайн (например: 2025-07-15)</li>
          <li><strong>Колонка K:</strong> Приоритет (например: 1)</li>
        </ul>
        <p><strong>Пример структуры файла:</strong></p>
        <code style={{ display: 'block', padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
          A | B | C (Номер чертежа) | D | E (Количество) | F | G (Дедлайн) | ... | K (Приоритет)<br/>
          1 | Заголовки → → → → → → → → → → → → → → →<br/>
          2 | Данные → DWG-001 → → 5 → → 2025-07-15 → → 1
        </code>
      </div>
    </div>
  );
};

export default FixedExcelUploaderExample;
