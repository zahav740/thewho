/**
 * @file: OperatorsPage.tsx (ИСПРАВЛЕНО - ДОБАВЛЕНА СИСТЕМА ПЕРЕВОДОВ)
 * @description: Страница управления операторами с полной поддержкой i18n
 * @dependencies: antd, react-query, operatorsApi, useTranslation
 * @created: 2025-06-09
 * @fixed: Добавлена система переводов вместо хардкода текстов
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
import { useTranslation } from '../../i18n';
import { operatorsApi, Operator, CreateOperatorDto, UpdateOperatorDto } from '../../services/operatorsApi';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

export const OperatorsPage: React.FC = () => {
  const { t, tWithParams } = useTranslation();
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
      message.success(t('message.success.saved'));
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
    onError: (error: any) => {
      message.error(error.message || t('message.error.save'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOperatorDto }) =>
      operatorsApi.update(id, data),
    onSuccess: () => {
      message.success(t('operators.operator_updated'));
      setModalVisible(false);
      setEditingOperator(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
    onError: (error: any) => {
      message.error(error.message || t('operators.update_error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: operatorsApi.delete,
    onSuccess: () => {
      message.success(t('operators.operator_deactivated'));
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
    onError: (error: any) => {
      message.error(error.message || t('operators.deactivate_error'));
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
    return t(`operator_type.${type}_name`);
  };

  // ✅ Правильная типизация столбцов таблицы
  const columns: ColumnsType<Operator> = [
    {
      title: t('operators.operator_name'),
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
      title: t('operators.operator_type'),
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
      title: t('operators.operator_status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('operators.active') : t('operators.inactive')}
        </Tag>
      ),
    },
    {
      title: t('operators.operator_created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: t('operators.actions'),
      key: 'actions',
      render: (text: any, record: Operator) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!record.isActive}
          >
            {t('button.edit')}
          </Button>
          <Popconfirm
            title={t('operators.deactivate_confirm')}
            description={t('operators.deactivate_description')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('button.confirm')}
            cancelText={t('button.cancel')}
            disabled={!record.isActive}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={!record.isActive}
            >
              {t('operators.deactivate')}
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
            👥 {t('operators.title')}
          </Title>
          <p style={{ color: '#8c8c8c', marginTop: '8px' }}>
            {t('operators.description')}
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            {t('operators.add_operator')}
          </Button>
        </div>

        <Divider />

        <Table<Operator>
          columns={columns}
          dataSource={operators}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => tWithParams('operators.total_operators', { total }),
          }}
        />
      </Card>

      {/* Модальное окно добавления/редактирования */}
      <Modal
        title={editingOperator ? t('operators.edit_operator') : t('operators.add_operator')}
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
            label={t('operators.operator_name')}
            name="name"
            rules={[
              { required: true, message: t('operators.name_required') },
              { min: 2, message: t('operators.name_min_length') },
            ]}
          >
            <Input placeholder={t('operators.name_placeholder')} />
          </Form.Item>

          <Form.Item
            label={t('operators.operator_type')}
            name="operatorType"
            rules={[{ required: true, message: t('operators.type_required') }]}
          >
            <Select placeholder={t('operators.type_placeholder')}>
              <Option value="BOTH">
                <Space>
                  <SettingOutlined style={{ color: '#52c41a' }} />
                  {t('operator_type.BOTH')}
                </Space>
              </Option>
              <Option value="SETUP">
                <Space>
                  <ToolOutlined style={{ color: '#fa8c16' }} />
                  {t('operator_type.SETUP')}
                </Space>
              </Option>
              <Option value="PRODUCTION">
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  {t('operator_type.PRODUCTION')}
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
                {t('button.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingOperator ? t('button.update') : t('button.add')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};