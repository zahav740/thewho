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
import { useTranslation } from '../../../i18n';

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
  const { t } = useTranslation();
  const formatTime = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  const getShiftTypeTag = (type: ShiftType) => {
    return type === ShiftType.DAY ? (
      <Tag color="orange">{t('shifts.day')}</Tag>
    ) : (
      <Tag color="blue">{t('shifts.night')}</Tag>
    );
  };

  const columns: ColumnsType<ShiftRecord> = [
    {
      title: t('form.date'),
      dataIndex: 'date',
      key: 'date',
      width: 80,
      render: (date: string) => dayjs(date).format('DD.MM'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: t('shifts.shift'),
      dataIndex: 'shiftType',
      key: 'shiftType',
      width: 70,
      render: (type: ShiftType) => (
        <Tag color={type === ShiftType.DAY ? "orange" : "blue"} style={{ fontSize: '11px', padding: '2px 6px' }}>
          {type === ShiftType.DAY ? t('shifts.day') : t('shifts.night')}
        </Tag>
      ),
    },
    {
      title: t('form.machine'),
      key: 'machine',
      width: 90,
      render: (record: ShiftRecord) => {
        if (!record.machineId) {
          return <Tag color="default" style={{ fontSize: '11px' }}>{t('shifts.machine_not_specified')}</Tag>;
        }
        
        return (
          <Tooltip title={`${t('form.type')}: ${record.machineType || t('shifts.unknown_type')}`}>
            <Tag color="geekblue" style={{ fontSize: '11px', padding: '2px 6px' }}>
              {record.machineCode || `${record.machineId}`}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: `${t('form.operation')} / ${t('order_info.drawing')}`,
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
          return <Tag color="default" style={{ fontSize: '11px' }}>{t('shifts.operation_not_specified')}</Tag>;
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
      title: t('shifts.setup'),
      key: 'setup',
      width: 80,
      render: (record: ShiftRecord) => {
        if (!record.setupTime) {
          return <span style={{ fontSize: '11px', color: '#ccc' }}>-</span>;
        }
        return (
          <Tooltip title={record.setupOperator ? `${t('form.operator')}: ${record.setupOperator}` : t('shifts.operation_not_specified')}>
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
      title: t('shifts.day_shift'),
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
                {record.dayShiftQuantity} {t('shifts.pieces')}
              </Tag>
              {record.dayShiftTimePerUnit && (
                <span style={{ color: '#666', fontSize: '10px', marginLeft: '4px' }}>
                  {record.dayShiftTimePerUnit.toFixed(1)} {t('shifts.minutes_per_piece')}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('shifts.night_shift'),
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
                {record.nightShiftQuantity} {t('shifts.pieces')}
              </Tag>
              {record.nightShiftTimePerUnit && (
                <span style={{ color: '#666', fontSize: '10px', marginLeft: '4px' }}>
                  {record.nightShiftTimePerUnit.toFixed(1)} {t('shifts.minutes_per_piece')}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('shifts.actions'),
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
            title={t('shifts.delete_confirm')}
            onConfirm={() => onDelete(record.id)}
            okText={t('button.confirm')}
            cancelText={t('button.cancel')}
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
        message={t('shifts.loading_error')}
        description={t('shifts.loading_records')}
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
        showTotal: (total) => `${t('shifts.total')}: ${total}`,
        simple: true,
      }}
      style={{
        fontSize: '12px',
      }}
    />
  );
};
