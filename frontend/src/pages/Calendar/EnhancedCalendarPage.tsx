/**
 * @file: EnhancedCalendarPage.tsx
 * @description: Улучшенная страница календаря с детализацией операций и смен
 * @dependencies: EnhancedProductionCalendar, enhanced calendar components
 * @created: 2025-06-11
 */
import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  DatePicker, 
  Space, 
  Tabs, 
  Card, 
  Button, 
  Typography, 
  Alert, 
  Tooltip,
  Select,
  Switch
} from 'antd';
import { 
  CalendarOutlined, 
  BarChartOutlined, 
  AlertOutlined, 
  SettingOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import { EnhancedProductionCalendar } from './components/EnhancedProductionCalendar';
import { MachineUtilization } from './components/MachineUtilization';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

dayjs.locale('ru');

interface CalendarSettings {
  showWeekends: boolean;
  showEfficiency: boolean;
  showSetupTime: boolean;
  viewMode: 'detailed' | 'compact';
}

export const EnhancedCalendarPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week').add(2, 'week'), // 3 недели для лучшего обзора
  ]);

  const [settings, setSettings] = useState<CalendarSettings>({
    showWeekends: true,
    showEfficiency: true,
    showSetupTime: true,
    viewMode: 'detailed'
  });

  const [activeTab, setActiveTab] = useState('enhanced-calendar');

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleSettingChange = (key: keyof CalendarSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filter = {
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    ...settings
  };

  // Предустановленные периоды
  const presets = [
    { 
      label: 'Эта неделя', 
      value: [dayjs().startOf('week'), dayjs().endOf('week')] as [Dayjs, Dayjs]
    },
    { 
      label: 'Следующая неделя', 
      value: [
        dayjs().add(1, 'week').startOf('week'), 
        dayjs().add(1, 'week').endOf('week')
      ] as [Dayjs, Dayjs]
    },
    { 
      label: '2 недели', 
      value: [
        dayjs().startOf('week'), 
        dayjs().endOf('week').add(1, 'week')
      ] as [Dayjs, Dayjs]
    },
    { 
      label: 'Этот месяц', 
      value: [dayjs().startOf('month'), dayjs().endOf('month')] as [Dayjs, Dayjs]
    },
    { 
      label: 'Следующий месяц', 
      value: [
        dayjs().add(1, 'month').startOf('month'), 
        dayjs().add(1, 'month').endOf('month')
      ] as [Dayjs, Dayjs]
    },
  ];

  // Рассчитываем рабочие дни
  const calculateWorkingDays = () => {
    let workingDays = 0;
    let current = dateRange[0];
    while (current.isBefore(dateRange[1]) || current.isSame(dateRange[1], 'day')) {
      // Рабочие дни: Воскресенье-Четверг (0,1,2,3,4)
      // Выходные: Пятница-Суббота (5,6)
      if (![5, 6].includes(current.day())) {
        workingDays++;
      }
      current = current.add(1, 'day');
    }
    return workingDays;
  };

  const workingDaysCount = calculateWorkingDays();
  const totalDays = dateRange[1].diff(dateRange[0], 'day') + 1;

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto' }}>
      {/* Заголовок и основные настройки */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <CalendarOutlined /> Производственный календарь
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Детализированный обзор операций, смен и загрузки станков
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ExportOutlined />} type="default">
                Экспорт
              </Button>
              <Button icon={<ReloadOutlined />} type="primary">
                Обновить
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Настройки периода и отображения */}
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Период:
              </Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD.MM.YYYY"
                allowClear={false}
                presets={presets}
                style={{ width: '100%' }}
                placeholder={['Дата начала', 'Дата окончания']}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Режим отображения:
              </Text>
              <Select
                value={settings.viewMode}
                onChange={(value) => handleSettingChange('viewMode', value)}
                style={{ width: '100%' }}
              >
                <Option value="detailed">Детализированный</Option>
                <Option value="compact">Компактный</Option>
              </Select>
            </div>
          </Col>

          <Col xs={24} md={10}>
            <div>
              <Text style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Настройки отображения:
              </Text>
              <Space wrap>
                <Tooltip title="Показывать выходные дни (пятница-суббота)">
                  <Switch
                    checked={settings.showWeekends}
                    onChange={(checked) => handleSettingChange('showWeekends', checked)}
                    checkedChildren="Выходные"
                    unCheckedChildren="Только рабочие"
                  />
                </Tooltip>
                
                <Tooltip title="Показывать показатели эффективности">
                  <Switch
                    checked={settings.showEfficiency}
                    onChange={(checked) => handleSettingChange('showEfficiency', checked)}
                    checkedChildren="Эффективность"
                    unCheckedChildren="Без эффективности"
                  />
                </Tooltip>

                <Tooltip title="Показывать время наладки">
                  <Switch
                    checked={settings.showSetupTime}
                    onChange={(checked) => handleSettingChange('showSetupTime', checked)}
                    checkedChildren="Наладка"
                    unCheckedChildren="Без наладки"
                  />
                </Tooltip>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Статистика периода */}
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col xs={8} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {totalDays}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Всего дней</div>
            </Card>
          </Col>
          
          <Col xs={8} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                {workingDaysCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Рабочих дней</div>
            </Card>
          </Col>
          
          <Col xs={8} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                {totalDays - workingDaysCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Выходных</div>
            </Card>
          </Col>

          <Col xs={24} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                {Math.round((workingDaysCount / totalDays) * 100)}%
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Загрузка периода</div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Информационное сообщение */}
      <Alert
        message="Особенности календаря"
        description="В календаре пятница и суббота являются выходными днями. Продолжительность операций рассчитывается в рабочих днях с учетом времени наладки. Наведите курсор на ячейку для детальной информации."
        type="info"
        showIcon
        closable
        style={{ marginBottom: '24px' }}
        icon={<InfoCircleOutlined />}
      />

      {/* Вкладки календаря */}
      <Card>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'enhanced-calendar',
              label: (
                <span>
                  <CalendarOutlined />
                  Производственный календарь
                </span>
              ),
              children: <EnhancedProductionCalendar filter={filter} />
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
      </Card>

      {/* Справочная информация */}
      <Card 
        title="Справка по календарю" 
        size="small" 
        style={{ marginTop: '24px' }}
        bodyStyle={{ fontSize: '13px' }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div>
              <Text strong>🎯 Отображаемые данные:</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li><strong>Название станка</strong> - код станка и тип обработки</li>
                <li><strong>Общее количество</strong> - деталей за дневную (☀️) и ночную (🌙) смены</li>
                <li><strong>Наладка</strong> - время наладки отображается значком 🔧</li>
                <li><strong>Эффективность</strong> - процент выполнения плана по времени</li>
                <li><strong>Прогресс</strong> - полоса выполнения для активных операций</li>
              </ul>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div>
              <Text strong>📅 Рабочие дни:</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li><strong>Рабочие</strong> - Воскресенье, Понедельник, Вторник, Среда, Четверг</li>
                <li><strong>Выходные</strong> - Пятница, Суббота (отмечены 🏖️)</li>
                <li><strong>Продолжительность операций</strong> - рассчитывается только в рабочих днях</li>
                <li><strong>Праздники</strong> - отмечаются отдельно (🎉)</li>
              </ul>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
          <Text strong style={{ color: '#1890ff' }}>💡 Совет:</Text>
          <Text style={{ marginLeft: '8px' }}>
            Используйте наведение курсора на ячейки для получения детальной информации об операциях, 
            операторах и показателях эффективности. Переключайтесь между вкладками для разных видов анализа.
          </Text>
        </div>
      </Card>
    </div>
  );
};
