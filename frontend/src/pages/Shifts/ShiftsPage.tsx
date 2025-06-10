/**
 * @file: ShiftsPage.tsx
 * @description: Страница учета смен с мониторингом активных станков
 * @dependencies: ActiveMachinesMonitor, ShiftsList, ShiftForm, ShiftStatistics
 * @created: 2025-01-28
 * @updated: 2025-06-07
 */
import React, { useState } from 'react';
import { Row, Col, Button, DatePicker, Space, Tabs } from 'antd';
import { PlusOutlined, BarChartOutlined, MonitorOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { shiftsApi } from '../../services/shiftsApi';
import { ShiftsFilter } from '../../types/shift.types';
import { ShiftsList } from './components/ShiftsList';
import { ShiftForm } from './components/ShiftForm';
import { ShiftStatistics } from './components/ShiftStatistics';
import { ActiveMachinesMonitor } from './components/ActiveMachinesMonitor';
import { useTranslation } from '../../i18n';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export const ShiftsPage: React.FC = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<number | undefined>();
  const [showStatistics, setShowStatistics] = useState(false);
  const [activeTab, setActiveTab] = useState('monitor');
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
    enabled: activeTab === 'history', // Загружаем только на вкладке истории
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
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        tabBarExtraContent={
          activeTab === 'history' ? (
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
                {t('shifts.new_record')}
              </Button>
              <Button
                icon={<BarChartOutlined />}
                onClick={() => setShowStatistics(!showStatistics)}
              >
                {showStatistics ? t('shifts.hide_statistics') : t('shifts.show_statistics')}
              </Button>
            </Space>
          ) : null
        }
      >
        <TabPane 
          tab={
            <span>
              <MonitorOutlined />
              {t('shifts.monitoring')}
            </span>
          } 
          key="monitor"
        >
          <ActiveMachinesMonitor />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <UnorderedListOutlined />
              {t('shifts.shift_history')}
            </span>
          } 
          key="history"
        >
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
        </TabPane>
      </Tabs>

      <ShiftForm
        visible={showForm}
        shiftId={editingShiftId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};
