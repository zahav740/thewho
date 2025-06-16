/**
 * @file: OperationManagement.tsx  
 * @description: Компонент для ручного управления операциями с аналитикой (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @dependencies: antd, react-query
 * @created: 2025-06-11
 */
import React, { useState } from 'react';
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
  Tabs,
  Statistic,
  Row,
  Col,
  Tag,
  Tooltip,
  Alert,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

interface OperationAnalytics {
  operationType: string;
  machineType: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  completedOperations: number;
  efficiency: number;
  recommendedTime: number;
}

// API функции
const operationApi = {
  createOperation: async (data: any) => {
    const response = await fetch('/api/operation-management/operation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  getOrderOperations: async (orderId: number): Promise<Operation[]> => {
    const response = await fetch(`/api/operation-management/order/${orderId}/operations`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  updateOperation: async (operationId: number, data: any) => {
    const response = await fetch(`/api/operation-management/operation/${operationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  deleteOperation: async (operationId: number) => {
    const response = await fetch(`/api/operation-management/operation/${operationId}`, {
      method: 'DELETE'
    });
    return await response.json();
  },

  getSuggestions: async (orderDrawingNumber: string, orderQuantity: number, workType?: string): Promise<OperationSuggestion[]> => {
    const params = new URLSearchParams({
      orderDrawingNumber,
      orderQuantity: orderQuantity.toString(),
      ...(workType && { workType })
    });
    const response = await fetch(`/api/operation-management/suggestions?${params}`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  getTimeAnalytics: async (operationType?: string, machineType?: string): Promise<OperationAnalytics[]> => {
    const params = new URLSearchParams();
    if (operationType) params.append('operationType', operationType);
    if (machineType) params.append('machineType', machineType);
    
    const response = await fetch(`/api/operation-management/analytics/time?${params}`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  getOptimalTime: async (operationType: string, machineCode: string, quantity: number) => {
    const params = new URLSearchParams({
      operationType,
      machineCode,
      quantity: quantity.toString()
    });
    const response = await fetch(`/api/operation-management/analytics/optimal-time?${params}`);
    const data = await response.json();
    return data.success ? data.data : null;
  },

  getTopOperators: async (operationType?: string) => {
    const params = new URLSearchParams();
    if (operationType) params.append('operationType', operationType);
    
    const response = await fetch(`/api/operation-management/analytics/operators?${params}`);
    const data = await response.json();
    return data.success ? data.data : [];
  }
};

interface OperationManagementProps {
  orderId: number;
  orderData: {
    drawing_number: string;
    quantity: number;
    workType?: string;
  };
}

export const OperationManagement: React.FC<OperationManagementProps> = ({
  orderId,
  orderData
}) => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [form] = Form.useForm();

  // Queries
  const { data: operations, isLoading } = useQuery({
    queryKey: ['order-operations', orderId],
    queryFn: () => operationApi.getOrderOperations(orderId),
    refetchInterval: 10000
  });

  const { data: suggestions } = useQuery({
    queryKey: ['operation-suggestions', orderData.drawing_number],
    queryFn: () => operationApi.getSuggestions(
      orderData.drawing_number,
      orderData.quantity,
      orderData.workType
    ),
    enabled: suggestionsVisible
  });

  const { data: analytics } = useQuery({
    queryKey: ['operation-analytics'],
    queryFn: () => operationApi.getTimeAnalytics()
  });

  const { data: topOperators } = useQuery({
    queryKey: ['top-operators'],
    queryFn: () => operationApi.getTopOperators()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: operationApi.createOperation,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['order-operations', orderId] });
        setModalVisible(false);
        form.resetFields();
        message.success('Операция создана успешно');
      } else {
        message.error(result.message);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ operationId, data }: { operationId: number; data: any }) =>
      operationApi.updateOperation(operationId, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['order-operations', orderId] });
        setModalVisible(false);
        setEditingOperation(null);
        form.resetFields();
        message.success('Операция обновлена успешно');
      } else {
        message.error(result.message);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: operationApi.deleteOperation,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['order-operations', orderId] });
        message.success('Операция удалена успешно');
      } else {
        message.error(result.message);
      }
    }
  });

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
      onOk: () => deleteMutation.mutate(operation.id)
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingOperation) {
        updateMutation.mutate({ operationId: editingOperation.id, data: values });
      } else {
        createMutation.mutate({ ...values, orderId });
      }
    });
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
              onClick={() => setSuggestionsVisible(true)}
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
          loading={isLoading}
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
        confirmLoading={createMutation.isPending || updateMutation.isPending}
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
        width={800}
      >
        <Tabs defaultActiveKey="suggestions">
          <Tabs.TabPane tab="Рекомендации" key="suggestions">
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
                        key="apply"
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
                          prefix={<BarChartOutlined />}
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
                description="Недостаточно данных для анализа похожих заказов"
                type="warning"
                showIcon
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="Аналитика времени" key="analytics">
            {analytics && analytics.length > 0 ? (
              <Table
                dataSource={analytics}
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Тип операции',
                    dataIndex: 'operationType',
                    key: 'operationType'
                  },
                  {
                    title: 'Тип станка',
                    dataIndex: 'machineType',
                    key: 'machineType'
                  },
                  {
                    title: 'Среднее время',
                    dataIndex: 'averageTime',
                    key: 'averageTime',
                    render: (time: number) => `${time} мин`
                  },
                  {
                    title: 'Мин/Макс',
                    key: 'minMax',
                    render: (_: any, record: OperationAnalytics) => 
                      `${record.minTime}-${record.maxTime} мин`
                  },
                  {
                    title: 'Эффективность',
                    dataIndex: 'efficiency',
                    key: 'efficiency',
                    render: (eff: number) => (
                      <Text style={{ 
                        color: eff > 80 ? '#3f8600' : 
                               eff > 60 ? '#faad14' : '#cf1322' 
                      }}>
                        {eff}%
                      </Text>
                    )
                  },
                  {
                    title: 'Рекомендуемое время',
                    dataIndex: 'recommendedTime',
                    key: 'recommendedTime',
                    render: (time: number) => (
                      <Text strong>{time} мин</Text>
                    )
                  }
                ]}
              />
            ) : (
              <Alert
                message="Нет данных для аналитики"
                description="Недостаточно завершенных операций для анализа"
                type="info"
                showIcon
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="Топ операторы" key="operators">
            {topOperators && topOperators.length > 0 ? (
              <Table
                dataSource={topOperators}
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Оператор',
                    dataIndex: 'operatorName',
                    key: 'operatorName',
                    render: (name: string) => (
                      <Space>
                        <UserOutlined />
                        {name}
                      </Space>
                    )
                  },
                  {
                    title: 'Специализация',
                    dataIndex: 'operationType',
                    key: 'operationType'
                  },
                  {
                    title: 'Эффективность',
                    dataIndex: 'averageEfficiency',
                    key: 'averageEfficiency',
                    render: (eff: number) => (
                      <Text style={{ 
                        color: eff > 90 ? '#3f8600' : 
                               eff > 80 ? '#faad14' : '#cf1322' 
                      }}>
                        {eff?.toFixed(1)}%
                      </Text>
                    )
                  },
                  {
                    title: 'Произведено',
                    dataIndex: 'totalProduction',
                    key: 'totalProduction'
                  },
                  {
                    title: 'Смен отработано',
                    dataIndex: 'shiftsWorked',
                    key: 'shiftsWorked'
                  },
                  {
                    title: 'Последняя смена',
                    dataIndex: 'lastShift',
                    key: 'lastShift',
                    render: (date: string) => 
                      new Date(date).toLocaleDateString()
                  }
                ]}
              />
            ) : (
              <Alert
                message="Нет данных об операторах"
                description="Данные об операторах будут доступны после ведения учета смен"
                type="info"
                showIcon
              />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default OperationManagement;
