/**
 * @file: ShiftsList.tsx
 * @description: Компонент списка смен (КОМПАКТНАЯ ВЕРСИЯ - убран скролл)
 * @dependencies: antd, shift.types
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Компактная таблица, добавлен setupOperator
 */
import React from 'react';
import { Table, Tag, Button, Space, Popconfirm, Alert, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, ClockCircleOutlined, ToolOutlined } from '@ant-design/icons';
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
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
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
      width: 80,
      render: (date: string) => dayjs(date).format('DD.MM'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Смена',
      dataIndex: 'shiftType',
      key: 'shiftType',
      width: 70,
      render: (type: ShiftType) => (
        <Tag color={type === ShiftType.DAY ? "orange" : "blue"} style={{ fontSize: '11px', padding: '2px 6px' }}>
          {type === ShiftType.DAY ? 'День' : 'Ночь'}
        </Tag>
      ),
    },
    {
      title: 'Станок',
      key: 'machine',
      width: 90,
      render: (record: ShiftRecord) => {
        if (!record.machineId) {
          return <Tag color="default" style={{ fontSize: '11px' }}>Не указан</Tag>;
        }
        
        return (
          <Tooltip title={`Тип: ${record.machineType || 'Неизвестен'}`}>
            <Tag color="geekblue" style={{ fontSize: '11px', padding: '2px 6px' }}>
              {record.machineCode || `${record.machineId}`}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Операция / Чертёж',
      key: 'operation',
      width: 140,
      render: (record: ShiftRecord) => {
        // Проверяем сначала связанные данные, потом исходные
        const operationNumber = record.operationNumber || 
          (record.operation?.operationNumber) || 
          record.operationId;
        
        const drawingNumber = record.orderDrawingNumber || 
          record.operation?.order?.drawingNumber || 
          record.drawingNumber;
        
        if (!operationNumber) {
          return <Tag color="default" style={{ fontSize: '11px' }}>Операция не указана</Tag>;
        }
        
        return (
          <div style={{ fontSize: '11px' }}>
            <Tag color="green" style={{ fontSize: '10px', padding: '1px 4px', marginBottom: '2px' }}>
              №{operationNumber}
            </Tag>
            {record.operationType && (
              <div style={{ color: '#666', fontSize: '10px' }}>
                {record.operationType}
              </div>
            )}
            {drawingNumber && (
              <div style={{ color: '#666', fontSize: '10px' }}>
                {drawingNumber}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Наладка',
      key: 'setup',
      width: 80,
      render: (record: ShiftRecord) => {
        if (!record.setupTime) {
          return <span style={{ fontSize: '11px', color: '#ccc' }}>-</span>;
        }
        return (
          <Tooltip title={record.setupOperator ? `Оператор: ${record.setupOperator}` : 'Оператор не указан'}>
            <div style={{ fontSize: '11px' }}>
              <Tag color="orange" icon={<ToolOutlined />} style={{ fontSize: '10px', padding: '1px 4px' }}>
                {formatTime(record.setupTime)}
              </Tag>
              {record.setupOperator && (
                <div style={{ color: '#666', fontSize: '10px' }}>
                  {record.setupOperator}
                </div>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Дневная смена',
      key: 'dayShift',
      width: 120,
      render: (record: ShiftRecord) => {
        if (!record.dayShiftQuantity) {
          return <span style={{ fontSize: '11px', color: '#ccc' }}>-</span>;
        }
        return (
          <div style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <UserOutlined style={{ fontSize: '10px' }} />
              <strong style={{ fontSize: '11px' }}>{record.dayShiftOperator || '-'}</strong>
            </div>
            <div>
              <Tag color="blue" style={{ fontSize: '10px', padding: '1px 4px' }}>
                {record.dayShiftQuantity} шт
              </Tag>
              {record.dayShiftTimePerUnit && (
                <span style={{ color: '#666', fontSize: '10px', marginLeft: '4px' }}>
                  {record.dayShiftTimePerUnit.toFixed(1)} мин/шт
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ночная смена',
      key: 'nightShift',
      width: 120,
      render: (record: ShiftRecord) => {
        if (!record.nightShiftQuantity) {
          return <span style={{ fontSize: '11px', color: '#ccc' }}>-</span>;
        }
        return (
          <div style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <UserOutlined style={{ fontSize: '10px' }} />
              <strong style={{ fontSize: '11px' }}>{record.nightShiftOperator || 'Аркадий'}</strong>
            </div>
            <div>
              <Tag color="purple" style={{ fontSize: '10px', padding: '1px 4px' }}>
                {record.nightShiftQuantity} шт
              </Tag>
              {record.nightShiftTimePerUnit && (
                <span style={{ color: '#666', fontSize: '10px', marginLeft: '4px' }}>
                  {record.nightShiftTimePerUnit.toFixed(1)} мин/шт
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: any, record: ShiftRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record.id)}
          />
          <Popconfirm
            title="Удалить?"
            onConfirm={() => onDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
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
      size="small"
      scroll={{ x: 'max-content' }}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Всего: ${total}`,
        simple: true,
      }}
      style={{
        fontSize: '12px',
      }}
    />
  );
};
