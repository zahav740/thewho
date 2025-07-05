/**
 * @file: FilterManagerAntd.tsx
 * @description: Компонент для управления фильтрами импорта
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message,
  Space,
  Typography,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ImportFilter {
  id: number;
  name: string;
  description: string;
  target_table: string;
  is_active: boolean;
  filter_config: any;
  column_mapping: any;
}

export const FilterManagerAntd: React.FC = () => {
  const [filters, setFilters] = useState<ImportFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState<ImportFilter | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/filters`);
      if (response.ok) {
        const data = await response.json();
        setFilters(Array.isArray(data) ? data : []);
      } else {
        console.warn('Не удалось загрузить фильтры');
        setFilters([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки фильтров:', error);
      message.error('Ошибка загрузки фильтров');
      setFilters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilter = async (values: any) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const url = editingFilter 
        ? `${apiUrl}/excel-import-db/filters/${editingFilter.id}`
        : `${apiUrl}/excel-import-db/filters`;
      
      const method = editingFilter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          filter_config: {
            required_columns: values.required_columns?.split(',').map((s: string) => s.trim()) || [],
            optional_columns: values.optional_columns?.split(',').map((s: string) => s.trim()) || [],
            skip_empty_rows: true,
            header_row: 1,
          },
          column_mapping: {},
        }),
      });

      if (response.ok) {
        message.success(`Фильтр ${editingFilter ? 'обновлен' : 'создан'} успешно`);
        setShowModal(false);
        setEditingFilter(null);
        form.resetFields();
        loadFilters();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения фильтра:', error);
      message.error('Ошибка сохранения фильтра');
    }
  };

  const handleDeleteFilter = async (id: number) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
      const response = await fetch(`${apiUrl}/excel-import-db/filters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Фильтр удален');
        loadFilters();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления фильтра:', error);
      message.error('Ошибка удаления фильтра');
    }
  };

  const handleEditFilter = (filter: ImportFilter) => {
    setEditingFilter(filter);
    form.setFieldsValue({
      name: filter.name,
      description: filter.description,
      target_table: filter.target_table,
      is_active: filter.is_active,
      required_columns: filter.filter_config?.required_columns?.join(', ') || '',
      optional_columns: filter.filter_config?.optional_columns?.join(', ') || '',
    });
    setShowModal(true);
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Целевая таблица',
      dataIndex: 'target_table',
      key: 'target_table',
      render: (table: string) => (
        <Tag color={table === 'orders' ? 'blue' : 'green'}>
          {table === 'orders' ? 'Заказы' : 'Операции'}
        </Tag>
      ),
    },
    {
      title: 'Активен',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Switch checked={active} size="small" disabled />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: ImportFilter) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditFilter(record)}
          >
            Изменить
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Удалить фильтр?',
                content: `Вы уверены, что хотите удалить фильтр "${record.name}"?`,
                onOk: () => handleDeleteFilter(record.id),
              });
            }}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Управление фильтрами импорта</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingFilter(null);
            form.resetFields();
            setShowModal(true);
          }}
        >
          Создать фильтр
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filters}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title={editingFilter ? 'Изменить фильтр' : 'Создать фильтр'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingFilter(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveFilter}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название фильтра' }]}
          >
            <Input placeholder="Например: Фильтр для заказов" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <TextArea rows={2} placeholder="Описание назначения фильтра" />
          </Form.Item>

          <Form.Item
            name="target_table"
            label="Целевая таблица"
            rules={[{ required: true, message: 'Выберите целевую таблицу' }]}
          >
            <Select>
              <Select.Option value="orders">Заказы</Select.Option>
              <Select.Option value="operations">Операции</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="required_columns"
            label="Обязательные колонки"
            help="Укажите названия колонок через запятую"
          >
            <Input placeholder="drawing_number, quantity, deadline" />
          </Form.Item>

          <Form.Item
            name="optional_columns"
            label="Опциональные колонки"
            help="Укажите названия колонок через запятую"
          >
            <Input placeholder="priority, workType" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Активен"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default FilterManagerAntd;
