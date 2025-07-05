/**
 * @file: KPIOEEPage.tsx
 * @description: Основная страница KPI и OEE с правильными расчетами
 * @version: 2.0.0 - Исправленная логика без штрафа за наладку
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
  Tooltip,
  InputNumber,
  Form,
  Modal,
  Input
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ToolOutlined,
  TrophyOutlined,
  WarningOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { 
  calculateOEEAndKPI, 
  calculateAggregatedMetrics,
  ProductionShiftData,
  OEEKPIResult,
  EXCEL_FORMULAS
} from '../utils/OEECalculations';
import { analyticsApi, OEEKPIShift, AggregatedMetrics } from '../services/analyticsApi';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

interface ShiftRecord extends OEEKPIShift {
  id: string;
}

export const KPIOEEPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorForm] = Form.useForm();

  // Загрузка реальных данных из API
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-kpi-oee', selectedPeriod],
    queryFn: () => {
      if (!selectedPeriod || !selectedPeriod[0] || !selectedPeriod[1]) {
        return analyticsApi.getKPIOEEData();
      }
      return analyticsApi.getKPIOEEData({
        startDate: selectedPeriod[0].format('YYYY-MM-DD'),
        endDate: selectedPeriod[1].format('YYYY-MM-DD')
      });
    },
    staleTime: 5 * 60 * 1000, // 5 минут кеш
  });

  const shiftRecords: ShiftRecord[] = analyticsData?.shifts.map((shift, index) => ({
    ...shift,
    id: `shift-${index}`
  })) || [];

  const aggregatedMetrics = analyticsData?.aggregated || {
    overallOEE: 0,
    overallKPI: 0,
    totalProducedParts: 0,
    averageQuality: 0,
    totalActiveTime: 0,
    machineCount: 0,
    operatorCount: 0
  };

  // Пример для объяснения логики
  const exampleCalculation = calculateOEEAndKPI({
    shiftTime: 480,
    setupTime: 300,
    productionTime: 150,
    downTime: 30,
    plannedParts: 8,
    actualParts: 6,
    defectParts: 0,
    operatorName: 'Кирилл',
    machineName: 'Doosan Yashana',
    shift: 1,
    date: '2025-06-30'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#52c41a';
      case 'good': return '#faad14';
      case 'needs_attention': return '#f5222d';
      case 'critical': return '#a61d69';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return '🏆 Отлично';
      case 'good': return '✅ Хорошо';
      case 'needs_attention': return '⚠️ Внимание';
      case 'critical': return '🚨 Критично';
      default: return '❓ Неизвестно';
    }
  };

  const handleCalculatorSubmit = (values: any) => {
    const newShift: ProductionShiftData = {
      ...values,
      operatorName: values.operatorName || 'Тест',
      machineName: values.machineName || 'Тестовый станок',
      date: dayjs().format('YYYY-MM-DD'),
      shift: 1
    };

    const result = calculateOEEAndKPI(newShift);
    const newRecord: ShiftRecord = {
      ...newShift,
      id: `shift-${Date.now()}`,
      result
    };

    // В продакшен версии здесь должен быть API запрос для создания смены
    console.log('🆕 Создание новой смены:', newRecord);
    
    setShowCalculator(false);
    calculatorForm.resetFields();
  };

  // Колонки для таблицы результатов
  const shiftColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
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
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Время наладки',
      key: 'setupTime',
      render: (record: ShiftRecord) => (
        <div>
          <Text>{record.setupTime} мин</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.result.timeBreakdown.setupTimePercent}% смены
          </Text>
        </div>
      )
    },
    {
      title: 'Время работы',
      key: 'productionTime', 
      render: (record: ShiftRecord) => (
        <div>
          <Text>{record.productionTime} мин</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.result.timeBreakdown.productionTimePercent}% смены
          </Text>
        </div>
      )
    },
    {
      title: 'OEE станка (%)',
      key: 'machineOEE',
      render: (record: ShiftRecord) => (
        <div>
          <Progress 
            percent={record.result.machineOEE} 
            size="small"
            strokeColor={getStatusColor(record.result.status)}
            format={(percent) => `${percent}%`}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            = ({record.setupTime}+{record.productionTime})/{record.shiftTime}*100
          </Text>
        </div>
      ),
      sorter: (a: ShiftRecord, b: ShiftRecord) => a.result.machineOEE - b.result.machineOEE
    },
    {
      title: 'KPI оператора (%)',
      key: 'operatorKPI',
      render: (record: ShiftRecord) => (
        <div>
          <Progress 
            percent={record.result.operatorKPI} 
            size="small"
            strokeColor={getStatusColor(record.result.status)}
            format={(percent) => `${percent}%`}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Без штрафа за наладку
          </Text>
        </div>
      ),
      sorter: (a: ShiftRecord, b: ShiftRecord) => a.result.operatorKPI - b.result.operatorKPI
    },
    {
      title: 'Произведено',
      key: 'production',
      render: (record: ShiftRecord) => (
        <div>
          <Text>{record.actualParts} из {record.plannedParts}</Text>
          <br />
          <Tag color={record.result.qualityRate >= 95 ? 'green' : 'orange'}>
            Качество: {record.result.qualityRate}%
          </Tag>
        </div>
      )
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: ShiftRecord) => (
        <Tooltip title={record.result.recommendations.join(', ')}>
          <Tag color={getStatusColor(record.result.status)}>
            {getStatusText(record.result.status)}
          </Tag>
        </Tooltip>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Заголовок */}
      <Card style={{ marginBottom: '24px' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0 }}>
              📊 KPI и OEE - Правильные расчеты
            </Title>
          </Space>
          <Space>
            <Button 
              icon={<CalculatorOutlined />} 
              onClick={() => setShowCalculator(true)}
            >
              Калькулятор OEE
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              type="primary"
              loading={isLoading}
              onClick={() => refetch()}
            >
              Обновить данные
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Объяснение новой логики */}
      <Alert
        message="✅ Исправленная логика расчетов"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              <strong>OEE станка:</strong> Загруженность = (Время наладки + Время работы) / Общее время смены × 100%
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <strong>KPI оператора:</strong> Эффективность БЕЗ штрафа за время наладки (сложность разная)
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <strong>Время наладки включает:</strong> наладка + ОТК + поправки на ошибки
            </Paragraph>
          </div>
        }
        type="success"
        style={{ marginBottom: '24px' }}
      />

      {/* Обработка ошибок и пустых данных */}
      {!isLoading && !error && shiftRecords.length === 0 && (
        <Alert
          message="🔄 Используются примеры данных"
          description={
            <div>
              <p>🚧 Backend Analytics API не готов - отображаются примеры расчетов.</p>
              <p><strong>Что делать:</strong></p>
              <ol>
                <li>Перезапустить backend: <code>cd backend && npm run start:dev</code></li>
                <li>Добавить реальные данные в раздел "Учет смен"</li>
              </ol>
            </div>
          }
          type="info"
          style={{ marginBottom: '24px' }}
          showIcon
        />
      )}

      {/* Общие KPI */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Общий OEE станков"
              value={aggregatedMetrics.overallOEE}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<ToolOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {aggregatedMetrics.machineCount} станков
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Средний KPI операторов"
              value={aggregatedMetrics.overallKPI}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {aggregatedMetrics.operatorCount} операторов
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Произведено деталей"
              value={aggregatedMetrics.totalProducedParts}
              suffix="шт"
              valueStyle={{ color: '#faad14' }}
              prefix={<TrophyOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Качество: {aggregatedMetrics.averageQuality}%
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Активное время"
              value={aggregatedMetrics.totalActiveTime}
              suffix="мин"
              valueStyle={{ color: '#722ed1' }}
              prefix={<InfoCircleOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Наладка + Производство
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Табы с детальной информацией */}
      <Tabs defaultActiveKey="shifts" type="card">
        <TabPane tab="📋 Детализация смен" key="shifts">
          <Card title="Результаты расчетов по сменам">
            <Table
              dataSource={shiftRecords}
              columns={shiftColumns}
              rowKey="id"
              size="middle"
              scroll={{ x: 1200 }}
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Всего ${total} смен`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="📊 Аналитика по операторам" key="operators">
          <Card title="Аналитика операторов">
            {!isLoading && !error && shiftRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">
                  Нет данных о работе операторов за выбранный период
                </Text>
              </div>
            ) : (
              <Row gutter={16}>
                {/* Динамическая генерация карточек операторов из реальных данных */}
                {Array.from(new Set(shiftRecords.map(s => s.operatorName))).map(operatorName => {
                  const operatorShifts = shiftRecords.filter(s => s.operatorName === operatorName);
                  const avgKPI = operatorShifts.length > 0 
                    ? operatorShifts.reduce((sum, s) => sum + s.result.operatorKPI, 0) / operatorShifts.length 
                    : 0;
                  const totalParts = operatorShifts.reduce((sum, s) => sum + s.actualParts, 0);
                  
                  return (
                    <Col span={8} key={operatorName}>
                      <Card 
                        title={`👤 ${operatorName}`}
                        style={{ marginBottom: '16px' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Statistic
                            title="Средний KPI"
                            value={avgKPI}
                            suffix="%"
                            precision={1}
                            valueStyle={{ color: avgKPI >= 80 ? '#52c41a' : '#faad14' }}
                          />
                          <div>
                            <Text strong>Смен: </Text>
                            <Text>{operatorShifts.length}</Text>
                          </div>
                          <div>
                            <Text strong>Произведено: </Text>
                            <Text>{totalParts} деталей</Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </TabPane>

        <TabPane tab="🏭 Аналитика по станкам" key="machines">
          <Card title="Аналитика станков">
            {!isLoading && !error && shiftRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <ToolOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">
                  Нет данных о работе станков за выбранный период
                </Text>
              </div>
            ) : (
              <Row gutter={16}>
                {/* Динамическая генерация карточек станков из реальных данных */}
                {Array.from(new Set(shiftRecords.map(s => s.machineName))).map(machineName => {
                  const machineShifts = shiftRecords.filter(s => s.machineName === machineName);
                  const avgOEE = machineShifts.length > 0 
                    ? machineShifts.reduce((sum, s) => sum + s.result.machineOEE, 0) / machineShifts.length 
                    : 0;
                  const totalActiveTime = machineShifts.reduce((sum, s) => sum + s.setupTime + s.productionTime, 0);
                  
                  return (
                    <Col span={8} key={machineName}>
                      <Card 
                        title={`🔧 ${machineName}`}
                        style={{ marginBottom: '16px' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Statistic
                            title="Средний OEE"
                            value={avgOEE}
                            suffix="%"
                            precision={1}
                            valueStyle={{ color: avgOEE >= 85 ? '#52c41a' : '#faad14' }}
                          />
                          <div>
                            <Text strong>Смен: </Text>
                            <Text>{machineShifts.length}</Text>
                          </div>
                          <div>
                            <Text strong>Активное время: </Text>
                            <Text>{totalActiveTime} мин</Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </TabPane>

        <TabPane tab="🔄 Сравнение логики" key="comparison">
          <Card title="Демонстрация исправленной логики расчетов">
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
                    value={62.5} 
                    suffix="%" 
                    valueStyle={{ color: '#f5222d' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Считал наладку простоем
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="✅ Новая логика">
                  <Statistic 
                    title="OEE станка" 
                    value={exampleCalculation.machineOEE} 
                    suffix="%" 
                    valueStyle={{ color: getStatusColor('good') }}
                  />
                  <Statistic 
                    title="KPI оператора" 
                    value={exampleCalculation.operatorKPI} 
                    suffix="%" 
                    valueStyle={{ color: getStatusColor('good') }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="📈 Разница">
                  <Statistic 
                    title="Улучшение OEE" 
                    value={exampleCalculation.machineOEE - 62.5} 
                    suffix="%" 
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Text style={{ fontSize: '12px' }}>
                    Наладка теперь не простой
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="📐 Формулы Excel" key="formulas">
          <Card title="Правильные формулы для Excel">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>OEE станка:</Text>
                <br />
                <Text code>{EXCEL_FORMULAS.machineOEE}</Text>
                <br />
                <Text type="secondary">= (наладка + работа) / смена * 100</Text>
              </div>
              <Divider />
              <div>
                <Text strong>KPI оператора:</Text>
                <br />
                <Text code>{EXCEL_FORMULAS.operatorKPI}</Text>
                <br />
                <Text type="secondary">= эффективность * 70% + качество * 30%</Text>
              </div>
              <Divider />
              <div>
                <Text strong>Качество:</Text>
                <br />
                <Text code>{EXCEL_FORMULAS.qualityRate}</Text>
              </div>
              <Divider />
              <div>
                <Text strong>Процент наладки:</Text>
                <br />
                <Text code>{EXCEL_FORMULAS.setupPercent}</Text>
              </div>
            </Space>
          </Card>
        </TabPane>
      </Tabs>

      {/* Модальное окно калькулятора */}
      <Modal
        title="🧮 Калькулятор OEE и KPI"
        open={showCalculator}
        onCancel={() => setShowCalculator(false)}
        onOk={() => calculatorForm.submit()}
        width={600}
      >
        <Form
          form={calculatorForm}
          layout="vertical"
          onFinish={handleCalculatorSubmit}
          initialValues={{
            shiftTime: 480,
            setupTime: 120,
            productionTime: 300,
            downTime: 60,
            plannedParts: 15,
            actualParts: 12,
            defectParts: 1
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shiftTime"
                label="Время смены (мин)"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={1440} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="setupTime"
                label="Время наладки (мин)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productionTime"
                label="Время работы (мин)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="downTime"
                label="Простои (мин)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="plannedParts"
                label="План (шт)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actualParts"
                label="Факт (шт)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="defectParts"
                label="Брак (шт)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="operatorName"
                label="Оператор"
              >
                <Input placeholder="Имя оператора" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="machineName"
                label="Станок"
              >
                <Input placeholder="Название станка" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
