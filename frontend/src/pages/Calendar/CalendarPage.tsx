/**
 * @file: CalendarPage.tsx
 * @description: Страница производственного календаря
 * @dependencies: ProductionCalendar, MachineUtilization, UpcomingDeadlines
 * @created: 2025-01-28
 */
import React, { useState } from 'react';
import { Row, Col, DatePicker, Space, Tabs, Button, Typography, Alert } from 'antd';
import { CalendarOutlined, BarChartOutlined, AlertOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { ProductionCalendar } from './components/ProductionCalendar';
import { EnhancedProductionCalendar } from './components/EnhancedProductionCalendar';
import { MachineUtilization } from './components/MachineUtilization';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export const CalendarPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week').add(2, 'week'), // Увеличено до 3 недель
  ]);

  const [useEnhancedCalendar, setUseEnhancedCalendar] = useState(true); // По умолчанию используем Enhanced

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
      {/* Переключатель версий календаря */}
      <Alert
        message="Улучшенный календарь доступен!"
        description={
          <Space>
            <Text>Попробуйте новую версию календаря с детализацией смен и расчетом рабочих дней.</Text>
            <Button 
              type="link" 
              size="small"
              onClick={() => setUseEnhancedCalendar(!useEnhancedCalendar)}
            >
              {useEnhancedCalendar ? 'Переключиться на старую версию' : 'Переключиться на новую версию'}
            </Button>
          </Space>
        }
        type="info"
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
            <Button 
              icon={<SettingOutlined />}
              onClick={() => setUseEnhancedCalendar(!useEnhancedCalendar)}
            >
              {useEnhancedCalendar ? 'Базовый календарь' : 'Улучшенный календарь'}
            </Button>
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
                    {useEnhancedCalendar ? 'Улучшенный календарь производства' : 'Календарь производства'}
                  </span>
                ),
                children: useEnhancedCalendar ? 
                  <EnhancedProductionCalendar filter={filter} /> : 
                  <ProductionCalendar filter={filter} />
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

      {/* Информационное сообщение для Enhanced календаря */}
      {useEnhancedCalendar && (
        <Alert
          message="📅 Особенности улучшенного календаря"
          description={
            <div>
              <Text>• Пятница и суббота — выходные дни</Text><br/>
              <Text>• Продолжительность операций рассчитывается в рабочих днях</Text><br/>
              <Text>• Наведите курсор на ячейку для детальной информации о сменах</Text><br/>
              <Text>• Отображается время наладки и эффективность операторов</Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          icon={<InfoCircleOutlined />}
        />
      )}
    </div>
  );
};
