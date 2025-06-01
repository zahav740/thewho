/**
 * @file: CalendarPage.tsx
 * @description: Страница производственного календаря
 * @dependencies: ProductionCalendar, MachineUtilization, UpcomingDeadlines
 * @created: 2025-01-28
 */
import React, { useState } from 'react';
import { Row, Col, DatePicker, Space, Tabs } from 'antd';
import { CalendarOutlined, BarChartOutlined, AlertOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { ProductionCalendar } from './components/ProductionCalendar';
import { MachineUtilization } from './components/MachineUtilization';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';

const { RangePicker } = DatePicker;

export const CalendarPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week').add(1, 'week'),
  ]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const filter = {
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
  };

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space>
            <span>Период:</span>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD.MM.YYYY"
              allowClear={false}
              presets={[
                { label: 'Текущая неделя', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                { label: 'Следующая неделя', value: [dayjs().add(1, 'week').startOf('week'), dayjs().add(1, 'week').endOf('week')] },
                { label: 'Текущий месяц', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Tabs 
            defaultActiveKey="calendar"
            items={[
              {
                key: 'calendar',
                label: (
                  <span>
                    <CalendarOutlined />
                    Календарь производства
                  </span>
                ),
                children: <ProductionCalendar filter={filter} />
              },
              {
                key: 'utilization',
                label: (
                  <span>
                    <BarChartOutlined />
                    Загруженность станков
                  </span>
                ),
                children: <MachineUtilization filter={filter} />
              },
              {
                key: 'deadlines',
                label: (
                  <span>
                    <AlertOutlined />
                    Предстоящие сроки
                  </span>
                ),
                children: <UpcomingDeadlines />
              }
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};
