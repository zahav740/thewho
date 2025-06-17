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
import { ModernProductionCalendar } from './components/ModernProductionCalendar';
import { FixedProductionCalendar } from './components/FixedProductionCalendar';
import { MachineUtilization } from './components/MachineUtilization';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';

const { RangePicker } = DatePicker;
const { Text } = Typography; // Убираем неиспользуемый Title

export const CalendarPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week').add(2, 'week'), // Увеличено до 3 недель
  ]);

  const [calendarType, setCalendarType] = useState<'classic' | 'enhanced' | 'modern' | 'fixed'>('fixed'); // По умолчанию используем Fixed

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
        message="🚀 Новый современный календарь!"
        description={
          <Space>
            <Text>Доступны три версии календаря: классический, улучшенный и современный с продвинутым интерфейсом.</Text>
            <Button.Group size="small">
              <Button 
                type={calendarType === 'classic' ? 'primary' : 'default'}
                onClick={() => setCalendarType('classic')}
              >
                Классический
              </Button>
              <Button 
                type={calendarType === 'enhanced' ? 'primary' : 'default'}
                onClick={() => setCalendarType('enhanced')}
              >
                Улучшенный
              </Button>
              <Button 
                type={calendarType === 'modern' ? 'primary' : 'default'}
                onClick={() => setCalendarType('modern')}
              >
                🔥 Современный
              </Button>
              <Button 
                type={calendarType === 'fixed' ? 'primary' : 'default'}
                onClick={() => setCalendarType('fixed')}
              >
                ⚡ Исправленный
              </Button>
            </Button.Group>
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
            <Button.Group>
              <Button 
                type={calendarType === 'classic' ? 'primary' : 'default'}
                icon={<CalendarOutlined />}
                onClick={() => setCalendarType('classic')}
              >
                Классический
              </Button>
              <Button 
                type={calendarType === 'enhanced' ? 'primary' : 'default'}
                icon={<BarChartOutlined />}
                onClick={() => setCalendarType('enhanced')}
              >
                Улучшенный
              </Button>
              <Button 
                type={calendarType === 'modern' ? 'primary' : 'default'}
                icon={<SettingOutlined />}
                onClick={() => setCalendarType('modern')}
              >
                🔥 Современный
              </Button>
              <Button 
                type={calendarType === 'fixed' ? 'primary' : 'default'}
                icon={<SettingOutlined />}
                onClick={() => setCalendarType('fixed')}
              >
                ⚡ Исправленный
              </Button>
            </Button.Group>
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
                    {calendarType === 'classic' && 'Классический календарь'}
                    {calendarType === 'enhanced' && 'Улучшенный календарь'}
                    {calendarType === 'modern' && '🔥 Современный календарь'}
                    {calendarType === 'fixed' && '⚡ Исправленный календарь'}
                  </span>
                ),
                children: (
                  <>
                    {calendarType === 'classic' && <ProductionCalendar filter={filter} />}
                    {calendarType === 'enhanced' && <EnhancedProductionCalendar filter={filter} />}
                    {calendarType === 'modern' && <ModernProductionCalendar filter={filter} />}
                    {calendarType === 'fixed' && <FixedProductionCalendar filter={filter} />}
                  </>
                )
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

      {/* Информационные сообщения для разных типов календарей */}
      {calendarType === 'enhanced' && (
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
      
      {calendarType === 'modern' && (
        <Alert
          message="🚀 Особенности современного календаря"
          description={
            <div>
              <Text>• Современный дизайн с карточками станков</Text><br/>
              <Text>• Режимы просмотра: сетка и таймлайн</Text><br/>
              <Text>• Фильтрация по типу станков и статусу операций</Text><br/>
              <Text>• Мини-календарь загрузки для каждого станка</Text><br/>
              <Text>• Реальные данные из базы данных производства</Text>
            </div>
          }
          type="success"
          showIcon
          style={{ marginTop: 16 }}
          icon={<InfoCircleOutlined />}
        />
      )}
      
      {calendarType === 'fixed' && (
        <Alert
          message="⚡ Исправленный календарь"
          description={
            <div>
              <Text>• Исправлены все ошибки с библиотеками</Text><br/>
              <Text>• Полная интеграция с базой данных PostgreSQL</Text><br/>
              <Text>• Современный дизайн без зависимостей от Ant Design</Text><br/>
              <Text>• Кликабельные ячейки с детальной информацией</Text><br/>
              <Text>• Реальное отображение данных из production CRM</Text>
            </div>
          }
          type="success"
          showIcon
          style={{ marginTop: 16 }}
          icon={<InfoCircleOutlined />}
        />
      )}
    </div>
  );
};
