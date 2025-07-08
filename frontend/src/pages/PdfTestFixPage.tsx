/**
 * @file: PdfTestFixPage.tsx
 * @description: Страница для тестирования исправлений PDF
 * @created: 2025-07-07
 */
import React, { useState } from 'react';
import { Card, Button, Input, Space, message, Alert, Typography } from 'antd';
import { ToolOutlined, EyeOutlined, BugOutlined } from '@ant-design/icons';
import { ordersApi } from '../services/ordersApi';

const { Title, Text } = Typography;

export const PdfTestFixPage: React.FC = () => {
  const [orderId, setOrderId] = useState<string>('91');
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);

  const runDiagnostics = async () => {
    if (!orderId) {
      message.error('Введите ID заказа');
      return;
    }

    setLoading(true);
    try {
      const result = await ordersApi.getPdfInfo(parseInt(orderId));
      setDiagnostics(result);
      console.log('🔍 Диагностика:', result);
    } catch (error: any) {
      message.error(`Ошибка диагностики: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixPdf = async () => {
    if (!orderId) {
      message.error('Введите ID заказа');
      return;
    }

    setLoading(true);
    try {
      const result = await ordersApi.fixPdfPath(parseInt(orderId));
      setFixResult(result);
      console.log('🔧 Результат исправления:', result);
      
      if (result.success) {
        message.success('PDF успешно исправлен!');
      } else {
        message.warning('Не удалось автоматически исправить PDF');
      }
    } catch (error: any) {
      message.error(`Ошибка исправления: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openPdf = () => {
    if (!orderId) {
      message.error('Введите ID заказа');
      return;
    }

    const pdfUrl = ordersApi.getPdfUrlFixed(parseInt(orderId));
    window.open(pdfUrl, '_blank');
  };

  const openOriginalPdf = () => {
    if (!orderId) {
      message.error('Введите ID заказа');
      return;
    }

    const pdfUrl = ordersApi.getPdfUrl(parseInt(orderId));
    window.open(pdfUrl, '_blank');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🔧 Тест исправления PDF модуля</Title>
      
      <Card title="Управление" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>ID заказа для тестирования:</Text>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Введите ID заказа"
              style={{ width: '200px', marginLeft: '8px' }}
            />
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<BugOutlined />}
              onClick={runDiagnostics}
              loading={loading}
            >
              Диагностика
            </Button>
            
            <Button 
              type="default" 
              icon={<ToolOutlined />}
              onClick={fixPdf}
              loading={loading}
            >
              Исправить PDF
            </Button>
            
            <Button 
              type="default" 
              icon={<EyeOutlined />}
              onClick={openPdf}
            >
              Открыть PDF (исправленный)
            </Button>
            
            <Button 
              type="dashed" 
              icon={<EyeOutlined />}
              onClick={openOriginalPdf}
            >
              Открыть PDF (оригинальный)
            </Button>
          </Space>
        </Space>
      </Card>

      {diagnostics && (
        <Card title="🔍 Результаты диагностики" style={{ marginBottom: '24px' }}>
          <Alert
            message={diagnostics.physicalFileExists ? 'PDF файл найден' : 'PDF файл НЕ найден'}
            type={diagnostics.physicalFileExists ? 'success' : 'error'}
            style={{ marginBottom: '16px' }}
          />
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Информация о заказе:</Text>
            <ul>
              <li>ID заказа: {diagnostics.orderId}</li>
              <li>Номер чертежа: {diagnostics.drawingNumber}</li>
              <li>Путь в БД: {diagnostics.pdfPath || 'Не указан'}</li>
              <li>Папка загрузок: {diagnostics.uploadDirectory}</li>
            </ul>
          </div>

          {diagnostics.searchResults && diagnostics.searchResults.length > 0 && (
            <div>
              <Text strong>Найденные файлы:</Text>
              <ul>
                {diagnostics.searchResults.map((result: any, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {result.path}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Существует: {result.exists ? '✅ Да' : '❌ Нет'}
                      {result.size && ` | Размер: ${Math.round(result.size / 1024)} KB`}
                      {result.modified && ` | Изменен: ${new Date(result.modified).toLocaleString()}`}
                      {result.possibleMatch && <span style={{ color: '#1890ff' }}> | 🎯 Возможное совпадение</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {fixResult && (
        <Card title="🔧 Результат исправления">
          <Alert
            message={fixResult.success ? 'Исправление выполнено успешно' : 'Не удалось исправить автоматически'}
            type={fixResult.success ? 'success' : 'warning'}
            style={{ marginBottom: '16px' }}
          />
          
          {fixResult.success && (
            <div>
              <ul>
                <li>ID заказа: {fixResult.orderId}</li>
                <li>Номер чертежа: {fixResult.drawingNumber}</li>
                <li>Старый путь: {fixResult.oldPath || 'Не указан'}</li>
                <li>Новый путь: {fixResult.newPath}</li>
                <li>Имя файла: {fixResult.fileName}</li>
              </ul>
            </div>
          )}
          
          <Text>{fixResult.message}</Text>
        </Card>
      )}
    </div>
  );
};

export default PdfTestFixPage;
