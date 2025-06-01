/**
 * @file: ShiftsList.tsx
 * @description: Компонент списка смен
 * @dependencies: antd, shift.types
 * @created: 2025-01-28
 */
import React from 'react';
import { Table, Tag, Button, Space, Popconfirm, Alert, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ShiftRecord, ShiftType } from '../../../types/shift.types';

interface ShiftsListProps {
  shifts: ShiftRecord[];
  loading: boolean;
  error: any;
  onEdit: (shiftId: number) => void;
  onDelete: (shiftId: number) => void;
}

export const ShiftsList: React.FC<ShiftsListProps> = ({
  shifts,
  loading,
  error,
  onEdit,
  onDelete,
}) => {
  const formatTime = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const getShiftTypeTag = (type: ShiftType) => {
    return type === ShiftType.DAY ? (
      <Tag color="orange">Дневная</Tag>
    ) : (
      <Tag color="blue">Ночная</Tag>
    );
  };

  const columns: ColumnsType<ShiftRecord> = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Смена',
      dataIndex: 'shiftType',
      key: 'shiftType',
      width: 100,
      render: getShiftTypeTag,
    },
    {
      title: 'Станок',
      dataIndex: 'machineId',
      key: 'machineId',
      width: 80,
      render: (id: number) => `Станок ${id}`,
    },
    {
      title: 'Операция',
      dataIndex: 'operationId',
      key: 'operationId',
      width: 100,
      render: (id: number) => `Операция ${id}`,
    },
    {
      title: 'Наладка',
      key: 'setup',
      width: 150,
      render: (record: ShiftRecord) => {
        if (!record.setupTime) return '-';
        return (
          <Tooltip
            title={
              <div>
                <div>Оператор: {record.setupOperator || '-'}</div>
                <div>Тип: {record.setupType || '-'}</div>
                <div>Начало: {record.setupStartDate ? dayjs(record.setupStartDate).format('DD.MM') : '-'}</div>
              </div>
            }
          >
            <Space size="small">
              <ClockCircleOutlined />
              {formatTime(record.setupTime)}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Дневная смена',
      key: 'dayShift',
      width: 180,
      render: (record: ShiftRecord) => {
        if (!record.dayShiftQuantity) return '-';
        return (
          <Space direction="vertical" size={0}>
            <Space size="small">
              <UserOutlined />
              {record.dayShiftOperator || '-'}
            </Space>
            <div>
              Кол-во: <strong>{record.dayShiftQuantity}</strong> | 
              Время: {record.dayShiftTimePerUnit?.toFixed(1) || '-'} мин/шт
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Ночная смена',
      key: 'nightShift',
      width: 180,
      render: (record: ShiftRecord) => {
        if (!record.nightShiftQuantity) return '-';
        return (
          <Space direction="vertical" size={0}>
            <Space size="small">
              <UserOutlined />
              {record.nightShiftOperator || 'Аркадий'}
            </Space>
            <div>
              Кол-во: <strong>{record.nightShiftQuantity}</strong> | 
              Время: {record.nightShiftTimePerUnit?.toFixed(1) || '-'} мин/шт
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: ShiftRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record.id)}
          />
          <Popconfirm
            title="Удалить запись?"
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

  if (error) {
    return (
      <Alert
        message="Ошибка загрузки"
        description="Не удалось загрузить записи смен"
        type="error"
        showIcon
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={shifts}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1200 }}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Всего: ${total} записей`,
      }}
    />
  );
};
