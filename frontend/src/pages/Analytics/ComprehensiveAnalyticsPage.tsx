/**
 * @file: ComprehensiveAnalyticsPage.tsx
 * @description: Полная аналитика с общими метриками всех операторов и станков
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Tabs, 
  Space, 
  Tag, 
  Typography, 
  Button,
  DatePicker,
  Select,
  Alert,
  Divider,
  Badge
} from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  ToolOutlined, 
  TrophyOutlined,
  WarningOutlined,
  ReloadOutlined,
  SettingOutlined,
  TeamOutlined,
  StarOutlined
} from '@ant-design/icons';
import { 
  calculateComprehensiveMetrics, 
  exampleComprehensiveCalculation, 
  analyzeResults 
} from '../../utils/ComprehensiveKPISystem';
import { analyticsApi } from '../../services/analyticsApi';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export const ComprehensiveAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);

  // Загрузка полной сводки аналитики
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics-summary', selectedPeriod],
    queryFn: () => {
      if (!selectedPeriod || !selectedPeriod[0] || !selectedPeriod[1]) {
        return analyticsApi.getAnalyticsSummary();
      }
      return analyticsApi.getAnalyticsSummary({
        startDate: selectedPeriod[0].format('YYYY-MM-DD'),
        endDate: selectedPeriod[1].format('YYYY-MM-DD')
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Используем реальные данные или показываем пустое состояние
  const comprehensiveMetrics = analyticsData && analyticsData.operators.length > 0 ? {
    overall: {
      totalKPI: analyticsData.kpiOee.aggregated.overallKPI,
      totalOEE: analyticsData.kpiOee.aggregated.overallOEE,
      participatingOperators: analyticsData.summary.activeOperators,
      activeMachines: analyticsData.summary.activeMachines,
      averageKPIByType: {
        operators: analyticsData.operators.length > 0 
          ? Math.round(analyticsData.operators.reduce((sum: number, o: any) => sum + o.kpi, 0) / analyticsData.operators.length)
          : 0,
        setupSpecialists: 0,
        universal: 0
      }
    },
    rankings: {
      operatorsByKPI: analyticsData.operators.sort((a: any, b: any) => b.kpi - a.kpi).map((op: any) => ({
        operatorName: op.operatorName,
        kpi: op.kpi,
        type: 'operator'
      })),
      machinesByOEE: analyticsData.machines.sort((a: any, b: any) => b.oee - a.oee)
    },
    operators: {},
    machines: {}
  } : {
    // Пустое состояние вместо примеров
    overall: {
      totalKPI: 0,
      totalOEE: 0,
      participatingOperators: 0,
      activeMachines: 0,
      averageKPIByType: {
        operators: 0,
        setupSpecialists: 0,
        universal: 0
      }
    },
    rankings: {
      operatorsByKPI: [],
      machinesByOEE: []
    },
    operators: {},
    machines: {}
  };
  
  const insights = analyzeResults(comprehensiveMetrics);

  const getKPIColor = (value: number) => {
    if (value >= 90) return '#52c41a';
    if (value >= 80) return '#faad14';
    return '#f5222d';
  };

  const getOEEColor = (value: number) => {
    if (value >= 85) return '#52c41a';
    if (value >= 75) return '#faad14';
    return '#f5222d';
  };

  const getOperatorTypeIcon = (type: string) => {
    switch (type) {
      case 'operator': return <UserOutlined />;
      case 'setup_specialist': return <SettingOutlined />;
      case 'universal': return <StarOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getOperatorTypeName = (type: string) => {
    switch (type) {
      case 'operator': return 'Оператор станка';
      case 'setup_specialist': return 'Наладчик';
      case 'universal': return 'Универсальный';
      default: return 'Неизвестно';
    }
  };

  const getOperatorTypeColor = (type: string) => {
    switch (type) {
      case 'operator': return 'blue';
      case 'setup_specialist': return 'green';
      case 'universal': return 'purple';
      default: return 'default';
    }
  };

  // Колонки для рейтинга операторов
  const operatorRankingColumns = [
    {
      title: 'Место',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <Space>
          {index === 0 && <TrophyOutlined style={{ color: '#faad14' }} />}
          <Text strong>{index + 1}</Text>
        </Space>
      ),
      width: 80
    },
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (name: string, record: any) => (
        <Space>
          {getOperatorTypeIcon(record.type)}
          <div>
            <Text strong>{name}</Text>
            <br />
            <Tag color={getOperatorTypeColor(record.type)}>
              {getOperatorTypeName(record.type)}
            </Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'KPI',
      dataIndex: 'kpi',
      key: 'kpi',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small" 
          strokeColor={getKPIColor(value)}
          format={(percent) => `${percent}%`}
        />
      ),
      sorter: (a: any, b: any) => a.kpi - b.kpi
    },
    {
      title: 'Статус',
      dataIndex: 'kpi',
      key: 'status',
      render: (kpi: number) => {
        if (kpi >= 90) return <Tag color="green">🏆 Отлично</Tag>;
        if (kpi >= 80) return <Tag color="orange">✅ Хорошо</Tag>;
        return <Tag color="red">⚠️ Требует внимания</Tag>;
      }
    }
  ];

  // Колонки для рейтинга станков
  const machineRankingColumns = [
    {
      title: 'Место',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <Space>
          {index === 0 && <TrophyOutlined style={{ color: '#faad14' }} />}
          <Text strong>{index + 1}</Text>
        </Space>
      ),
      width: 80
    },
    {
      title: 'Станок',
      dataIndex: 'machineName',
      key: 'machineName',
      render: (name: string) => (
        <Space>
          <ToolOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'OEE',
      dataIndex: 'oee',
      key: 'oee',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small" 
          strokeColor={getOEEColor(value)}
          format={(percent) => `${percent}%`}
        />
      ),
      sorter: (a: any, b: any) => a.oee - b.oee
    },
    {
      title: 'Статус',
      dataIndex: 'oee',
      key: 'status',
      render: (oee: number) => {
        if (oee >= 85) return <Tag color="green">🏆 Отлично</Tag>;
        if (oee >= 75) return <Tag color="orange">✅ Хорошо</Tag>;
        return <Tag color="red">⚠️ Требует внимания</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Заголовок страницы */}
      <Card style={{ marginBottom: '24px' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0 }}>
              📊 Полная аналитика производства
            </Title>
          </Space>
          <Space>
            <RangePicker 
              value={selectedPeriod}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setSelectedPeriod([dates[0], dates[1]]);
                }
              }}
              format="DD.MM.YYYY"
            />
            <Button icon={<ReloadOutlined />} type="primary" loading={isLoading}>
              Обновить
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Обработка ошибок */}
      {error && (
        <Alert
          message="Ошибка загрузки аналитики"
          description="Не удалось загрузить полную сводку аналитики."
          type="warning"
          style={{ marginBottom: '24px' }}
          showIcon
        />
      )}

      {!isLoading && !error && (!analyticsData || (analyticsData.operators.length === 0 && analyticsData.machines.length === 0)) && (
        <Alert
          message="Нет данных о производстве"
          description="Добавьте записи смен через раздел 'Учет смен → Мониторинг' для отображения реальной аналитики."
          type="info"
          style={{ marginBottom: '24px' }}
          showIcon
          action={
            <Button type="link" href="#/shifts">
              Перейти к учету смен
            </Button>
          }
        />
      )}

      {/* Главные общие метрики */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="📈 Общий KPI всех операторов"
              value={comprehensiveMetrics.overall.totalKPI}
              suffix="%"
              valueStyle={{ color: getKPIColor(comprehensiveMetrics.overall.totalKPI), fontSize: '28px' }}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Взвешенный по времени участия
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="🏭 Общий OEE всех станков"
              value={comprehensiveMetrics.overall.totalOEE}
              suffix="%"
              valueStyle={{ color: getOEEColor(comprehensiveMetrics.overall.totalOEE), fontSize: '28px' }}
              prefix={<ToolOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Взвешенный по времени работы
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="👥 Участвующих операторов"
              value={comprehensiveMetrics.overall.participatingOperators}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
              prefix={<UserOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Всех типов в смене
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="🔧 Активных станков"
              value={comprehensiveMetrics.overall.activeMachines}
              valueStyle={{ color: '#52c41a', fontSize: '28px' }}
              prefix={<SettingOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              В производственном процессе
            </Text>
          </Card>
        </Col>
      </Row>

      {/* KPI по типам операторов */}
      <Card title="📊 KPI операторов" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={24}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="👨‍🔧 Средний KPI всех операторов"
                value={comprehensiveMetrics.overall.averageKPIByType.operators}
                suffix="%"
                valueStyle={{ color: getKPIColor(comprehensiveMetrics.overall.averageKPIByType.operators) }}
              />
              <Text type="secondary">Основан на реальных данных смен</Text>
            </Card>
          </Col>
        </Row>
      </Card>



      {/* Детальные таблицы */}
      <Tabs defaultActiveKey="rankings" type="card">
        <TabPane tab="🏆 Рейтинги" key="rankings">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="👥 Рейтинг операторов по KPI" size="small">
                <Table
                  dataSource={comprehensiveMetrics.rankings.operatorsByKPI}
                  columns={operatorRankingColumns}
                  rowKey="operatorName"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="🏭 Рейтинг станков по OEE" size="small">
                <Table
                  dataSource={comprehensiveMetrics.rankings.machinesByOEE}
                  columns={machineRankingColumns}
                  rowKey="machineName"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="📋 Детализация операторов" key="operators">
          {analyticsData && analyticsData.operators.length > 0 ? (
            <Row gutter={16}>
              {analyticsData.operators.map((operator: any, index: number) => (
                <Col span={8} key={operator.operatorName}>
                  <Card 
                    title={
                      <Space>
                        <UserOutlined />
                        <span>👤 {operator.operatorName}</span>
                      </Space>
                    }
                    size="small"
                    style={{ marginBottom: '16px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Тип: </Text>
                        <Tag color="blue">
                          Оператор станка
                        </Tag>
                      </div>
                      <div>
                        <Text strong>KPI: </Text>
                        <Progress 
                          percent={operator.kpi} 
                          size="small" 
                          strokeColor={getKPIColor(operator.kpi)}
                        />
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: '12px' }}>
                        <p><strong>Смен:</strong> {operator.totalShifts}</p>
                        <p><strong>Среднее производство:</strong> {operator.avgProduction} дет./смена</p>
                        <p><strong>Качество:</strong> {operator.qualityRate}%</p>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">
                  Нет данных об операторах за выбранный период
                </Text>
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="🏭 Детализация станков" key="machines">
          {analyticsData && analyticsData.machines.length > 0 ? (
            <Row gutter={16}>
              {analyticsData.machines.map((machine: any, index: number) => (
                <Col span={8} key={machine.machineName}>
                  <Card 
                    title={
                      <Space>
                        <ToolOutlined />
                        <span>🔧 {machine.machineName}</span>
                      </Space>
                    }
                    size="small"
                    style={{ marginBottom: '16px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>OEE: </Text>
                        <Progress 
                          percent={machine.oee} 
                          size="small" 
                          strokeColor={getOEEColor(machine.oee)}
                        />
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>Наладка:</Text>
                          <Text>{machine.setupTimePercent?.toFixed(1) || 0}%</Text>
                        </div>
                        <Progress 
                          percent={machine.setupTimePercent || 0} 
                          strokeColor="#faad14"
                          size="small"
                          showInfo={false}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <Text>Производство:</Text>
                          <Text>{machine.productionTimePercent?.toFixed(1) || 0}%</Text>
                        </div>
                        <Progress 
                          percent={machine.productionTimePercent || 0} 
                          strokeColor="#52c41a"
                          size="small"
                          showInfo={false}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <Text>Простои:</Text>
                          <Text>{machine.downTimePercent?.toFixed(1) || 0}%</Text>
                        </div>
                        <Progress 
                          percent={machine.downTimePercent || 0} 
                          strokeColor="#f5222d"
                          size="small"
                          showInfo={false}
                        />
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <ToolOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">
                  Нет данных о станках за выбранный период
                </Text>
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="🎯 Анализ и выводы" key="analysis">
          <Card title="📊 Анализ результатов">
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
              {insights.join('\n')}
            </div>
          </Card>
          
          <Card title="📐 Формулы расчета" style={{ marginTop: '16px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="👥 KPI Операторов">
                  <div style={{ fontSize: '12px' }}>
                    <p><strong>Оператор станка:</strong></p>
                    <p>KPI = Эффективность×0.6 + Качество×0.3 + Нормы×0.1</p>
                    
                    <p><strong>Наладчик:</strong></p>
                    <p>KPI = КачествоНаладки×0.5 + ГотовностьСтанка×0.3 + Безопасность×0.2</p>
                    
                    <p><strong>Универсальный:</strong></p>
                    <p>KPI = (KPI_производства × доля_производства) + (KPI_наладки × доля_наладки)</p>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="🏭 OEE и Общие метрики">
                  <div style={{ fontSize: '12px' }}>
                    <p><strong>OEE станка:</strong></p>
                    <p>OEE = (Время_наладки + Время_производства) / Общее_время × 100%</p>
                    
                    <p><strong>Общий KPI:</strong></p>
                    <p>Общий_KPI = Σ(KPI_оператора × Время_участия) / Σ(Время_всех_операторов)</p>
                    
                    <p><strong>Общий OEE:</strong></p>
                    <p>Общий_OEE = Σ(OEE_станка × Время_работы) / Σ(Время_всех_станков)</p>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};
