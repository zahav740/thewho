/**
 * @file: KPIAnalyticsPage.tsx
 * @description: Раздел аналитики KPI операторов и OEE станков
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
  Divider
} from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  ToolOutlined, 
  TrophyOutlined,
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { 
  calculateCorrectedMetrics, 
  calculateKirillExample, 
  compareCalculationMethods,
  getMetricColor,
  getImprovementRecommendations
} from '../../utils/CorrectedEfficiencyCalculations';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface OperatorPerformance {
  operatorName: string;
  oee: number;
  kpi: number;
  totalShifts: number;
  avgProduction: number;
  qualityRate: number;
  recommendations: string[];
}

interface MachinePerformance {
  machineId: string;
  machineName: string;
  oee: number;
  utilization: number;
  setupTimePercent: number;
  productionTimePercent: number;
  downTimePercent: number;
  status: 'excellent' | 'good' | 'needs_attention';
}

export const KPIAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');

  // Тестовые данные для демонстрации
  const [operatorData] = useState<OperatorPerformance[]>([
    {
      operatorName: 'Kirill',
      oee: 87.5, // (120+300)/480*100
      kpi: 89.2, // Высокий KPI без штрафа за наладку
      totalShifts: 12,
      avgProduction: 11.5,
      qualityRate: 91.7,
      recommendations: ['Отличная работа', 'Поддерживать уровень']
    },
    {
      operatorName: 'Arkady',
      oee: 91.2,
      kpi: 94.1,
      totalShifts: 15,
      avgProduction: 18.2,
      qualityRate: 98.1,
      recommendations: ['Превосходный результат', 'Может обучать других']
    },
    {
      operatorName: 'Denis',
      oee: 73.5,
      kpi: 76.8,
      totalShifts: 8,
      avgProduction: 8.3,
      qualityRate: 87.4,
      recommendations: ['Нуждается в обучении', 'Анализ простоев']
    }
  ]);

  const [machineData] = useState<MachinePerformance[]>([
    {
      machineId: 'CNC-01',
      machineName: 'Doosan Yashana',
      oee: 87.5,
      utilization: 87.5,
      setupTimePercent: 25.0,
      productionTimePercent: 62.5,
      downTimePercent: 12.5,
      status: 'good'
    },
    {
      machineId: 'CNC-02', 
      machineName: 'Doosan Hadasha',
      oee: 91.2,
      utilization: 91.2,
      setupTimePercent: 20.0,
      productionTimePercent: 71.2,
      downTimePercent: 8.8,
      status: 'excellent'
    },
    {
      machineId: 'CNC-03',
      machineName: 'Mitsubishi',
      oee: 68.3,
      utilization: 68.3,
      setupTimePercent: 30.0,
      productionTimePercent: 38.3,
      downTimePercent: 31.7,
      status: 'needs_attention'
    }
  ]);

  // Демонстрация исправленных расчетов
  const exampleCalculation = calculateKirillExample();
  const comparisonResult = compareCalculationMethods({
    shiftTime: 480,
    setupTime: 120,
    productionTime: 300,
    downTime: 60,
    plannedParts: 15,
    actualParts: 12,
    defectParts: 1,
    standardTimePerPart: 25
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#52c41a';
      case 'good': return '#faad14';
      case 'needs_attention': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return '🏆 Отлично';
      case 'good': return '✅ Хорошо';
      case 'needs_attention': return '⚠️ Требует внимания';
      default: return '❓ Неизвестно';
    }
  };

  // Колонки для таблицы операторов
  const operatorColumns = [
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'OEE станка (%)',
      dataIndex: 'oee',
      key: 'oee',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small" 
          strokeColor={getMetricColor(value, 'oee')}
          format={(percent) => `${percent}%`}
        />
      ),
      sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.oee - b.oee
    },
    {
      title: 'KPI оператора (%)',
      dataIndex: 'kpi',
      key: 'kpi',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small" 
          strokeColor={getMetricColor(value, 'kpi')}
          format={(percent) => `${percent}%`}
        />
      ),
      sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.kpi - b.kpi
    },
    {
      title: 'Смены',
      dataIndex: 'totalShifts',
      key: 'totalShifts',
      sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.totalShifts - b.totalShifts
    },
    {
      title: 'Качество (%)',
      dataIndex: 'qualityRate',
      key: 'qualityRate',
      render: (value: number) => (
        <Tag color={value >= 95 ? 'green' : value >= 90 ? 'orange' : 'red'}>
          {value.toFixed(1)}%
        </Tag>
      ),
      sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.qualityRate - b.qualityRate
    },
    {
      title: 'Рекомендации',
      dataIndex: 'recommendations',
      key: 'recommendations',
      render: (recommendations: string[]) => (
        <div>
          {recommendations.map((rec, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 2 }}>
              {rec}
            </Tag>
          ))}
        </div>
      )
    }
  ];

  // Колонки для таблицы станков
  const machineColumns = [
    {
      title: 'Станок',
      dataIndex: 'machineName',
      key: 'machineName',
      render: (name: string, record: MachinePerformance) => (
        <Space>
          <ToolOutlined />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.machineId}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'OEE (%)',
      dataIndex: 'oee',
      key: 'oee',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small" 
          strokeColor={getMetricColor(value, 'oee')}
          format={(percent) => `${percent}%`}
        />
      ),
      sorter: (a: MachinePerformance, b: MachinePerformance) => a.oee - b.oee
    },
    {
      title: 'Наладка',
      dataIndex: 'setupTimePercent',
      key: 'setupTimePercent',
      render: (value: number) => `${value.toFixed(1)}%`,
      sorter: (a: MachinePerformance, b: MachinePerformance) => a.setupTimePercent - b.setupTimePercent
    },
    {
      title: 'Производство',
      dataIndex: 'productionTimePercent',
      key: 'productionTimePercent',
      render: (value: number) => `${value.toFixed(1)}%`,
      sorter: (a: MachinePerformance, b: MachinePerformance) => a.productionTimePercent - b.productionTimePercent
    },
    {
      title: 'Простои',
      dataIndex: 'downTimePercent',
      key: 'downTimePercent',
      render: (value: number) => (
        <Tag color={value <= 10 ? 'green' : value <= 15 ? 'orange' : 'red'}>
          {value.toFixed(1)}%
        </Tag>
      ),
      sorter: (a: MachinePerformance, b: MachinePerformance) => a.downTimePercent - b.downTimePercent
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
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
              📊 Аналитика KPI и OEE
            </Title>
          </Space>
          <Space>
            <RangePicker 
              value={selectedPeriod}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setSelectedPeriod([dates[0], dates[1]]);
                } else {
                  setSelectedPeriod(null);
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

      {/* Сравнение старой и новой логики */}
      <Card title="🔄 Исправленная логика расчетов" style={{ marginBottom: '24px' }}>
        <Alert
          message="Важное изменение в формулах!"
          description="Время наладки теперь НЕ считается простоем. OEE = загруженность станка. KPI оператора не штрафуется за сложность наладки."
          type="success"
          style={{ marginBottom: '16px' }}
        />
        
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="❌ Старая логика">
              <Statistic 
                title="OEE (неправильно)" 
                value={comparisonResult.old.oee} 
                suffix="%" 
                valueStyle={{ color: '#f5222d' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {comparisonResult.old.logic}
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="✅ Новая логика">
              <Statistic 
                title="OEE станка" 
                value={comparisonResult.new.oee} 
                suffix="%" 
                valueStyle={{ color: getMetricColor(comparisonResult.new.oee, 'oee') }}
              />
              <Statistic 
                title="KPI оператора" 
                value={comparisonResult.new.operatorKPI} 
                suffix="%" 
                valueStyle={{ color: getMetricColor(comparisonResult.new.operatorKPI, 'kpi') }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="📈 Разница">
              <Statistic 
                title="Улучшение OEE" 
                value={comparisonResult.difference.oeeDiff} 
                suffix="%" 
                valueStyle={{ color: '#52c41a' }}
              />
              <Text style={{ fontSize: '12px' }}>
                {comparisonResult.difference.explanation}
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Основные KPI */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Средний OEE станков"
              value={82.3}
              suffix="%"
              valueStyle={{ color: getMetricColor(82.3, 'oee') }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Средний KPI операторов"
              value={86.7}
              suffix="%"
              valueStyle={{ color: getMetricColor(86.7, 'kpi') }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Лучший результат"
              value={94.1}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Требуют внимания"
              value={1}
              suffix="станок"
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Детальная аналитика */}
      <Tabs defaultActiveKey="operators" type="card">
        <TabPane tab="👥 KPI Операторов" key="operators">
          <Card title="Рейтинг операторов по KPI">
            <Table
              dataSource={operatorData}
              columns={operatorColumns}
              rowKey="operatorName"
              pagination={false}
              size="middle"
            />
          </Card>
        </TabPane>

        <TabPane tab="🏭 OEE Станков" key="machines">
          <Card title="Эффективность станков">
            <Table
              dataSource={machineData}
              columns={machineColumns}
              rowKey="machineId"
              pagination={false}
              size="middle"
            />
          </Card>
        </TabPane>

        <TabPane tab="📋 Детализация" key="details">
          <Card title="Пример расчета для Кирилла">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Входные данные">
                  <p><strong>Смена:</strong> 480 мин (8 часов)</p>
                  <p><strong>Наладка:</strong> 120 мин (сложная + ОТК)</p>
                  <p><strong>Производство:</strong> 300 мин</p>
                  <p><strong>Простои:</strong> 60 мин</p>
                  <p><strong>Произведено:</strong> 12 деталей</p>
                  <p><strong>Брак:</strong> 1 деталь</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Результаты расчета">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>OEE станка: </Text>
                      <Tag color={getMetricColor(exampleCalculation.oee, 'oee')}>
                        {exampleCalculation.oee}%
                      </Tag>
                      <Text type="secondary">
                        = (120+300)/480*100
                      </Text>
                    </div>
                    <div>
                      <Text strong>KPI оператора: </Text>
                      <Tag color={getMetricColor(exampleCalculation.operatorKPI, 'kpi')}>
                        {exampleCalculation.operatorKPI}%
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Качество: </Text>
                      <Text>{exampleCalculation.qualityRate}%</Text>
                    </div>
                    <div>
                      <Text strong>Эффективность: </Text>
                      <Text>{exampleCalculation.productionEfficiency}%</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="📊 Разбивка времени" key="breakdown">
          <Row gutter={16}>
            {machineData.map(machine => (
              <Col span={8} key={machine.machineId}>
                <Card 
                  title={machine.machineName}
                  size="small"
                  style={{ marginBottom: '16px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text>Наладка:</Text>
                      <Progress 
                        percent={machine.setupTimePercent} 
                        strokeColor="#faad14"
                        size="small"
                      />
                    </div>
                    <div>
                      <Text>Производство:</Text>
                      <Progress 
                        percent={machine.productionTimePercent} 
                        strokeColor="#52c41a"
                        size="small"
                      />
                    </div>
                    <div>
                      <Text>Простои:</Text>
                      <Progress 
                        percent={machine.downTimePercent} 
                        strokeColor="#f5222d"
                        size="small"
                      />
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text strong>OEE: </Text>
                      <Tag color={getStatusColor(machine.status)}>
                        {machine.oee}%
                      </Tag>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};
