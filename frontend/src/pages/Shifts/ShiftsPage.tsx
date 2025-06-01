/**
 * @file: ShiftsPage.tsx
 * @description: Страница учета смен
 * @dependencies: ShiftsList, ShiftForm, ShiftStatistics
 * @created: 2025-01-28
 */
import React, { useState } from 'react';
import { Row, Col, Button, DatePicker, Space } from 'antd';
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { shiftsApi } from '../../services/shiftsApi';
import { ShiftsFilter } from '../../types/shift.types';
import { ShiftsList } from './components/ShiftsList';
import { ShiftForm } from './components/ShiftForm';
import { ShiftStatistics } from './components/ShiftStatistics';

const { RangePicker } = DatePicker;

export const ShiftsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<number | undefined>();
  const [showStatistics, setShowStatistics] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  
  const queryClient = useQueryClient();

  const filter: ShiftsFilter = {
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
  };

  const { data: shifts, isLoading, error, refetch } = useQuery({
    queryKey: ['shifts', filter],
    queryFn: () => shiftsApi.getAll(filter),
  });

  const handleCreateShift = () => {
    setEditingShiftId(undefined);
    setShowForm(true);
  };

  const handleEditShift = (shiftId: number) => {
    setEditingShiftId(shiftId);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingShiftId(undefined);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="actions-bar">
            <div className="actions-bar-left">
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD.MM.YYYY"
                  allowClear={false}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateShift}
                >
                  Новая запись
                </Button>
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => setShowStatistics(!showStatistics)}
                >
                  {showStatistics ? 'Скрыть статистику' : 'Показать статистику'}
                </Button>
              </Space>
            </div>
          </div>
        </Col>
      </Row>

      {showStatistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <ShiftStatistics filter={filter} />
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <ShiftsList
            shifts={shifts || []}
            loading={isLoading}
            error={error}
            onEdit={handleEditShift}
            onDelete={async (id) => {
              await shiftsApi.delete(id);
              refetch();
            }}
          />
        </Col>
      </Row>

      <ShiftForm
        visible={showForm}
        shiftId={editingShiftId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};
