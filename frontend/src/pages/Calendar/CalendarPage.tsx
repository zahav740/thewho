/**
 * @file: CalendarPage.tsx
 * @description: Страница производственного календаря (УПРОЩЕННАЯ ВЕРСИЯ)
 * @dependencies: FixedProductionCalendar, MachineUtilization, UpcomingDeadlines
 * @created: 2025-01-28
 * @updated: 2025-06-17 - Удалены старые версии календарей, оставлен только исправленный
 */
import React, { useState } from 'react';
import { Row, Col, DatePicker, Space, Tabs, Typography, Alert } from 'antd';
import { CalendarOutlined, BarChartOutlined, AlertOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { FixedProductionCalendar } from './components/FixedProductionCalendar';
import { MachineUtilization } from './components/MachineUtilization';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const CalendarPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week').add(2, 'week'), // 3 недели
  ]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const filter = {
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    showWeekends: true,
    showEfficiency: true,
    showSetupTime: true,
    viewMode: 'detailed' as const
  };

  return (
    <div className="page-container">
      {/* Информация о календаре */}
      <Alert
        message="⚡ Производственный календарь"
        description={
          <Text>Современный календарь с интеграцией базы данных PostgreSQL и интерактивным интерфейсом.</Text>
        }
        type="success"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

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
                { label: '2 недели', value: [dayjs().startOf('week'), dayjs().endOf('week').add(1, 'week')] },
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
                    ⚡ Производственный календарь
                  </span>
                ),
                children: <FixedProductionCalendar filter={filter} />
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

      {/* Информация о календаре */}
      <Alert
        message="⚡ Современный производственный календарь"
        description={
          <div>
            <Text>• Полная интеграция с базой данных PostgreSQL</Text><br/>
            <Text>• Современный дизайн без зависимостей от внешних библиотек</Text><br/>
            <Text>• Кликабельные ячейки с детальной информацией об операциях</Text><br/>
            <Text>• Реальное отображение данных из production CRM</Text><br/>
            <Text>• Интерактивные карточки станков с мини-календарями</Text><br/>
            <Text>• Статистика загрузки и эффективности в реальном времени</Text>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        icon={<InfoCircleOutlined />}
      />
    </div>
  );
};
