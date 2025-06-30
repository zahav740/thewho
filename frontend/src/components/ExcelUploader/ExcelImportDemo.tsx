/**
 * @file: ExcelImportDemo.tsx
 * @description: Демо-страница для тестирования нового компонента импорта Excel с выбором колонок
 * @dependencies: antd, react, AdvancedExcelUploader
 * @created: 2025-06-25
 */
import React from 'react';
import { Card, Typography, Divider, Space, Alert } from 'antd';
import { FileExcelOutlined, SettingOutlined } from '@ant-design/icons';
import AdvancedExcelUploader from './AdvancedExcelUploader';

const { Title, Paragraph, Text } = Typography;

const ExcelImportDemo: React.FC = () => {
  const handleFileUpload = async (file: File, settings: any) => {
    console.log('🎯 Демо обработчик загрузки:', { 
      fileName: file.name, 
      settings 
    });
    
    // Симуляция задержки
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Возвращаем фиктивный результат
    return {
      success: true,
      message: 'Файл успешно импортирован (демо режим)',
      data: {
        created: Math.floor(Math.random() * 50) + 10,
        updated: Math.floor(Math.random() * 20) + 5,
        totalRows: Math.floor(Math.random() * 100) + 50,
        importedRows: Math.floor(Math.random() * 80) + 40,
        errors: Math.random() > 0.7 ? [
          { order: 'TEST-001', error: 'Демо ошибка: неверный формат даты' },
          { order: 'TEST-002', error: 'Демо ошибка: отсутствует номер чертежа' }
        ] : []
      }
    };
  };

  const handlePreview = (data: any[]) => {
    console.log('👁️ Демо превью данных:', data);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>
          <FileExcelOutlined /> Импорт Excel с выбором колонок
        </Title>
        
        <Alert
          message="🆕 Новая функция: Настраиваемый импорт"
          description="Теперь вы можете выбирать любые колонки из вашего Excel файла и настраивать их соответствие полям заказа. Система автоматически анализирует структуру файла и предлагает оптимальные настройки."
          type="success"
          style={{ marginBottom: 24 }}
          showIcon
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>
              <SettingOutlined /> Возможности нового импорта:
            </Title>
            <ul>
              <li><Text strong>🔍 Автоматический анализ структуры:</Text> Система анализирует заголовки и содержимое колонок</li>
              <li><Text strong>🎯 Умное предложение соответствий:</Text> Автоматически предлагает, какие колонки за что отвечают</li>
              <li><Text strong>📊 Выбор листа:</Text> Возможность выбрать любой лист из Excel файла</li>
              <li><Text strong>⚙️ Гибкая настройка операций:</Text> Настройка колонок операций с указанием количества и формата</li>
              <li><Text strong>✅ Проверка перед импортом:</Text> Превью настроек с возможностью корректировки</li>
              <li><Text strong>📈 Детальная статистика:</Text> Подробная информация о результатах импорта</li>
            </ul>
          </div>

          <Divider />

          <div>
            <Title level={4}>Примеры поддерживаемых структур Excel:</Title>
            <Card size="small" title="Пример 1: Стандартная структура">
              <Text code>
                A: Номер чертежа | B: Количество | C: Срок | D: Приоритет | E: Тип работы | F-K: Операции
              </Text>
            </Card>
            
            <Card size="small" title="Пример 2: Произвольная структура" style={{ marginTop: 8 }}>
              <Text code>
                C: Drawing Number | E: QTY | H: Deadline | K: Priority | L-P: Operations
              </Text>
            </Card>
            
            <Card size="small" title="Пример 3: С дополнительными полями" style={{ marginTop: 8 }}>
              <Text code>
                A: ID | B: Чертеж | C: Описание | D: Кол-во | E: Заказчик | F: Срок | G-N: Операции
              </Text>
            </Card>
          </div>

          <Divider />

          <AdvancedExcelUploader
            onUpload={handleFileUpload}
            onPreview={handlePreview}
            maxFileSize={20}
            title="Демо: Импорт Excel с настройкой колонок"
            description="Загрузите Excel файл и настройте соответствие колонок. Это демо-версия - данные не будут сохранены в реальной базе."
          />
        </Space>
      </Card>
    </div>
  );
};

export default ExcelImportDemo;
