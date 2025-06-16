/**
 * @file: OperationTestPage.tsx
 * @description: Тестовая страница для проверки системы управления операциями
 * @created: 2025-06-11
 */
import React, { useState } from 'react';
import { Card, Row, Col, Select, Button, Space, message } from 'antd';
import SimpleOperationManagement from '../components/SimpleOperationManagement';

const OperationTestPage: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Примеры заказов для тестирования
  const testOrders = [
    {
      id: 1,
      drawing_number: 'C6HP0021A',
      quantity: 30,
      workType: 'MILLING',
      description: 'Заказ с существующими операциями'
    },
    {
      id: 34,
      drawing_number: 'CH1JK281A',
      quantity: 11,
      workType: 'MIXED',
      description: 'Заказ без операций'
    },
    {
      id: 35,
      drawing_number: 'E-87019',
      quantity: 20,
      workType: 'TURNING',
      description: 'Заказ без операций'
    }
  ];

  const handleOrderSelect = (orderId: number) => {
    const order = testOrders.find(o => o.id === orderId);
    setSelectedOrder(order);
    message.info(`Выбран заказ: ${order?.drawing_number}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="🧪 Тестирование системы управления операциями">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Выберите заказ для тестирования:</strong>
              </div>
              <Select
                style={{ width: 400 }}
                placeholder="Выберите заказ"
                onChange={handleOrderSelect}
              >
                {testOrders.map(order => (
                  <Select.Option key={order.id} value={order.id}>
                    {order.drawing_number} - {order.description}
                  </Select.Option>
                ))}
              </Select>
              
              {selectedOrder && (
                <div style={{ marginTop: 16 }}>
                  <strong>Информация о заказе:</strong>
                  <ul>
                    <li>Чертеж: {selectedOrder.drawing_number}</li>
                    <li>Количество: {selectedOrder.quantity} шт</li>
                    <li>Тип работы: {selectedOrder.workType}</li>
                  </ul>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {selectedOrder && (
          <Col span={24}>
            <SimpleOperationManagement
              orderId={selectedOrder.id}
              orderData={{
                drawing_number: selectedOrder.drawing_number,
                quantity: selectedOrder.quantity,
                workType: selectedOrder.workType
              }}
            />
          </Col>
        )}

        <Col span={24}>
          <Card title="📋 Инструкция по тестированию" size="small">
            <ol>
              <li><strong>Выберите заказ</strong> из списка выше</li>
              <li><strong>Нажмите "Рекомендации"</strong> - система покажет предложения на основе похожих заказов</li>
              <li><strong>Нажмите "Добавить операцию"</strong> - создайте новую операцию</li>
              <li><strong>Используйте рекомендации</strong> - нажмите "Применить" в модальном окне рекомендаций</li>
              <li><strong>Сохраните операцию</strong> - данные автоматически сохранятся для будущих рекомендаций</li>
            </ol>
            
            <div style={{ marginTop: 16 }}>
              <strong>Ожидаемое поведение:</strong>
              <ul>
                <li>Для заказа <code>C6HP0021A</code> должны быть рекомендации (есть похожие операции)</li>
                <li>Для новых заказов рекомендации будут ограниченными (мало данных)</li>
                <li>После создания операций система запомнит их для будущих рекомендаций</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OperationTestPage;
