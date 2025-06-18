/**
 * @file: CalendarPage.tsx
 * @description: Адаптивная страница производственного календаря с разделением на фрезерные и токарные станки
 * @dependencies: FixedProductionCalendar, MachineUtilization, UpcomingDeadlines, ResponsiveGrid
 * @created: 2025-01-28
 * @updated: 2025-06-18 - Добавлена адаптивность и разделение станков по типам
 */
import React, { useState } from 'react';
import { Row, Col, DatePicker, Space, Tabs, Typography, Alert } from 'antd';
import { CalendarOutlined, BarChartOutlined, AlertOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { FixedProductionCalendar } from './components/FixedProductionCalendar';
import { MachineUtilization } from './components/MachineUtilization';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';

// Импорт адаптивных компонентов
import { 
  ResponsiveContainer, 
  ResponsiveActions 
} from '../../components/ResponsiveGrid';
import { useResponsive, responsiveUtils } from '../../hooks';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const CalendarPage: React.FC = () => {
  const screenInfo = useResponsive();
  const componentSize = responsiveUtils.getComponentSize(screenInfo);
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
    <ResponsiveContainer className="calendar-page">
      {/* Информация о календаре */}
      <Alert
        message="⚡ Производственный календарь с разделением по типам станков"
        description={
          <Text>Современный календарь с интеграцией PostgreSQL и разделением на 🔧 фрезерные и ⚙️ токарные станки.</Text>
        }
        type="success"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      {/* Адаптивная панель управления */}
      <ResponsiveActions 
        direction={screenInfo.isMobile ? 'vertical' : 'horizontal'}
        justify="start"
        style={{ marginBottom: 16 }}
      >
        <span style={{ fontSize: screenInfo.isMobile ? '14px' : '16px' }}>Период:</span>
        <RangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          format="DD.MM.YYYY"
          allowClear={false}
          size={componentSize}
          style={{ 
            width: screenInfo.isMobile ? '100%' : 'auto',
            minWidth: screenInfo.isMobile ? '280px' : '300px'
          }}
          presets={[
            { label: 'Текущая неделя', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
            { label: 'Следующая неделя', value: [dayjs().add(1, 'week').startOf('week'), dayjs().add(1, 'week').endOf('week')] },
            { label: '2 недели', value: [dayjs().startOf('week'), dayjs().endOf('week').add(1, 'week')] },
            { label: 'Текущий месяц', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
          ]}
        />
      </ResponsiveActions>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Tabs 
            defaultActiveKey="calendar"
            size={componentSize}
            items={[
              {
                key: 'calendar',
                label: (
                  <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                    <CalendarOutlined />
                    ⚡ Производственный календарь
                  </span>
                ),
                children: <FixedProductionCalendar filter={filter} />
              },
              {
                key: 'utilization',
                label: (
                  <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                    <BarChartOutlined />
                    {screenInfo.isMobile ? 'Загрузка' : 'Загруженность станков'}
                  </span>
                ),
                children: <MachineUtilization filter={filter} />
              },
              {
                key: 'deadlines',
                label: (
                  <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                    <AlertOutlined />
                    {screenInfo.isMobile ? 'Сроки' : 'Предстоящие сроки'}
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
    </ResponsiveContainer>
  );
};
