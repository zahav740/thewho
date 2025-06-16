/**
 * @file: SimpleOperationManagement.tsx
 * @description: Упрощенный компонент для управления операциями (без внешних зависимостей)
 * @dependencies: antd
 * @created: 2025-06-11
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Space,
  message,
  Row,
  Col,
  Tag,
  Alert,
  Typography,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface Operation {
  id: number;
  operationNumber: number;
  operationType: 'MILLING' | 'TURNING';
  estimatedTime: number;
  machineAxes?: number;
  status: string;
  completedUnits?: number;
  totalUnits?: number;
  progressPercentage?: number;
  assignedMachine?: string;
}

interface OperationSuggestion {
  operationType: string;
  estimatedTime: number;
  confidence: number;
  basedOnOperations: number;
  similarOrders: string[];
}

interface SimpleOperationManagementProps {
  orderId: number;
  orderData: {
    drawing_number: string;
    quantity: number;
    workType?: string;
  };
}

export const SimpleOperationManagement: React.FC<SimpleOperationManagementProps> = ({
  orderId,
  orderData
}) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [suggestions, setSuggestions] = useState<OperationSuggestion[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Загрузка операций заказа
  const loadOperations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/operation-management/order/${orderId}/operations`);
      const data = await response.json();
      
      if (data.success) {
        setOperations(data.data);
      } else {
        message.error('Ошибка загрузки операций');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      message.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка рекомендаций
  const loadSuggestions = async () => {
    try {
      const params = new URLSearchParams({
        orderDrawingNumber: orderData.drawing_number,
        orderQuantity: orderData.quantity.toString(),
        ...(orderData.workType && { workType: orderData.workType })
      });
      
      const response = await fetch(`/api/operation-management/suggestions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций:', error);
    }
  };

  // Создание операции
  const createOperation = async (values: any) => {
    try {
      const response = await fetch('/api/operation-management/operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, orderId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success('Операция создана успешно');
        setModalVisible(false);
        form.resetFields();
        loadOperations();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error('Ошибка создания операции:', error);
      message.error('Ошибка при создании операции');
    }
  };

  // Обновление операции
  const updateOperation = async (operationId: number, values: any) => {
    try {
      const response = await fetch(`/api/operation-management/operation/${operationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success('Операция обновлена успешно');
        setModalVisible(false);
        setEditingOperation(null);
        form.resetFields();
        loadOperations();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error('Ошибка обновления операции:', error);
      message.error('Ошибка при обновлении операции');
    }
  };

  // Удаление операции
  const deleteOperation = async (operationId: number) => {
    try {
      const response = await fetch(`/api/operation-management/operation/${operationId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success('Операция удалена успешно');
        loadOperations();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error('Ошибка удаления операции:', error);
      message.error('Ошибка при удалении операции');
    }
  };

  useEffect(() => {
    loadOperations();
  }, [orderId]);

  // Обработчики
  const handleCreate = () => {
    setEditingOperation(null);
    form.resetFields();
    form.setFieldsValue({
      operationNumber: (operations?.length || 0) + 1,
      machineAxes: 3
    });
    setModalVisible(true);
  };

  const handleEdit = (operation: Operation) => {
    setEditingOperation(operation);
    form.setFieldsValue(operation);
    setModalVisible(true);
  };

  const handleDelete = (operation: Operation) => {
    Modal.confirm({
      title: 'Удаление операции',
      content: `Вы уверены, что хотите удалить операцию ${operation.operationNumber}?`,
      onOk: () => deleteOperation(operation.id)
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingOperation) {
        updateOperation(editingOperation.id, values);
      } else {
        createOperation(values);
      }
    });
  };

  const handleShowSuggestions = () => {
    setSuggestionsVisible(true);
    loadSuggestions();
  };

  const applySuggestion = (suggestion: OperationSuggestion) => {
    form.setFieldsValue({
      operationType: suggestion.operationType,
      estimatedTime: suggestion.estimatedTime
    });
    message.success(`Применена рекомендация: ${suggestion.operationType}, ${suggestion.estimatedTime} мин`);
  };

  // Колонки таблицы
  const columns = [
    {
      title: '№',
      dataIndex: 'operationNumber',
      key: 'operationNumber',
      width: 60
    },
    {
      title: 'Тип операции',
      dataIndex: 'operationType',
      key: 'operationType',
      render: (type: string) => (
        <Tag color={type === 'MILLING' ? 'blue' : 'green'}>
          {type === 'MILLING' ? 'Фрезерование' : 'Токарная обработка'}
        </Tag>
      )
    },
    {
      title: 'Время (мин)',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
      render: (time: number) => (
        <Space>
          <ClockCircleOutlined />
          {time}
        </Space>
      )
    },
    {
      title: 'Прогресс',
      key: 'progress',
      render: (_: any, record: Operation) => (
        <div>
          <Text>{record.completedUnits || 0}/{record.totalUnits || orderData.quantity}</Text>
          <br />
          <Text type="secondary">{record.progressPercentage?.toFixed(1) || 0}%</Text>
        </div>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          'PENDING': { color: 'default', text: 'Ожидает' },
          'ASSIGNED': { color: 'warning', text: 'Назначено' },
          'IN_PROGRESS': { color: 'processing', text: 'В работе' },
          'COMPLETED': { color: 'success', text: 'Завершено' }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: 'Станок',
      dataIndex: 'assignedMachine',
      key: 'assignedMachine',
      render: (machine: string) => machine || <Text type="secondary">Не назначен</Text>
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Operation) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            disabled={record.status === 'IN_PROGRESS'}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record)}
            disabled={record.status === 'IN_PROGRESS'}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={`Операции для заказа ${orderData.drawing_number}`}
        extra={
          <Space>
            <Button
              icon={<BulbOutlined />}
              onClick={handleShowSuggestions}
            >
              Рекомендации
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Добавить операцию
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={operations}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Модальное окно создания/редактирования операции */}
      <Modal
        title={editingOperation ? 'Редактировать операцию' : 'Создать операцию'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="operationNumber"
                label="Номер операции"
                rules={[{ required: true, message: 'Введите номер операции' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="operationType"
                label="Тип операции"
                rules={[{ required: true, message: 'Выберите тип операции' }]}
              >
                <Select>
                  <Select.Option value="MILLING">Фрезерование</Select.Option>
                  <Select.Option value="TURNING">Токарная обработка</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimatedTime"
                label="Расчетное время (мин)"
                rules={[{ required: true, message: 'Введите время' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="machineAxes"
                label="Количество осей"
              >
                <InputNumber min={3} max={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно рекомендаций */}
      <Modal
        title="Рекомендации на основе аналитики"
        open={suggestionsVisible}
        onCancel={() => setSuggestionsVisible(false)}
        footer={null}
        width={700}
      >
        {suggestions && suggestions.length > 0 ? (
          <div>
            <Alert
              message="Рекомендации основаны на анализе похожих заказов"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                size="small"
                style={{ marginBottom: 8 }}
                actions={[
                  <Button
                    type="link"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    Применить
                  </Button>
                ]}
              >
                <Row>
                  <Col span={8}>
                    <Statistic
                      title="Тип операции"
                      value={suggestion.operationType}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Время (мин)"
                      value={suggestion.estimatedTime}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Уверенность"
                      value={suggestion.confidence}
                      suffix="%"
                      valueStyle={{ 
                        color: suggestion.confidence > 70 ? '#3f8600' : 
                               suggestion.confidence > 50 ? '#faad14' : '#cf1322' 
                      }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Основано на {suggestion.basedOnOperations} операциях
                  </Text>
                  {suggestion.similarOrders.length > 0 && (
                    <div>
                      <Text type="secondary">Похожие заказы: </Text>
                      {suggestion.similarOrders.slice(0, 3).map((order, i) => (
                        <Tag key={i}>{order}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Alert
            message="Нет рекомендаций"
            description="Недостаточно данных для анализа похожих заказов. Создайте и выполните несколько операций для накопления данных."
            type="warning"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default SimpleOperationManagement;
