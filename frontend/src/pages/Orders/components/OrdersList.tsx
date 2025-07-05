/**
 * @file: OrdersList.tsx
 * @description: Улучшенный список заказов с интеллектуальными приоритетами
 * @dependencies: antd, order.types, useTranslation
 * @created: 2025-07-03
 */
import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Input, Select, Alert, Tooltip } from 'antd';
import { EditOutlined, FilePdfOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { OrderV2, OrdersV2Filter, OrdersV2Response, PriorityV2 } from '../../../types/order-v2.types';
import { useTranslation } from '../../../i18n';
import { DeleteMenuButton } from './DeleteMenuButton';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

interface OrdersListProps {
  data?: OrdersV2Response;
  loading: boolean;
  error: any;
  filter: OrdersV2Filter;
  onFilterChange: (filter: OrdersV2Filter) => void;
  onEdit: (orderId: number) => void;
  onDelete: (orderId: number) => void;
  onRefresh?: () => void;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (selectedRowKeys: React.Key[]) => void;
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
  selectedRowKeys = [],
  onSelectionChange,
}) => {
  const { t, tWithParams } = useTranslation();

  const getPriorityConfig = (priority: PriorityV2) => {
    const configs = {
      [PriorityV2.HIGH]: { color: 'red', text: 'Высокий', icon: '🔥' },
      [PriorityV2.MEDIUM]: { color: 'orange', text: 'Средний', icon: '⚡' },
      [PriorityV2.LOW]: { color: 'green', text: 'Низкий', icon: '📋' },
      [PriorityV2.URGENT]: { color: 'purple', text: 'Срочный', icon: '⚠️' },
    };
    return configs[priority] || { color: 'blue', text: 'Неизвестный', icon: '❓' };
  };

  const getDeadlineInfo = (deadline: string) => {
    const deadlineDate = dayjs(deadline);
    const now = dayjs();
    const daysLeft = deadlineDate.diff(now, 'day');
    
    let status = 'normal';
    let color = '#52c41a';
    let text = '';
    
    if (daysLeft < 0) {
      status = 'overdue';
      color = '#ff4d4f';
      text = `Просрочено на ${Math.abs(daysLeft)} дн.`;
    } else if (daysLeft <= 3) {
      status = 'critical';
      color = '#ff4d4f';
      text = `Осталось ${daysLeft} дн.`;
    } else if (daysLeft <= 7) {
      status = 'warning';
      color = '#faad14';
      text = `Осталось ${daysLeft} дн.`;
    } else {
      status = 'normal';
      color = '#52c41a';
      text = `Осталось ${daysLeft} дн.`;
    }
    
    return { status, color, text, daysLeft };
  };

  const getOperationsComplexity = (operations: any[]) => {
    if (!operations || operations.length === 0) return { total: 0, complexity: 'low', icon: '📋' };
    
    const totalTime = operations.reduce((sum, op) => sum + (op.estimatedTime || 0), 0);
    const has4Axis = operations.some(op => op.machineAxes === 4);
    const hasComplexOps = operations.some(op => op.operationType === 'TURNING' || op.estimatedTime > 120);
    
    let complexity = 'low';
    let icon = '📋';
    
    if (has4Axis || hasComplexOps || totalTime > 300) {
      complexity = 'high';
      icon = '🔧';
    } else if (totalTime > 120 || operations.length > 3) {
      complexity = 'medium';
      icon = '⚙️';
    }
    
    return { total: operations.length, complexity, icon, totalTime };
  };

  const sortedData = useMemo(() => {
    if (!data?.data) return [];
    
    const orders = [...data.data];
    
    // Сортировка по приоритету и дедлайну
    return orders.sort((a, b) => {
      // Сначала по приоритету
      const priorityOrder = {
        [PriorityV2.HIGH]: 3,
        [PriorityV2.MEDIUM]: 2,
        [PriorityV2.LOW]: 1,
        [PriorityV2.URGENT]: 4
      };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Затем по дедлайну
      const aDeadline = dayjs(a.deadline);
      const bDeadline = dayjs(b.deadline);
      
      return aDeadline.diff(bDeadline);
    });
  }, [data?.data]);

  const columns: ColumnsType<OrderV2> = [
    {
      title: 'Позиция',
      key: 'position',
      width: 80,
      render: (_, __, index) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: index < 3 ? '#ff4d4f' : index < 10 ? '#faad14' : '#52c41a',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {index + 1}
        </div>
      ),
    },
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      width: 200,
      render: (text: string, record: OrderV2) => (
        <Space>
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>
          {record.pdfPath && (
            <Tooltip title="Открыть PDF чертеж">
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined />}
                href={`/api/orders/${record.id}/pdf`}
                target="_blank"
                className="pdf-button"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number) => (
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          {quantity}
        </div>
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: PriorityV2) => {
        const config = getPriorityConfig(priority);
        return (
          <Tag color={config.color} style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {config.icon} {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (date: string) => {
        const deadlineInfo = getDeadlineInfo(date);
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 'bold' }}>
              {dayjs(date).format('DD.MM.YYYY')}
            </span>
            <Tag 
              color={deadlineInfo.status === 'overdue' ? 'red' : deadlineInfo.status === 'critical' ? 'red' : deadlineInfo.status === 'warning' ? 'orange' : 'green'}
              style={{ fontSize: '11px' }}
            >
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {deadlineInfo.text}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Операции',
      dataIndex: 'operations',
      key: 'operations',
      width: 150,
      render: (operations: any[]) => {
        const opsInfo = getOperationsComplexity(operations);
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 'bold' }}>
              {opsInfo.icon} {opsInfo.total} оп.
            </span>
            {opsInfo.totalTime > 0 && (
              <Tag 
                color={opsInfo.complexity === 'high' ? 'red' : opsInfo.complexity === 'medium' ? 'orange' : 'blue'}
                style={{ fontSize: '11px' }}
              >
                {opsInfo.totalTime} мин
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Тип работы',
      dataIndex: 'workType',
      key: 'workType',
      ellipsis: true,
      render: (workType: string) => (
        <Tooltip title={workType}>
          <span style={{ color: '#666' }}>{workType}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: OrderV2) => (
        <div className="action-buttons">
          <Tooltip title="Редактировать заказ">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record.id)}
              size="small"
              className="action-button edit-button"
            />
          </Tooltip>
          <DeleteMenuButton
            orderId={record.id}
            selectedIds={selectedRowKeys as number[]}
            onDeleteSuccess={() => {
              onRefresh?.();
              onSelectionChange?.([]);
            }}
          />
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    onFilterChange({ ...filter, search: value, page: 1 });
  };

  const handlePriorityFilter = (value: PriorityV2 | undefined) => {
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
      onSelectionChange?.(keys);
    },
  };

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки данных"
        description="Не удалось загрузить список заказов. Проверьте подключение к серверу."
        type="error"
        showIcon
        action={
          <Button size="small" onClick={onRefresh}>
            Попробовать снова
          </Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <Space size="middle">
          <Search
            placeholder="Поиск по номеру чертежа..."
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
            <Option value={PriorityV2.HIGH}>🔥 Высокий</Option>
            <Option value={PriorityV2.MEDIUM}>⚡ Средний</Option>
            <Option value={PriorityV2.LOW}>📋 Низкий</Option>
            <Option value={PriorityV2.URGENT}>⚠️ Срочный</Option>
          </Select>
        </Space>
        
        {selectedRowKeys.length > 0 && (
          <Alert
            message={`Выбрано заказов: ${selectedRowKeys.length}`}
            type="info"
            showIcon
            closable
            onClose={() => onSelectionChange?.([])}
          />
        )}
      </div>

      <Table
        columns={columns}
        dataSource={sortedData}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          current: filter.page,
          pageSize: filter.limit,
          total: data?.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} из ${total} заказов`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        size="middle"
        rowClassName={(record, index) => {
          const deadlineInfo = getDeadlineInfo(record.deadline);
          let className = '';
          
          if (deadlineInfo.status === 'overdue') {
            className = 'row-overdue';
          } else if (deadlineInfo.status === 'critical') {
            className = 'row-critical';
          } else if (record.priority === PriorityV2.HIGH) {
            className = 'row-high-priority';
          }
          
          return className;
        }}
      />
    </Space>
  );
};
