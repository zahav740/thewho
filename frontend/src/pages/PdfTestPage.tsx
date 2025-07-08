/**
 * @file: PdfTestPage.tsx
 * @description: Тестовая страница для демонстрации функциональности PDF
 * @created: 2025-07-07
 */
import React, { useState } from 'react';
import { Card, Space, Typography, Divider, Button, Table, Input } from 'antd';
import { FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import { PdfPreview } from '../components/common';

const { Title, Text } = Typography;

interface TestOrder {
  id: number;
  drawingNumber: string;
  quantity: number;
  deadline: string;
  pdfPath?: string | null; // Допускаем null
}

export const PdfTestPage: React.FC = () => {
  const [orders, setOrders] = useState<TestOrder[]>([
    {
      id: 1,
      drawingNumber: 'DWG-001-2025',
      quantity: 5,
      deadline: '2025-07-15',
      pdfPath: null // Нет PDF
    },
    {
      id: 2,
      drawingNumber: 'DWG-002-2025',
      quantity: 10,
      deadline: '2025-07-20',
      pdfPath: '/pdfs/DWG-002-2025/drawing.pdf' // Есть PDF
    },
    {
      id: 3,
      drawingNumber: 'DWG-003-2025',
      quantity: 3,
      deadline: '2025-07-10',
      pdfPath: null // Нет PDF
    }
  ]);

  const [newDrawingNumber, setNewDrawingNumber] = useState('');

  const handlePdfUpdate = (orderId: number, pdfPath: string | null) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, pdfPath } : order
    ));
  };

  const addTestOrder = () => {
    if (!newDrawingNumber.trim()) return;
    
    const newOrder: TestOrder = {
      id: orders.length + 1,
      drawingNumber: newDrawingNumber.trim(),
      quantity: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pdfPath: null
    };
    
    setOrders(prev => [...prev, newOrder]);
    setNewDrawingNumber('');
  };

  const columns = [
    {
      title: 'PDF',
      key: 'pdf',
      width: 80,
      render: (_: any, record: TestOrder) => (
        <PdfPreview
          orderId={record.id}
          drawingNumber={record.drawingNumber}
          pdfPath={record.pdfPath || undefined}
          onPdfUpdate={(pdfPath) => handlePdfUpdate(record.id, pdfPath)}
          size="small"
        />
      )
    },
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      render: (text: string, record: TestOrder) => (
        <Space>
          <Text strong>{text}</Text>
          {record.pdfPath && (
            <FilePdfOutlined style={{ color: '#1890ff' }} title="PDF доступен" />
          )}
        </Space>
      )
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120
    },
    {
      title: 'Статус PDF',
      key: 'pdfStatus',
      width: 120,
      render: (_: any, record: TestOrder) => (
        record.pdfPath ? (
          <Text type="success">PDF загружен</Text>
        ) : (
          <Text type="secondary">Нет PDF</Text>
        )
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <FilePdfOutlined style={{ marginRight: 8 }} />
        Тестирование функциональности PDF
      </Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="Описание функциональности" size="small">
          <Space direction="vertical">
            <Text>
              🔧 <strong>Загрузка PDF:</strong> PDF файлы сохраняются в папках с названием = номер чертежа
            </Text>
            <Text>
              🔍 <strong>Проверка дубликатов:</strong> Проверка по номеру чертежа и хешу файла
            </Text>
            <Text>
              👁️ <strong>Превью:</strong> Миниатюра PDF рядом с номером чертежа с возможностью просмотра
            </Text>
            <Text>
              ♻️ <strong>Управление:</strong> Возможность использовать существующий файл или перезаписать
            </Text>
          </Space>
        </Card>

        <Card title="Добавить тестовый заказ" size="small">
          <Space>
            <Input
              placeholder="Номер чертежа (например: DWG-004-2025)"
              value={newDrawingNumber}
              onChange={(e) => setNewDrawingNumber(e.target.value)}
              onPressEnter={addTestOrder}
              style={{ width: 300 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={addTestOrder}
              disabled={!newDrawingNumber.trim()}
            >
              Добавить заказ
            </Button>
          </Space>
        </Card>

        <Card title={`Список заказов (${orders.length})`} size="small">
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Инструкции по тестированию" size="small">
          <Space direction="vertical">
            <Text>
              1. <strong>Наведите курсор</strong> на кнопку PDF рядом с номером чертежа - появится меню действий
            </Text>
            <Text>
              2. <strong>Загрузите PDF</strong> - выберите "Загрузить PDF" и добавьте файл
            </Text>
            <Text>
              3. <strong>Просмотрите PDF</strong> - после загрузки кнопка станет синей, наведите курсор и выберите "Просмотр PDF"
            </Text>
            <Text>
              4. <strong>Проверьте дубликаты</strong> - попробуйте загрузить PDF для заказа с тем же номером чертежа
            </Text>
            <Text>
              5. <strong>Удалите PDF</strong> - используйте "Удалить PDF" в меню действий
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default PdfTestPage;