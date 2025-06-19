/**
 * @file: OrdersList.tsx
 * @description: Компонент списка заказов с поддержкой i18n
 * @dependencies: antd, order.types, ContextMenu, useTranslation
 * @created: 2025-01-28
 * @updated: 2025-06-10 // Добавлена поддержка переводов
 */
import React, { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Input, Select, Alert, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Order, OrdersFilter, OrdersResponse, Priority } from '../../../types/order.types';
import { ordersApi } from '../../../services/ordersApi';
import ContextMenu from '../../../components/ContextMenu';
import { BulkDeleteModal } from '../../../components/BulkDeleteModal';
import { useTranslation } from '../../../i18n';
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
  const { t, tWithParams } = useTranslation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);

  const handleDeleteSelected = async () => {
    try {
      const ids = selectedRowKeys.map(key => String(key));
      const result = await ordersApi.deleteBatch(ids);
      message.success(tWithParams('message.success.deleted_count', { count: result.deleted }));
      setSelectedRowKeys([]);
      onRefresh?.();
    } catch (error) {
      message.error(t('message.error.delete_selected'));
    }
  };

  const handleDeleteAll = async () => {
    try {
      const result = await ordersApi.deleteAll();
      message.success(tWithParams('message.success.deleted_all', { count: result.deleted }));
      setSelectedRowKeys([]);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting all orders:', error);
      message.error(t('message.error.delete_all'));
    }
  };

  const handleDeleteAllWithExclusions = async () => {
    try {
      setLoadingAllOrders(true);
      
      const totalCount = data?.total || 0;
      const allOrdersResponse = await ordersApi.getAll({ 
        limit: Math.max(totalCount, 1000),
        page: 1 
      });
      
      console.log(`Loaded ${allOrdersResponse.data.length} of ${allOrdersResponse.total} orders`);
      
      setAllOrders(allOrdersResponse.data);
      setShowBulkDeleteModal(true);
    } catch (error) {
      console.error('Error loading all orders:', error);
      message.error(t('message.error.load_orders'));
    } finally {
      setLoadingAllOrders(false);
    }
  };

  const handleBulkDelete = async (idsToDelete: string[]) => {
    try {
      console.log(`Deleting ${idsToDelete.length} orders`);
      const result = await ordersApi.deleteBatch(idsToDelete);
      setSelectedRowKeys([]);
      onRefresh?.();
      return result;
    } catch (error) {
      console.error('Bulk deletion error:', error);
      throw error;
    }
  };

  const getPriorityConfig = (priority: Priority) => {
    const configs = {
      [Priority.HIGH]: { color: 'orange', text: t('priority.high') },
      [Priority.MEDIUM]: { color: 'blue', text: t('priority.medium') },
      [Priority.LOW]: { color: 'green', text: t('priority.low') },
    };
    return configs[priority] || { color: 'blue', text: t('priority.unknown') };
  };

  const columns: ColumnsType<Order> = [
    {
      title: t('database.drawing_number'),
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
      title: t('database.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: t('database.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: Priority) => {
        const config = getPriorityConfig(priority);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('database.deadline'),
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
              {tWithParams('database.days_left', { days: daysLeft })}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: t('database.work_type'),
      dataIndex: 'workType',
      key: 'workType',
      ellipsis: true,
    },
    {
      title: t('database.operations'),
      dataIndex: 'operations',
      key: 'operations',
      width: 100,
      render: (operations: any[]) => tWithParams('database.operations_count', { count: operations?.length || 0 }),
    },
    {
      title: t('database.actions'),
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_: any, record: Order) => (
        <Space size="large" style={{ justifyContent: 'center', width: '100%' }}>
          <Button
            type="primary"
            ghost
            icon={<EditOutlined style={{ fontSize: '32px' }} />}
            onClick={() => onEdit(record.id)}
            size="large"
            style={{ 
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              borderWidth: '2px'
            }}
            title={t('button.edit')}
          />
          <Popconfirm
            title={t('database.delete_order')}
            description={t('database.delete_confirm')}
            onConfirm={() => onDelete(record.id)}
            okText={t('database.delete_button')}
            cancelText={t('database.cancel_button')}
          >
            <Button 
              type="primary"
              danger
              ghost
              icon={<DeleteOutlined style={{ fontSize: '32px' }} />} 
              size="large"
              style={{ 
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                borderWidth: '2px'
              }}
              title={t('button.delete')}
            />
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
        message={t('database.loading_error')}
        description={t('database.loading_error_desc')}
        type="error"
        showIcon
      />
    );
  }

  return (
    <Spin spinning={loadingAllOrders} tip={t('message.loading_all_orders')}>
      <ContextMenu
        onDeleteSelected={selectedRowKeys.length > 0 ? handleDeleteSelected : undefined}
        onDeleteAll={data?.total && data.total > 0 ? handleDeleteAll : undefined}
        onDeleteAllWithExclusions={data?.total && data.total > 0 ? handleDeleteAllWithExclusions : undefined}
        selectedCount={selectedRowKeys.length}
        totalCount={data?.total || 0}
        entityName={t('entity.orders')}
      >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space style={{ marginBottom: 16 }} size="middle">
          <Search
            placeholder={t('database.search_drawing')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder={t('database.filter_priority')}
            allowClear
            onChange={handlePriorityFilter}
            style={{ width: 200 }}
          >
            <Option value={Priority.HIGH}>{t('priority.high')}</Option>
            <Option value={Priority.MEDIUM}>{t('priority.medium')}</Option>
            <Option value={Priority.LOW}>{t('priority.low')}</Option>
          </Select>
          
          {selectedRowKeys.length > 0 && (
            <Alert
              message={tWithParams('database.selected_orders', { count: selectedRowKeys.length })}
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
            showTotal: (total) => tWithParams('database.total_count', { total }),
          }}
          onChange={handleTableChange}
          style={{ 
            cursor: 'context-menu',
            border: '1px solid #f0f0f0',
            borderRadius: '8px'
          }}
          size="middle"
          scroll={{ x: 'max-content' }}
        />  
      </Space>
      
      {/* Bulk delete modal */}
      <BulkDeleteModal
        visible={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={() => {
          setShowBulkDeleteModal(false);
          onRefresh?.();
        }}
        orders={allOrders}
        onDeleteBatch={handleBulkDelete}
        totalOrdersCount={data?.total}
      />
    </ContextMenu>
      </Spin>
  );
};
