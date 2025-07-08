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
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export const ComprehensiveAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);

  // Получаем пример расчета
  const comprehensiveMetrics = exampleComprehensiveCalculation();
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
            <Button icon={<ReloadOutlined />} type="primary">
              Обновить
            </Button>
          </Space>
        </Space>
      </Card>

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
      <Card title="📊 KPI по типам операторов" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="👨‍🔧 Операторы станков"
                value={comprehensiveMetrics.overall.averageKPIByType.operators}
                suffix="%"
                valueStyle={{ color: getKPIColor(comprehensiveMetrics.overall.averageKPIByType.operators) }}
              />
              <Text type="secondary">Производят детали</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="🔧 Наладчики"
                value={comprehensiveMetrics.overall.averageKPIByType.setupSpecialists}
                suffix="%"
                valueStyle={{ color: getKPIColor(comprehensiveMetrics.overall.averageKPIByType.setupSpecialists) }}
              />
              <Text type="secondary">Настраивают станки</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="⭐ Универсальные"
                value={comprehensiveMetrics.overall.averageKPIByType.universal}
                suffix="%"
                valueStyle={{ color: getKPIColor(comprehensiveMetrics.overall.averageKPIByType.universal) }}
              />
              <Text type="secondary">И производят, и налаживают</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Особенности расчета KPI наладчика */}
      <Alert
        message="🔧 Особенности KPI наладчика"
        description="KPI наладчика НЕ зависит от времени наладки (сложность разная!). Оценивается: качество наладки (50%) + готовность станка (30%) + безопасность (20%)"
        type="info"
        style={{ marginBottom: '24px' }}
        showIcon
      />

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
          <Row gutter={16}>
            {Object.entries(comprehensiveMetrics.operators).map(([operatorId, data]) => (
              <Col span={8} key={operatorId}>
                <Card 
                  title={
                    <Space>
                      {getOperatorTypeIcon(data.type)}
                      <span>Оператор {operatorId}</span>
                    </Space>
                  }
                  size="small"
                  style={{ marginBottom: '16px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Тип: </Text>
                      <Tag color={getOperatorTypeColor(data.type)}>
                        {getOperatorTypeName(data.type)}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>KPI: </Text>
                      <Progress 
                        percent={data.kpi} 
                        size="small" 
                        strokeColor={getKPIColor(data.kpi)}
                      />
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    {data.type === 'setup_specialist' && (
                      <div style={{ fontSize: '12px' }}>
                        <p><strong>Качество наладки:</strong> {data.details.setupQuality}%</p>
                        <p><strong>Готовность станка:</strong> {data.details.machineReadiness}%</p>
                        <p><strong>Безопасность:</strong> {data.details.safetyCompliance}%</p>
                      </div>
                    )}
                    {data.type === 'operator' && (
                      <div style={{ fontSize: '12px' }}>
                        <p><strong>Произведено:</strong> {data.details.producedParts} дет.</p>
                        <p><strong>Брак:</strong> {data.details.defectParts} дет.</p>
                        <p><strong>Время производства:</strong> {data.details.productionTime} мин</p>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="🏭 Детализация станков" key="machines">
          <Row gutter={16}>
            {Object.entries(comprehensiveMetrics.machines).map(([machineId, data]) => (
              <Col span={8} key={machineId}>
                <Card 
                  title={
                    <Space>
                      <ToolOutlined />
                      <span>Станок {machineId}</span>
                    </Space>
                  }
                  size="small"
                  style={{ marginBottom: '16px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>OEE: </Text>
                      <Progress 
                        percent={data.oee} 
                        size="small" 
                        strokeColor={getOEEColor(data.oee)}
                      />
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>Наладка:</Text>
                        <Text>{data.details.setupPercent.toFixed(1)}%</Text>
                      </div>
                      <Progress 
                        percent={data.details.setupPercent} 
                        strokeColor="#faad14"
                        size="small"
                        showInfo={false}
                      />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <Text>Производство:</Text>
                        <Text>{data.details.productionPercent.toFixed(1)}%</Text>
                      </div>
                      <Progress 
                        percent={data.details.productionPercent} 
                        strokeColor="#52c41a"
                        size="small"
                        showInfo={false}
                      />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <Text>Простои:</Text>
                        <Text>{data.details.downPercent.toFixed(1)}%</Text>
                      </div>
                      <Progress 
                        percent={data.details.downPercent} 
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
