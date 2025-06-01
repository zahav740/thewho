/**
 * @file: ModernExcelUploader.tsx
 * @description: Современный компонент загрузки Excel для базы данных заказов
 * @dependencies: antd, ordersApi, ModernExcelUploader
 * @created: 2025-05-28
 */
import React, { useState } from 'react';
import { Button, Modal, Tag, Checkbox, Space, message, Row, Col, Alert, Card } from 'antd';
import { FileExcelOutlined, CloudUploadOutlined, SettingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ModernExcelUploader } from '../../../components/ExcelUploader';
import { ordersApi } from '../../../services/ordersApi';

interface ExcelUploaderProps {
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  result: {
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; drawingNumber: string; error: string }>;
  };
}

const COLOR_FILTERS = [
  { label: 'Зеленый (Приоритет 1)', value: 'green', color: '#52c41a', description: 'Срочные заказы' },
  { label: 'Желтый (Приоритет 2)', value: 'yellow', color: '#faad14', description: 'Обычные заказы' },
  { label: 'Красный (Критический)', value: 'red', color: '#ff4d4f', description: 'Критичные заказы' },
  { label: 'Синий (Плановые)', value: 'blue', color: '#1890ff', description: 'Плановые заказы' },
];

const COLUMN_MAPPING = {
  drawingNumber: 'C',
  revision: 'D', 
  quantity: 'E',
  deadline: 'H',
  priority: 'K'
};

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onSuccess }) => {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (file: File, data?: any[]) => {
    try {
      // Отправляем файл на backend с настройками
      const formData = new FormData();
      formData.append('excel', file);
      formData.append('columnMapping', JSON.stringify(COLUMN_MAPPING));
      
      const response = await fetch('/api/orders/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResult = await response.json();
      
      setLastImportResult(result);
      
      if (result.success) {
        message.success(result.message);
        onSuccess();
      } else {
        message.error(result.message || 'Ошибка при импорте');
      }

      return result;
    } catch (error) {
      console.error('Import error:', error);
      const errorResult = {
        success: false,
        message: 'Ошибка при загрузке файла',
        result: { created: 0, updated: 0, skipped: 0, errors: [] }
      };
      setLastImportResult(errorResult);
      throw error;
    }
  };

  const handlePreview = (data: any[]) => {
    console.log('Предварительный просмотр данных:', data);
  };

  const openAdvancedSettings = () => {
    setShowAdvancedModal(true);
  };

  return (
    <>
      <Space>
        <ModernExcelUploader
          onUpload={handleFileUpload}
          onPreview={handlePreview}
          title="Загрузка заказов из Excel"
          description="Перетащите Excel файл с заказами или нажмите для выбора"
          maxFileSize={10}
          acceptedFormats={['.xlsx', '.xls']}
          showPreview={true}
          showColumnMapping={true}
          columnMapping={COLUMN_MAPPING}
        />
        
        <Button 
          icon={<SettingOutlined />}
          onClick={openAdvancedSettings}
          title="Дополнительные настройки импорта"
        >
          Настройки
        </Button>
      </Space>

      {/* Модальное окно дополнительных настроек */}
      <Modal
        title={
          <Space>
            <SettingOutlined />
            Дополнительные настройки импорта
          </Space>
        }
        open={showAdvancedModal}
        onCancel={() => setShowAdvancedModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowAdvancedModal(false)}>
            Закрыть
          </Button>
        ]}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Фильтры по цветам */}
          <Card size="small" title="Фильтры по цветам строк">
            <Alert
              message="Фильтрация по цветам"
              description="Выберите какие цветные строки импортировать. Если ничего не выбрано - импортируются все строки."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Checkbox.Group
              value={selectedColors}
              onChange={setSelectedColors}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                {COLOR_FILTERS.map((filter) => (
                  <Col span={12} key={filter.value}>
                    <Checkbox value={filter.value}>
                      <Space>
                        <Tag color={filter.color}>{filter.label}</Tag>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {filter.description}
                        </span>
                      </Space>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Card>

          {/* Маппинг колонок */}
          <Card size="small" title="Маппинг колонок Excel">
            <Alert
              message="Соответствие колонок"
              description="Настройка того, какие колонки Excel соответствуют полям заказов."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={[16, 8]}>
              <Col span={8}><strong>Поле заказа</strong></Col>
              <Col span={8}><strong>Колонка Excel</strong></Col>
              <Col span={8}><strong>Описание</strong></Col>
              
              <Col span={8}>Номер чертежа</Col>
              <Col span={8}><Tag color="blue">Колонка C</Tag></Col>
              <Col span={8}>Уникальный номер чертежа</Col>
              
              <Col span={8}>Ревизия</Col>
              <Col span={8}><Tag color="blue">Колонка D</Tag></Col>
              <Col span={8}>Версия чертежа</Col>
              
              <Col span={8}>Количество</Col>
              <Col span={8}><Tag color="blue">Колонка E</Tag></Col>
              <Col span={8}>Количество изделий</Col>
              
              <Col span={8}>Дедлайн</Col>
              <Col span={8}><Tag color="blue">Колонка H</Tag></Col>
              <Col span={8}>Срок выполнения</Col>
              
              <Col span={8}>Приоритет</Col>
              <Col span={8}><Tag color="blue">Колонка K</Tag></Col>
              <Col span={8}>Приоритет заказа (1-3)</Col>
            </Row>
          </Card>

          {/* Результат последнего импорта */}
          {lastImportResult && (
            <Card 
              size="small" 
              title={
                <Space>
                  {lastImportResult.success ? 
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  }
                  Результат последнего импорта
                </Space>
              }
            >
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {lastImportResult.result.created}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Создано</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {lastImportResult.result.updated}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Обновлено</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      {lastImportResult.result.skipped}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Пропущено</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                      {lastImportResult.result.errors.length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Ошибок</div>
                  </div>
                </Col>
              </Row>
              
              {lastImportResult.result.errors.length > 0 && (
                <Alert
                  message="Ошибки импорта"
                  description={
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {lastImportResult.result.errors.map((error, index) => (
                        <div key={index} style={{ marginBottom: '4px' }}>
                          <Tag color="red">Строка {error.row}</Tag>
                          <strong>{error.drawingNumber}</strong>: {error.error}
                        </div>
                      ))}
                    </div>
                  }
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          )}
        </Space>
      </Modal>
    </>
  );
};
