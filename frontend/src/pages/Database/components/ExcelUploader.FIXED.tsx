/**
 * @file: ExcelUploader.FIXED.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
 * @description: Компонент загрузки Excel файлов с корректными фильтрами и проверкой дубликатов
 * @dependencies: antd, ordersApi
 * @created: 2025-01-28
 * @updated: 2025-07-08 - ИСПРАВЛЕНЫ цветовые фильтры и добавлена проверка дубликатов
 */
import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  Modal, 
  Tag, 
  Checkbox, 
  Space, 
  message, 
  Progress, 
  Alert,
  Radio,
  Table,
  Divider,
  Typography,
  Card
} from 'antd';
import { 
  FileExcelOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import type { UploadProps, RcFile } from 'antd/es/upload';
import { ordersApi } from '../../../services/ordersApi';

const { Text, Title } = Typography;

interface ExcelUploaderProps {
  onSuccess: () => void;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  duplicates: Array<{ 
    drawingNumber: string; 
    action: 'update' | 'skip'; 
    existingOrder: any;
  }>;
  errors: Array<{ order: string; error: string }>;
}

// ИСПРАВЛЕНО: Точные значения цветов для Excel
const COLOR_FILTERS = [
  { 
    label: 'Зеленый (светлый)', 
    value: 'FF00FF00', 
    color: '#00FF00',
    description: 'Яркий зеленый'
  },
  { 
    label: 'Зеленый (темный)', 
    value: 'FF008000', 
    color: '#008000',
    description: 'Темный зеленый'
  },
  { 
    label: 'Зеленый (Excel)', 
    value: 'FF92D050', 
    color: '#92D050',
    description: 'Стандартный зеленый Excel'
  },
  { 
    label: 'Желтый', 
    value: 'FFFFFF00', 
    color: '#FFFF00',
    description: 'Желтый'
  },
  { 
    label: 'Желтый (Excel)', 
    value: 'FFFFF2CC', 
    color: '#FFF2CC',
    description: 'Стандартный желтый Excel'
  },
  { 
    label: 'Красный', 
    value: 'FFFF0000', 
    color: '#FF0000',
    description: 'Красный'
  },
  { 
    label: 'Красный (Excel)', 
    value: 'FFFFC7CE', 
    color: '#FFC7CE',
    description: 'Стандартный красный Excel'
  },
  { 
    label: 'Синий', 
    value: 'FF0000FF', 
    color: '#0000FF',
    description: 'Синий'
  },
  { 
    label: 'Синий (Excel)', 
    value: 'FFDAEEF3', 
    color: '#DAEEF3',
    description: 'Стандартный синий Excel'
  },
];

export const ExcelUploaderFixed: React.FC<ExcelUploaderProps> = ({ onSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<'ask' | 'update' | 'skip'>('ask');
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState<ImportResult['duplicates']>([]);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';

    if (!isExcel) {
      message.error('Можно загружать только Excel файлы!');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Файл должен быть меньше 10MB!');
      return false;
    }

    setSelectedFile(file);
    setShowModal(true);
    return false;
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setImportResult(null);

    try {
      console.log('🚀 Начинаем импорт с настройками:', {
        file: selectedFile.name,
        colorFilters: selectedColors,
        duplicateAction
      });

      // Формируем опции для импорта
      const importOptions = {
        colorFilters: selectedColors,
        duplicateAction,
        autoConfirmDuplicates: duplicateAction !== 'ask'
      };

      // ИСПРАВЛЕНО: Отправляем файл с опциями
      const formData = new FormData();
      formData.append('excel', selectedFile);
      formData.append('options', JSON.stringify(importOptions));

      const response = await fetch('/api/orders/upload-excel-fixed', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const result: ImportResult = await response.json();
      
      console.log('📊 Результат импорта:', result);
      setImportResult(result);
      
      // Если есть дубликаты и выбран режим 'ask', показываем модальное окно
      if (result.duplicates.length > 0 && duplicateAction === 'ask') {
        setPendingDuplicates(result.duplicates);
        setShowDuplicateModal(true);
      } else {
        // Показываем обычный результат
        showImportResults(result);
      }
      
    } catch (error: any) {
      console.error('❌ Ошибка импорта:', error);
      message.error(`Ошибка при импорте файла: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const showImportResults = (result: ImportResult) => {
    const total = result.created + result.updated;
    
    if (result.errors.length === 0) {
      message.success(
        `Импорт завершен: создано ${result.created}, обновлено ${result.updated}, пропущено ${result.skipped}`
      );
      setShowModal(false);
      onSuccess();
    } else {
      message.warning(
        `Импорт завершен с ошибками: создано ${result.created}, обновлено ${result.updated}, ошибок ${result.errors.length}`
      );
    }
  };

  const handleDuplicateResolution = async (resolutions: Record<string, 'update' | 'skip'>) => {
    try {
      // Отправляем решения на сервер
      const response = await fetch('/api/orders/resolve-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duplicates: pendingDuplicates,
          resolutions
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const result = await response.json();
      
      message.success('Дубликаты обработаны');
      setShowDuplicateModal(false);
      setShowModal(false);
      onSuccess();
      
    } catch (error: any) {
      console.error('❌ Ошибка обработки дубликатов:', error);
      message.error(`Ошибка обработки дубликатов: ${error.message}`);
    }
  };

  const handleModalClose = () => {
    if (!uploading) {
      setShowModal(false);
      setSelectedFile(null);
      setSelectedColors([]);
      setImportResult(null);
    }
  };

  const renderImportResult = () => {
    if (!importResult) return null;

    const total = importResult.created + importResult.updated + importResult.skipped;
    const successRate = importResult.errors.length === 0 ? 100 : 
      Math.round(((total - importResult.errors.length) / total) * 100);

    return (
      <div style={{ marginTop: 16 }}>
        <Progress
          percent={successRate}
          status={importResult.errors.length > 0 ? 'exception' : 'success'}
        />
        
        <Space direction="vertical" style={{ marginTop: 16, width: '100%' }}>
          <div>
            <Tag color="success">Создано: {importResult.created}</Tag>
            <Tag color="processing">Обновлено: {importResult.updated}</Tag>
            <Tag color="warning">Пропущено: {importResult.skipped}</Tag>
            {importResult.duplicates.length > 0 && (
              <Tag color="orange">Дубликатов: {importResult.duplicates.length}</Tag>
            )}
            {importResult.errors.length > 0 && (
              <Tag color="error">Ошибок: {importResult.errors.length}</Tag>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div>
              <h4>Ошибки импорта:</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {importResult.errors.map((error, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Tag color="error">{error.order}</Tag>
                    <span style={{ color: '#ff4d4f' }}>{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Space>
      </div>
    );
  };

  return (
    <>
      <Upload
        beforeUpload={beforeUpload}
        showUploadList={false}
        accept=".xlsx,.xls"
      >
        <Button icon={<FileExcelOutlined />}>
          🔧 Исправленный импорт из Excel
        </Button>
      </Upload>

      {/* Основное модальное окно настроек */}
      <Modal
        title="🔧 Исправленный импорт заказов из Excel"
        open={showModal}
        onCancel={handleModalClose}
        footer={[
          <Button key="cancel" onClick={handleModalClose} disabled={uploading}>
            Отмена
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={uploading}
            onClick={handleImport}
            disabled={!selectedFile || (importResult !== null && importResult.errors.length === 0)}
          >
            {importResult && importResult.errors.length === 0 ? 'Готово' : 'Импортировать'}
          </Button>,
        ]}
        width={800}
      >
        {selectedFile && (
          <div>
            <Alert
              message="✅ Исправления в этой версии"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>🎨 Исправлена проверка цветовых фильтров (зеленый цвет теперь работает)</li>
                  <li>🔄 Добавлена проверка дубликатов с выбором действия</li>
                  <li>💾 Безопасное обновление (сохраняются операции для заказов в работе)</li>
                  <li>📊 Подробная диагностика цветов в файле</li>
                </ul>
              }
              type="success"
              style={{ marginBottom: 16 }}
              showIcon
            />

            <p>
              <FileExcelOutlined /> <strong>{selectedFile.name}</strong>
            </p>

            {/* Настройки цветовых фильтров */}
            <Card size="small" style={{ marginTop: 16 }}>
              <Title level={5}>🎨 Цветовые фильтры</Title>
              <Text type="secondary">
                Выберите цвета строк для импорта (если не выбрано - импортируются все):
              </Text>
              
              <Checkbox.Group
                value={selectedColors}
                onChange={setSelectedColors}
                style={{ marginTop: 8, width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {COLOR_FILTERS.map((filter) => (
                    <div key={filter.value} style={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox value={filter.value}>
                        <Space>
                          <div 
                            style={{ 
                              width: 20, 
                              height: 20, 
                              backgroundColor: filter.color,
                              border: '1px solid #ccc',
                              borderRadius: 4
                            }} 
                          />
                          <span>{filter.label}</span>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ({filter.description})
                          </Text>
                        </Space>
                      </Checkbox>
                    </div>
                  ))}
                </Space>
              </Checkbox.Group>
              
              {selectedColors.length > 0 && (
                <Alert
                  message={`Выбрано фильтров: ${selectedColors.length}`}
                  type="info"
                  style={{ marginTop: 8 }}
                  showIcon
                />
              )}
            </Card>

            {/* Настройки дубликатов */}
            <Card size="small" style={{ marginTop: 16 }}>
              <Title level={5}>🔄 Обработка дубликатов</Title>
              <Text type="secondary">
                Что делать если заказ с таким номером чертежа уже существует:
              </Text>
              
              <Radio.Group 
                value={duplicateAction} 
                onChange={(e) => setDuplicateAction(e.target.value)}
                style={{ marginTop: 8 }}
              >
                <Space direction="vertical">
                  <Radio value="ask">
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                      <span><strong>Спрашивать</strong> - показать список дубликатов для выбора</span>
                    </Space>
                  </Radio>
                  <Radio value="update">
                    <Space>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      <span><strong>Обновлять</strong> - автоматически обновить существующие заказы</span>
                    </Space>
                  </Radio>
                  <Radio value="skip">
                    <Space>
                      <WarningOutlined style={{ color: '#ff4d4f' }} />
                      <span><strong>Пропускать</strong> - оставить существующие заказы без изменений</span>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
              
              {duplicateAction === 'update' && (
                <Alert
                  message="Безопасное обновление"
                  description="Для заказов в работе будут обновлены только основные данные (количество, срок, приоритет). Операции сохранятся."
                  type="info"
                  style={{ marginTop: 8 }}
                  showIcon
                />
              )}
            </Card>
          </div>
        )}

        {renderImportResult()}
      </Modal>

      {/* Модальное окно разрешения дубликатов */}
      <DuplicateResolutionModal
        visible={showDuplicateModal}
        duplicates={pendingDuplicates}
        onResolve={handleDuplicateResolution}
        onCancel={() => setShowDuplicateModal(false)}
      />
    </>
  );
};

// Компонент для разрешения дубликатов
interface DuplicateResolutionModalProps {
  visible: boolean;
  duplicates: ImportResult['duplicates'];
  onResolve: (resolutions: Record<string, 'update' | 'skip'>) => void;
  onCancel: () => void;
}

const DuplicateResolutionModal: React.FC<DuplicateResolutionModalProps> = ({
  visible,
  duplicates,
  onResolve,
  onCancel
}) => {
  const [resolutions, setResolutions] = useState<Record<string, 'update' | 'skip'>>({});

  const handleResolutionChange = (drawingNumber: string, action: 'update' | 'skip') => {
    setResolutions(prev => ({
      ...prev,
      [drawingNumber]: action
    }));
  };

  const handleApplyAll = (action: 'update' | 'skip') => {
    const allResolutions: Record<string, 'update' | 'skip'> = {};
    duplicates.forEach(dup => {
      allResolutions[dup.drawingNumber] = action;
    });
    setResolutions(allResolutions);
  };

  const handleConfirm = () => {
    onResolve(resolutions);
  };

  const columns = [
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      width: 200,
    },
    {
      title: 'Существующий заказ',
      key: 'existing',
      render: (record: any) => (
        <div>
          <div>ID: {record.existingOrder.id}</div>
          <div>Статус: <Tag>{record.existingOrder.status}</Tag></div>
          <div>Количество: {record.existingOrder.quantity}</div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Действие',
      key: 'action',
      render: (record: any) => (
        <Radio.Group
          value={resolutions[record.drawingNumber]}
          onChange={(e) => handleResolutionChange(record.drawingNumber, e.target.value)}
        >
          <Radio value="update">Обновить</Radio>
          <Radio value="skip">Пропустить</Radio>
        </Radio.Group>
      ),
      width: 200,
    },
  ];

  return (
    <Modal
      title={`🔄 Найдено дубликатов: ${duplicates.length}`}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button 
          key="update-all" 
          onClick={() => handleApplyAll('update')}
        >
          Обновить все
        </Button>,
        <Button 
          key="skip-all" 
          onClick={() => handleApplyAll('skip')}
        >
          Пропустить все
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={Object.keys(resolutions).length !== duplicates.length}
        >
          Применить
        </Button>,
      ]}
    >
      <Alert
        message="Обнаружены дубликаты"
        description="Заказы с указанными номерами чертежей уже существуют. Выберите действие для каждого:"
        type="warning"
        style={{ marginBottom: 16 }}
        showIcon
      />

      <Table
        dataSource={duplicates}
        columns={columns}
        rowKey="drawingNumber"
        pagination={false}
        size="small"
      />
    </Modal>
  );
};
