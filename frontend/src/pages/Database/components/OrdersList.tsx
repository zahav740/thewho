/**
 * @file: OrdersList.tsx
 * @description: Компонент списка заказов с контекстным меню
 * @dependencies: antd, order.types, ContextMenu
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Обновлена логика приоритетов
 */
import React, { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Input, Select, Alert, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Order, OrdersFilter, OrdersResponse, Priority } from '../../../types/order.types';
import { ordersApi } from '../../../services/ordersApi';
import ContextMenu from '../../../components/ContextMenu';
import { BulkDeleteModal } from '../../../components/BulkDeleteModal';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

interface OrdersListProps {
  data?: OrdersResponse;
  loading: boolean;
  error: any;
  filter: OrdersFilter;
  onFilterChange: (filter: OrdersFilter) => void;
  onEdit: (orderId: number) => void;
  onDelete: (orderId: number) => void;
  onRefresh?: () => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  data,
  loading,
  error,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);

  const handleDeleteSelected = async () => {
    try {
      const ids = selectedRowKeys.map(key => String(key));
      const result = await ordersApi.deleteBatch(ids);
      message.success(`Удалено ${result.deleted} заказов`);
      setSelectedRowKeys([]);
      onRefresh?.();
    } catch (error) {
      message.error('Ошибка при удалении выбранных заказов');
    }
  };

  const handleDeleteAll = async () => {
    try {
      // При удалении всех заказов, удаляем все заказы в базе, а не только видимые
      const result = await ordersApi.deleteAll();
      message.success(`Удалено всех ${result.deleted} заказов`);
      setSelectedRowKeys([]);
      onRefresh?.();
    } catch (error) {
      console.error('Ошибка при удалении всех заказов:', error);
      message.error('Ошибка при удалении всех заказов');
    }
  };

  // Новая функция для массового удаления с выбором
  const handleDeleteAllWithExclusions = async () => {
    // При открытии модального окна, загружаем все заказы
    try {
      setLoadingAllOrders(true);
      
      // Получаем общее количество заказов
      const totalCount = data?.total || 0;
      
      // Загружаем все заказы с большим лимитом
      const allOrdersResponse = await ordersApi.getAll({ 
        limit: Math.max(totalCount, 1000), // Используем максимум между общим количеством и 1000
        page: 1 
      });
      
      console.log(`Загружено ${allOrdersResponse.data.length} из ${allOrdersResponse.total} заказов`);
      
      setAllOrders(allOrdersResponse.data);
      setShowBulkDeleteModal(true);
    } catch (error) {
      console.error('Ошибка загрузки всех заказов:', error);
      message.error('Ошибка при загрузке списка заказов');
    } finally {
      setLoadingAllOrders(false);
    }
  };

  // Обработчик массового удаления
  const handleBulkDelete = async (idsToDelete: string[]) => {
    try {
      // Если удаляем все заказы кроме нескольких, используем deleteBatch
      console.log(`Удаление ${idsToDelete.length} заказов`);
      const result = await ordersApi.deleteBatch(idsToDelete);
      setSelectedRowKeys([]);
      onRefresh?.();
      return result;
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      throw error;
    }
  };

  const getPriorityConfig = (priority: Priority) => {
    const configs = {
      // Удалена ссылка на CRITICAL
      [Priority.HIGH]: { color: 'orange', text: 'Высокий' },
      [Priority.MEDIUM]: { color: 'blue', text: 'Средний' },
      [Priority.LOW]: { color: 'green', text: 'Низкий' },
    };
    return configs[priority] || { color: 'blue', text: 'Неизвестный' };
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      render: (text: string, record: Order) => (
        <Space>
          {text}
          {record.pdfPath && (
            <Button
              type="link"
              size="small"
              icon={<FilePdfOutlined />}
              href={`/api/orders/${record.id}/pdf`}
              target="_blank"
            />
          )}
        </Space>
      ),
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: Priority) => {
        const config = getPriorityConfig(priority);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Срок',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string) => {
        const deadline = dayjs(date);
        const daysLeft = deadline.diff(dayjs(), 'day');
        return (
          <Space direction="vertical" size={0}>
            <span>{deadline.format('DD.MM.YYYY')}</span>
            <Tag color={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'orange' : 'green'}>
              Осталось {daysLeft} дн.
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Тип работы',
      dataIndex: 'workType',
      key: 'workType',
      ellipsis: true,
    },
    {
      title: 'Операции',
      dataIndex: 'operations',
      key: 'operations',
      width: 100,
      render: (operations: any[]) => `${operations?.length || 0} оп.`,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record.id)}
          />
          <Popconfirm
            title="Удалить заказ?"
            description="Это действие нельзя отменить"
            onConfirm={() => onDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    onFilterChange({ ...filter, search: value, page: 1 });
  };

  const handlePriorityFilter = (value: Priority | undefined) => {
    onFilterChange({ ...filter, priority: value, page: 1 });
  };

  const handleTableChange = (pagination: any) => {
    onFilterChange({
      ...filter,
      page: pagination.current,
      limit: pagination.pageSize,
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description="Не удалось загрузить список заказов"
        type="error"
        showIcon
      />
    );
  }

  return (
    <Spin spinning={loadingAllOrders} tip="Загрузка всех заказов...">
      <ContextMenu
        onDeleteSelected={selectedRowKeys.length > 0 ? handleDeleteSelected : undefined}
        onDeleteAll={data?.total && data.total > 0 ? handleDeleteAll : undefined}
        onDeleteAllWithExclusions={data?.total && data.total > 0 ? handleDeleteAllWithExclusions : undefined}
        selectedCount={selectedRowKeys.length}
        totalCount={data?.total || 0}
        entityName="заказов"
      >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space style={{ marginBottom: 16 }} size="middle">
          <Search
            placeholder="Поиск по номеру чертежа"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Фильтр по приоритету"
            allowClear
            onChange={handlePriorityFilter}
            style={{ width: 200 }}
          >
            {/* Удалена опция CRITICAL */}
            <Option value={Priority.HIGH}>Высокий</Option>
            <Option value={Priority.MEDIUM}>Средний</Option>
            <Option value={Priority.LOW}>Низкий</Option>
          </Select>
          
          {selectedRowKeys.length > 0 && (
            <Alert
              message={`Выбрано ${selectedRowKeys.length} заказов`}
              type="info"
              showIcon
              closable
              onClose={() => setSelectedRowKeys([])}
            />
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: filter.page,
            pageSize: filter.limit,
            total: data?.total,
            showSizeChanger: true,
            showTotal: (total) => `Всего: ${total} заказов`,
          }}
          onChange={handleTableChange}
          style={{ 
            cursor: 'context-menu',
            border: '1px solid #f0f0f0',
            borderRadius: '8px'
          }}
        />  
      </Space>
      
      {/* Модальное окно массового удаления */}
      <BulkDeleteModal
        visible={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={() => {
          setShowBulkDeleteModal(false);
          onRefresh?.();
        }}
        orders={allOrders} // Передаем все заказы
        onDeleteBatch={handleBulkDelete}
        totalOrdersCount={data?.total}
      />
    </ContextMenu>
      </Spin>
  );
};
