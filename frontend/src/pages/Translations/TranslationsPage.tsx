/**
 * @file: TranslationsPage.tsx
 * @description: Страница управления переводами
 * @created: 2025-01-28
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Card,
  Typography,
  message,
  Popconfirm,
  Divider,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation, TranslationAPI } from '../../i18n';
import {
  fetchAllTranslations,
  upsertTranslation,
  deleteTranslation,
} from '../../i18n/api';

const { Title } = Typography;
const { TextArea } = Input;

interface TranslationFormData {
  key: string;
  ru: string;
  en: string;
  category: string;
}

export const TranslationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [translations, setTranslations] = useState<TranslationAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<TranslationAPI | null>(null);
  const [form] = Form.useForm();

  // Загрузка переводов
  const loadTranslations = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTranslations();
      setTranslations(data);
    } catch (error) {
      message.error('Ошибка при загрузке переводов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations();
  }, []);

  // Открытие модального окна для создания
  const handleCreate = () => {
    setEditingTranslation(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Открытие модального окна для редактирования
  const handleEdit = (translation: TranslationAPI) => {
    setEditingTranslation(translation);
    form.setFieldsValue({
      key: translation.key,
      ru: translation.ru,
      en: translation.en,
      category: translation.category,
    });
    setModalVisible(true);
  };

  // Сохранение перевода
  const handleSave = async (values: TranslationFormData) => {
    try {
      await upsertTranslation(values);
      message.success(editingTranslation ? 'Перевод обновлен' : 'Перевод создан');
      setModalVisible(false);
      loadTranslations();
    } catch (error) {
      message.error('Ошибка при сохранении перевода');
    }
  };

  // Удаление перевода
  const handleDelete = async (key: string) => {
    try {
      await deleteTranslation(key);
      message.success('Перевод удален');
      loadTranslations();
    } catch (error) {
      message.error('Ошибка при удалении перевода');
    }
  };

  // Получение уникальных категорий
  const getCategories = () => {
    const categories = Array.from(new Set(translations.map(t => t.category)));
    return categories.map(cat => ({ label: cat, value: cat }));
  };

  const columns: ColumnsType<TranslationAPI> = [
    {
      title: 'Ключ',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      sorter: (a, b) => a.key.localeCompare(b.key),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color="blue">{category}</Tag>,
      filters: getCategories().map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Русский',
      dataIndex: 'ru',
      key: 'ru',
      ellipsis: true,
    },
    {
      title: 'English',
      dataIndex: 'en',
      key: 'en',
      ellipsis: true,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Редактировать"
          />
          <Popconfirm
            title="Удалить перевод?"
            description="Это действие нельзя отменить."
            onConfirm={() => handleDelete(record.key)}
            okText="Да"
            cancelText="Отмена"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Удалить"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GlobalOutlined />
              {t('translations.title')}
            </Title>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              {t('translations.description')}
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTranslations}
              loading={loading}
            >
              Обновить
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Добавить перевод
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={translations}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Всего: ${total} переводов`,
          }}
          scroll={{ y: 600 }}
        />
      </Card>

      <Modal
        title={editingTranslation ? 'Редактировать перевод' : 'Создать перевод'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="key"
            label="Ключ"
            rules={[
              { required: true, message: 'Введите ключ' },
              { pattern: /^[a-zA-Z0-9._-]+$/, message: 'Ключ может содержать только буквы, цифры, точки, дефисы и подчеркивания' },
            ]}
          >
            <Input
              placeholder="menu.production"
              disabled={!!editingTranslation}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Категория"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select
              placeholder="Выберите категорию"
              options={[
                { label: 'navigation', value: 'navigation' },
                { label: 'pages', value: 'pages' },
                { label: 'buttons', value: 'buttons' },
                { label: 'forms', value: 'forms' },
                { label: 'messages', value: 'messages' },
                { label: 'status', value: 'status' },
                { label: 'general', value: 'general' },
                ...getCategories(),
              ]}
              showSearch
              allowClear
            />
          </Form.Item>

          <Divider />

          <Form.Item
            name="ru"
            label="Русский текст"
            rules={[{ required: true, message: 'Введите русский текст' }]}
          >
            <TextArea
              rows={3}
              placeholder="Введите текст на русском языке"
            />
          </Form.Item>

          <Form.Item
            name="en"
            label="English text"
            rules={[{ required: true, message: 'Введите английский текст' }]}
          >
            <TextArea
              rows={3}
              placeholder="Enter text in English"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
