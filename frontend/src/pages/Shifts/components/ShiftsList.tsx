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
      width: 120,
      render: (id: number) => (
        <Tag color="geekblue">Станок {id}</Tag>
      ),
    },
    {
      title: 'Операция / Чертёж',
      key: 'operation',
      width: 180,
      render: (record: ShiftRecord) => {
        if (!record.operationId) {
          return <Tag color="default">Операция не указана</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Tag color="green">Операция №{record.operationId}</Tag>
            {record.drawingNumber && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                Чертёж: {record.drawingNumber}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Наладка',
      key: 'setup',
      width: 150,
      render: (record: ShiftRecord) => {
        if (!record.setupTime) {
          return <Tag color="default">Не требовалась</Tag>;
        }
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
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                {formatTime(record.setupTime)}
              </Tag>
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
        if (!record.dayShiftQuantity) {
          return <Tag color="default">Не работала</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Space size="small">
              <UserOutlined />
              <strong>{record.dayShiftOperator || '-'}</strong>
            </Space>
            <div style={{ fontSize: '12px' }}>
              <Tag color="blue">{record.dayShiftQuantity} шт</Tag>
              {record.dayShiftTimePerUnit && (
                <span style={{ color: '#666' }}>
                  {record.dayShiftTimePerUnit.toFixed(1)} мин/шт
                </span>
              )}
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
        if (!record.nightShiftQuantity) {
          return <Tag color="default">Не работала</Tag>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Space size="small">
              <UserOutlined />
              <strong>{record.nightShiftOperator || 'Аркадий'}</strong>
            </Space>
            <div style={{ fontSize: '12px' }}>
              <Tag color="purple">{record.nightShiftQuantity} шт</Tag>
              {record.nightShiftTimePerUnit && (
                <span style={{ color: '#666' }}>
                  {record.nightShiftTimePerUnit.toFixed(1)} мин/шт
                </span>
              )}
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
