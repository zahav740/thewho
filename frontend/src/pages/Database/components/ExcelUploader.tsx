/**
 * @file: ExcelUploader.tsx
 * @description: Компонент загрузки Excel файлов
 * @dependencies: antd, ordersApi
 * @created: 2025-01-28
 */
import React, { useState } from 'react';
import { Upload, Button, Modal, Tag, Checkbox, Space, message, Progress } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps, RcFile } from 'antd/es/upload';
import { ordersApi } from '../../../services/ordersApi';

interface ExcelUploaderProps {
  onSuccess: () => void;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ order: string; error: string }>;
}

const COLOR_FILTERS = [
  { label: 'Зеленый', value: 'FF00FF00', color: '#00FF00' },
  { label: 'Желтый', value: 'FFFFFF00', color: '#FFFF00' },
  { label: 'Красный', value: 'FFFF0000', color: '#FF0000' },
  { label: 'Синий', value: 'FF0000FF', color: '#0000FF' },
];

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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
      const result = await ordersApi.importExcel(
        selectedFile,
        selectedColors.length > 0 ? selectedColors : undefined
      );
      
      setImportResult(result);
      
      if (result.errors.length === 0) {
        message.success(
          `Импорт завершен: создано ${result.created}, обновлено ${result.updated} заказов`
        );
        setShowModal(false);
        onSuccess();
      }
    } catch (error) {
      message.error('Ошибка при импорте файла');
    } finally {
      setUploading(false);
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

    const total = importResult.created + importResult.updated;
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
          Импорт из Excel
        </Button>
      </Upload>

      <Modal
        title="Импорт заказов из Excel"
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
        width={600}
      >
        {selectedFile && (
          <div>
            <p>
              <FileExcelOutlined /> <strong>{selectedFile.name}</strong>
            </p>
            <p style={{ marginTop: 16 }}>
              Выберите цвета строк для импорта (если не выбрано - импортируются все):
            </p>
            <Checkbox.Group
              value={selectedColors}
              onChange={setSelectedColors}
              style={{ marginTop: 8 }}
            >
              <Space direction="vertical">
                {COLOR_FILTERS.map((filter) => (
                  <Checkbox key={filter.value} value={filter.value}>
                    <Tag color={filter.color}>{filter.label}</Tag>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
        )}

        {renderImportResult()}
      </Modal>
    </>
  );
};
