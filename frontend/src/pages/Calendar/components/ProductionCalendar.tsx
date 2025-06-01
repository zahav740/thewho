/**
 * @file: ProductionCalendar.tsx
 * @description: Компонент производственного календаря
 * @dependencies: antd, calendarApi
 * @created: 2025-01-28
 */
import React from 'react';
import { Card, Table, Tag, Badge, Tooltip, Spin, Alert, Empty } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { calendarApi } from '../../../services/calendarApi';

interface ProductionCalendarProps {
  filter: {
    startDate: string;
    endDate: string;
  };
}

export const ProductionCalendar: React.FC<ProductionCalendarProps> = ({ filter }) => {
  const { data: calendarData, isLoading, error } = useQuery({
    queryKey: ['calendar', filter],
    queryFn: () => calendarApi.getCalendarView(filter.startDate, filter.endDate),
  });

  if (isLoading) {
    return (
      <Card>
        <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Загрузка календаря...</div>
        </div>
      </Card>
    );
  }

  if (error || !calendarData) {
    return (
      <Card>
        <Alert
          message="Ошибка загрузки"
          description="Не удалось загрузить календарь"
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!calendarData.machineSchedules || !Array.isArray(calendarData.machineSchedules) || calendarData.machineSchedules.length === 0) {
    return (
      <Card>
        <Empty description="Нет данных для отображения" />
      </Card>
    );
  }

  // Создаем колонки для каждого дня
  const dateColumns = (calendarData.machineSchedules[0]?.days && Array.isArray(calendarData.machineSchedules[0].days)) 
    ? calendarData.machineSchedules[0].days.map((day) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <div>{dayjs(day.date).format('DD.MM')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {dayjs(day.date).format('dd')}
          </div>
        </div>
      ),
      dataIndex: dayjs(day.date).format('YYYY-MM-DD'),
      key: dayjs(day.date).format('YYYY-MM-DD'),
      width: 120,
      render: (_: any, record: any) => {
        const dayData = record.days.find(
          (d: any) => dayjs(d.date).format('YYYY-MM-DD') === dayjs(day.date).format('YYYY-MM-DD')
        );

        if (!dayData || !dayData.isWorkingDay) {
          return (
            <div style={{ textAlign: 'center', color: '#ccc' }}>
              Выходной
            </div>
          );
        }

        const hasCurrentOperation = !!dayData.currentOperation;
        const hasShifts = dayData.shifts && dayData.shifts.length > 0;

        if (!hasCurrentOperation && !hasShifts) {
          return (
            <div style={{ textAlign: 'center' }}>
              <Badge status="default" text="Свободен" />
            </div>
          );
        }

        return (
          <div>
            {hasCurrentOperation && (
              <Tooltip
                title={
                  <div>
                    <div>Заказ: {dayData.currentOperation.orderDrawingNumber}</div>
                    <div>Операция: {dayData.currentOperation.operationNumber}</div>
                    <div>Время: {dayData.currentOperation.estimatedTime} мин</div>
                  </div>
                }
              >
                <Tag color="blue" style={{ marginBottom: 4, fontSize: '11px' }}>
                  <ClockCircleOutlined /> {dayData.currentOperation.orderDrawingNumber}
                </Tag>
              </Tooltip>
            )}
            
            {hasShifts && dayData.shifts.map((shift: any, index: number) => (
              <Tooltip
                key={index}
                title={
                  <div>
                    <div>Смена: {shift.shiftType === 'DAY' ? 'Дневная' : 'Ночная'}</div>
                    <div>Заказ: {shift.orderDrawingNumber}</div>
                    <div>Количество: {shift.quantity}</div>
                    <div>Оператор: {shift.operator}</div>
                  </div>
                }
              >
                <Tag
                  color={shift.shiftType === 'DAY' ? 'orange' : 'purple'}
                  style={{ marginBottom: 2, fontSize: '10px' }}
                >
                  <CheckCircleOutlined /> {shift.quantity} шт
                </Tag>
              </Tooltip>
            ))}
          </div>
        );
      },
    }))
    : [];

  const columns = [
    {
      title: 'Станок',
      dataIndex: 'machineCode',
      key: 'machineCode',
      fixed: 'left' as const,
      width: 100,
      render: (code: string, record: any) => (
        <div>
          <strong>{code}</strong>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.machineType === 'MILLING' ? 'Фрез.' : 'Ток.'}
          </div>
        </div>
      ),
    },
    ...dateColumns,
  ];

  const dataSource = calendarData.machineSchedules.map((schedule) => ({
    key: schedule.machineId,
    machineId: schedule.machineId,
    machineCode: schedule.machineCode,
    machineType: schedule.machineType,
    days: schedule.days,
  }));

  return (
    <Card
      title={`Производственный календарь (${calendarData.totalWorkingDays} рабочих дней)`}
      size="small"
    >
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        bordered
      />
    </Card>
  );
};
