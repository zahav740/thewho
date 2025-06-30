/**
 * @file: ExcelImportTestPage.tsx
 * @description: Тестовая страница для демонстрации новой функциональности импорта Excel
 * @dependencies: antd, react, компоненты импорта
 * @created: 2025-06-25
 */
import React from 'react';
import { Card, Typography, Steps, Row, Col, Alert, Divider, Space, Tag } from 'antd';
import { 
  FileExcelOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  ExperimentOutlined,
  RocketOutlined,
  BulbOutlined
} from '@ant-design/icons';
// Прямой импорт компонентов вместо относительных путей
// import { ExcelUploaderSwitcher } from './Database/components/ExcelUploaderSwitcher';
// import ExcelImportDemo from '../components/ExcelUploader/ExcelImportDemo';

// Вместо этого создадим локальные компоненты для демо
import AdvancedExcelUploader from '../components/ExcelUploader/AdvancedExcelUploader';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const ExcelImportTestPage: React.FC = () => {
  const handleImportSuccess = () => {
    console.log('✅ Импорт успешно завершен!');
  };

  const handleDemoUpload = async (file: File, settings: any) => {
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

  const handleRealUpload = async (file: File, settings: any) => {
    try {
      console.log('🔄 Реальный импорт файла с настройками:', { fileName: file.name, settings });

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
      handleImportSuccess();
      return result;
    } catch (error: any) {
      console.error('❌ Ошибка импорта:', error);
      throw error;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>
          <ExperimentOutlined /> Тестирование нового импорта Excel
        </Title>
        
        <Alert
          message="🎯 Новая функция готова к тестированию!"
          description="Добавлена возможность выбора колонок при импорте Excel файлов. Теперь можно импортировать заказы из файлов любой структуры."
          type="success"
          style={{ marginBottom: 24 }}
          showIcon
        />

        <Row gutter={24}>
          <Col span={24}>
            <Steps size="small" style={{ marginBottom: 32 }}>
              <Step 
                title="Загрузка файла" 
                description="Выберите Excel файл" 
                icon={<FileExcelOutlined />} 
                status="finish"
              />
              <Step 
                title="Анализ структуры" 
                description="Система анализирует колонки" 
                icon={<BulbOutlined />} 
                status="finish"
              />
              <Step 
                title="Настройка маппинга" 
                description="Выберите соответствие колонок" 
                icon={<SettingOutlined />} 
                status="process"
              />
              <Step 
                title="Импорт данных" 
                description="Создание заказов" 
                icon={<CheckCircleOutlined />} 
                status="wait"
              />
            </Steps>
          </Col>
        </Row>

        <Divider orientation="left">🧪 Демо-версия (тестирование без сохранения)</Divider>
        
        <Card size="small" style={{ backgroundColor: '#f0f8ff', marginBottom: 24 }}>
          <Alert
            message="🎯 Демо режим"
            description="Полностью функциональный тест с анализом Excel файлов и настройкой колонок. Данные не сохраняются в базе."
            type="info"
            style={{ marginBottom: 16 }}
            showIcon
          />
          
          <AdvancedExcelUploader
            onUpload={handleDemoUpload}
            maxFileSize={20}
            title="Демо: Импорт Excel с настройкой колонок"
            description="Загрузите Excel файл и настройте соответствие колонок. Это демо-версия."
          />
        </Card>

        <Divider orientation="left">🚀 Рабочая версия (с сохранением в БД)</Divider>
        
        <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
          <Alert
            message="⚠️ Внимание: Рабочая версия"
            description="Этот компонент будет сохранять данные в реальную базу данных. Используйте тестовые данные."
            type="warning"
            style={{ marginBottom: 16 }}
            showIcon
          />
          
          <AdvancedExcelUploader
            onUpload={handleRealUpload}
            maxFileSize={20}
            title="Рабочая версия: Импорт заказов в базу данных"
            description="Настройте соответствие колонок и импортируйте заказы в систему."
          />
        </Card>

        <Divider orientation="left">📋 Инструкция по тестированию</Divider>
        
        <Row gutter={16}>
          <Col span={8}>
            <Card title="1️⃣ Подготовка файла" size="small">
              <Space direction="vertical">
                <Text>Создайте Excel файл с данными заказов:</Text>
                <Text code>A: Номер чертежа</Text>
                <Text code>B: Количество</Text>
                <Text code>C: Срок выполнения</Text>
                <Text code>D: Приоритет</Text>
                <Text code>E: Тип работы</Text>
                <Text code>F-I: Операции</Text>
              </Space>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="2️⃣ Тестирование" size="small">
              <Space direction="vertical">
                <Text>Попробуйте оба режима:</Text>
                <Tag color="blue">Демо-режим</Tag>
                <Text type="secondary">Без сохранения данных</Text>
                <Tag color="green">Рабочий режим</Tag>
                <Text type="secondary">С сохранением в БД</Text>
              </Space>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="3️⃣ Проверка результатов" size="small">
              <Space direction="vertical">
                <Text>После импорта проверьте:</Text>
                <Text>• Количество созданных заказов</Text>
                <Text>• Правильность маппинга данных</Text>
                <Text>• Обработку ошибок</Text>
                <Text>• Статистику импорта</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">🔧 Технические детали</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Backend API" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text code>POST /api/orders/analyze-excel</Text>
                <Text type="secondary">Анализ структуры Excel файла</Text>
                <Text code>POST /api/orders/import-excel-with-mapping</Text>
                <Text type="secondary">Импорт с пользовательским маппингом</Text>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Frontend компоненты" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text code>ExcelColumnMapper</Text>
                <Text type="secondary">Мастер настройки колонок</Text>
                <Text code>AdvancedExcelUploader</Text>
                <Text type="secondary">Улучшенный загрузчик файлов</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Alert
          message="📝 Обратная связь"
          description="После тестирования сообщите о найденных проблемах или предложениях по улучшению функциональности."
          type="info"
          style={{ marginTop: 24 }}
          showIcon
        />
      </Card>
    </div>
  );
};

export default ExcelImportTestPage;
