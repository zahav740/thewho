/**
 * @file: OrderOperationsTable.tsx
 * @description: Таблица операций заказа
 * @dependencies: antd, order.types
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Обновлено отображение осей (только 3 или 4)
 */

import React from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Operation, OperationStatus } from '../../../types/operation.types';

interface OrderOperationsTableProps {
  operations: Operation[];
  loading?: boolean;
  onEdit?: (operation: Operation) => void;
  onDelete?: (operationId: number) => void;
}

export const OrderOperationsTable: React.FC<OrderOperationsTableProps> = ({
  operations,
  loading = false,
  onEdit,
  onDelete,
}) => {
  // Функция для извлечения числа осей из формата "3-axis" или числа
  const getAxisNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/^(\d+)/);
      const axisNumber = match ? parseInt(match[1], 10) : 3;
      // Проверяем, что значение либо 3, либо 4
      return (axisNumber === 3 || axisNumber === 4) ? axisNumber : 3;
    }
    return 3;
  };
  
  // Функция для форматирования отображения machineAxes
  const formatMachineAxes = (value: string | number): string => {
    const axisNumber = getAxisNumber(value);
    return `${axisNumber}-осевая`;
  };

  const columns = [
    {
      title: '№',
      dataIndex: 'operationNumber',
      key: 'operationNumber',
      width: 50,
    },
    {
      title: 'Тип',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      render: (type: string) =>
        type === 'MILLING' ? 'Фрезерная' : type === 'TURNING' ? 'Токарная' : type,
    },
    {
      title: 'Оси',
      dataIndex: 'machineAxes',
      key: 'machineAxes',
      width: 100,
      render: (axes: string | number) => formatMachineAxes(axes),
    },
    {
      title: 'Время (мин)',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
      width: 120,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        let color = 'default';
        let text = 'Неизвестно';

        switch (status) {
          case OperationStatus.PENDING:
            color = 'default';
            text = 'Ожидает';
            break;
          case OperationStatus.IN_PROGRESS:
            color = 'processing';
            text = 'В работе';
            break;
          case OperationStatus.COMPLETED:
            color = 'success';
            text = 'Завершено';
            break;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record: Operation) => (
        <Space>
          {onEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              title="Редактировать"
            />
          )}
          {onDelete && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
              title="Удалить"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={operations}
      rowKey="id"
      pagination={false}
      size="small"
      loading={loading}
    />
  );
};
