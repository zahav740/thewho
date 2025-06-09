/**
 * @file: OperatorsPage.tsx (ИСПРАВЛЕНО)
 * @description: Страница управления операторами - исправлены TypeScript ошибки
 * @dependencies: antd, react-query, operatorsApi
 * @created: 2025-06-09
 * @fixed: TypeScript типизация для таблицы
 */
import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Divider,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ToolOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operatorsApi, Operator, CreateOperatorDto, UpdateOperatorDto } from '../../services/operatorsApi';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

export const OperatorsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [form] = Form.useForm();

  // Загрузка операторов
  const { data: operators, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: () => operatorsApi.getAll(),
  });

  // Мутации
  const createMutation = useMutation({
    mutationFn: operatorsApi.create,
    onSuccess: () => {
      message.success('Оператор добавлен');
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Ошибка при добавлении оператора');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOperatorDto }) =>
      operatorsApi.update(id, data),
    onSuccess: () => {
      message.success('Оператор обновлен');
      setModalVisible(false);
      setEditingOperator(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Ошибка при обновлении оператора');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: operatorsApi.delete,
    onSuccess: () => {
      message.success('Оператор деактивирован');
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Ошибка при деактивации оператора');
    },
  });

  const handleCreate = () => {
    setEditingOperator(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator);
    form.setFieldsValue({
      name: operator.name,
      operatorType: operator.operatorType,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: CreateOperatorDto) => {
    if (editingOperator) {
      await updateMutation.mutateAsync({
        id: editingOperator.id,
        data: values,
      });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const getOperatorTypeIcon = (type: string) => {
    switch (type) {
      case 'SETUP':
        return <ToolOutlined />;
      case 'PRODUCTION':
        return <UserOutlined />;
      case 'BOTH':
        return <SettingOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const getOperatorTypeColor = (type: string) => {
    switch (type) {
      case 'SETUP':
        return 'orange';
      case 'PRODUCTION':
        return 'blue';
      case 'BOTH':
        return 'green';
      default:
        return 'default';
    }
  };

  const getOperatorTypeName = (type: string) => {
    switch (type) {
      case 'SETUP':
        return 'Наладка';
      case 'PRODUCTION':
        return 'Производство';
      case 'BOTH':
        return 'Все виды работ';
      default:
        return type;
    }
  };

  // ✅ Правильная типизация столбцов таблицы
  const columns: ColumnsType<Operator> = [
    {
      title: 'Имя оператора',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Operator) => (
        <Space>
          <UserOutlined style={{ color: record.isActive ? '#52c41a' : '#d9d9d9' }} />
          <span style={{ color: record.isActive ? '#262626' : '#8c8c8c' }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Тип работ',
      dataIndex: 'operatorType',
      key: 'operatorType',
      render: (type: string) => (
        <Tag
          icon={getOperatorTypeIcon(type)}
          color={getOperatorTypeColor(type)}
        >
          {getOperatorTypeName(type)}
        </Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (text: any, record: Operator) => ( // ✅ Исправлена типизация
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!record.isActive}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Деактивировать оператора?"
            description="Оператор будет скрыт из списков выбора"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Отмена"
            disabled={!record.isActive}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={!record.isActive}
            >
              Деактивировать
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            👥 Управление операторами
          </Title>
          <p style={{ color: '#8c8c8c', marginTop: '8px' }}>
            Добавляйте и управляйте операторами для смен. Операторы появятся в выпадающих списках при создании записей смен.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Добавить оператора
          </Button>
        </div>

        <Divider />

        <Table<Operator> // ✅ Добавлена типизация для Table
          columns={columns}
          dataSource={operators}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Всего операторов: ${total}`,
          }}
        />
      </Card>

      {/* Модальное окно добавления/редактирования */}
      <Modal
        title={editingOperator ? 'Редактировать оператора' : 'Добавить оператора'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingOperator(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            operatorType: 'BOTH',
          }}
        >
          <Form.Item
            label="Имя оператора"
            name="name"
            rules={[
              { required: true, message: 'Введите имя оператора' },
              { min: 2, message: 'Имя должно содержать минимум 2 символа' },
            ]}
          >
            <Input placeholder="Например: Denis" />
          </Form.Item>

          <Form.Item
            label="Тип работ"
            name="operatorType"
            rules={[{ required: true, message: 'Выберите тип работ' }]}
          >
            <Select placeholder="Выберите тип работ">
              <Option value="BOTH">
                <Space>
                  <SettingOutlined style={{ color: '#52c41a' }} />
                  Все виды работ (наладка + производство)
                </Space>
              </Option>
              <Option value="SETUP">
                <Space>
                  <ToolOutlined style={{ color: '#fa8c16' }} />
                  Только наладка
                </Space>
              </Option>
              <Option value="PRODUCTION">
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  Только производство
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingOperator(null);
                  form.resetFields();
                }}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingOperator ? 'Обновить' : 'Добавить'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
