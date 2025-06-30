/**
 * @file: CalendarPage.tsx
 * @description: Адаптивная страница производственного календаря с разделением на фрезерные и токарные станки
 * @dependencies: FixedProductionCalendar, MachineUtilization, UpcomingDeadlines, ResponsiveGrid
 * @created: 2025-01-28
 * @updated: 2025-06-23 - Добавлена поддержка переводов
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
import { useTranslation } from '../../i18n';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
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
        message={t('calendar.modern_calendar')}
        description={
          <Text>{t('calendar.modern_calendar')}</Text>
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
        <span style={{ fontSize: screenInfo.isMobile ? '14px' : '16px' }}>{t('calendar.period')}:</span>
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
            { label: t('calendar.current_week'), value: [dayjs().startOf('week'), dayjs().endOf('week')] },
            { label: t('calendar.next_week'), value: [dayjs().add(1, 'week').startOf('week'), dayjs().add(1, 'week').endOf('week')] },
            { label: t('calendar.two_weeks'), value: [dayjs().startOf('week'), dayjs().endOf('week').add(1, 'week')] },
            { label: t('calendar.current_month'), value: [dayjs().startOf('month'), dayjs().endOf('month')] },
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
                    ⚡ {t('calendar.production_calendar')}
                  </span>
                ),
                children: <FixedProductionCalendar filter={filter} />
              },
              {
                key: 'utilization',
                label: (
                  <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                    <BarChartOutlined />
                    {screenInfo.isMobile ? t('calendar.utilization') : t('calendar.machine_utilization')}
                  </span>
                ),
                children: <MachineUtilization filter={filter} />
              },
              {
                key: 'deadlines',
                label: (
                  <span style={{ fontSize: screenInfo.isMobile ? '12px' : '14px' }}>
                    <AlertOutlined />
                    {screenInfo.isMobile ? t('calendar.deadlines') : t('calendar.upcoming_deadlines')}
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
        message={t('calendar.modern_features')}
        description={
          <div>
            <Text>• {t('calendar.features.integration')}</Text><br/>
            <Text>• {t('calendar.features.design')}</Text><br/>
            <Text>• {t('calendar.features.clickable')}</Text><br/>
            <Text>• {t('calendar.features.realtime')}</Text><br/>
            <Text>• {t('calendar.features.interactive')}</Text><br/>
            <Text>• {t('calendar.features.statistics')}</Text>
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
