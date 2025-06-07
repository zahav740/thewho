/**
 * @file: OperationDetailModal.tsx
 * @description: Модальное окно с детальной статистикой по операции (ИСПРАВЛЕНО - hooks)
 * @dependencies: antd, react, operationHistoryApi
 * @created: 2025-06-07
 * @updated: 2025-06-07 - Исправлены ошибки hooks и TypeScript
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Progress,
  Typography,
  Tag,
  Space,
  Button,
  Divider,
  Alert,
  Spin,
  message,
  DatePicker,
} from 'antd';
import {
  PrinterOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import operationHistoryApi, { OperationHistoryRecord, OperatorEfficiencyStats } from '../../../services/operationHistoryApi';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface OperationDetailModalProps {
  visible: boolean;
  operation: any;
  onClose: () => void;
}

export const OperationDetailModal: React.FC<OperationDetailModalProps> = ({
  visible,
  operation,
  onClose,
}) => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [exporting, setExporting] = useState(false);

  // Загружаем историю операций для текущего чертежа
  const { data: operationHistory, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['operation-history', operation?.orderDrawingNumber, dateRange],
    queryFn: () => {
      if (!operation?.orderDrawingNumber) return [];
      return operationHistoryApi.getOperationHistory(
        operation.orderDrawingNumber,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
    },
    enabled: visible && !!operation?.orderDrawingNumber
  });

  // ИСПРАВЛЕНО: Хуки вызываются безусловно
  // Группируем данные по операторам
  const operatorStats = React.useMemo(() => {
    if (!operationHistory || operationHistory.length === 0) return [];

    const operatorGroups = operationHistory.reduce((groups: Record<string, OperationHistoryRecord[]>, record) => {
      const operator = record.operatorName || 'Неизвестно';
      if (!groups[operator]) {
        groups[operator] = [];
      }
      groups[operator].push(record);
      return groups;
    }, {});

    return Object.entries(operatorGroups).map(([operatorName, records]) => {
      const totalParts = records.reduce((sum, r) => sum + r.quantityProduced, 0);
      const totalTime = records.reduce((sum, r) => sum + (r.totalTime || 0), 0);
      const avgTimePerPart = totalParts > 0 ? totalTime / totalParts : 0;
      const planTimePerPart = operation?.estimatedTime || 15; // минут
      const planVsFact = planTimePerPart > 0 ? (planTimePerPart / avgTimePerPart * 100) : 0;
      const partsPerHour = totalTime > 0 ? (totalParts / (totalTime / 60)) : 0;
      
      // Стабильность (разброс времени на деталь)
      const timesPerPart = records.map(r => r.timePerUnit || 0).filter(t => t > 0);
      const avgTimeFromSamples = timesPerPart.reduce((a, b) => a + b, 0) / timesPerPart.length || 0;
      const variance = timesPerPart.reduce((acc, time) => acc + Math.pow(time - avgTimeFromSamples, 2), 0) / timesPerPart.length;
      const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgTimeFromSamples * 100));
      
      // Общий рейтинг
      const efficiency = Math.min(100, Math.max(0, planVsFact));
      const rating = (Math.min(10, partsPerHour) + Math.min(10, efficiency / 10) + Math.min(10, consistency / 10)) / 3;

      return {
        operatorName,
        recordsCount: records.length,
        productivity: {
          partsPerHour: Math.round(partsPerHour * 100) / 100,
          planVsFact: Math.round(planVsFact * 10) / 10
        },
        quality: {
          averageTimePerPart: Math.round(avgTimePerPart * 10) / 10,
          deviation: Math.round(((avgTimePerPart - planTimePerPart) / planTimePerPart * 100) * 10) / 10
        },
        stability: {
          consistency: Math.round(consistency * 10) / 10
        },
        utilization: {
          workingTime: Math.round(totalTime),
          idleTime: 0,
          efficiency: Math.round(efficiency * 10) / 10
        },
        rating: Math.round(rating * 10) / 10
      };
    }).sort((a, b) => b.rating - a.rating);
  }, [operationHistory, operation?.estimatedTime]);

  // ИСПРАВЛЕНО: Хуки вызываются безусловно
  // Группируем данные по станкам
  const machineStats = React.useMemo(() => {
    if (!operationHistory || operationHistory.length === 0) return [];

    const machineGroups = operationHistory.reduce((groups: Record<string, OperationHistoryRecord[]>, record) => {
      const machine = record.machineName;
      if (!groups[machine]) {
        groups[machine] = [];
      }
      groups[machine].push(record);
      return groups;
    }, {});

    return Object.entries(machineGroups).map(([machineName, records]) => {
      const totalParts = records.reduce((sum, r) => sum + r.quantityProduced, 0);
      const totalTime = records.reduce((sum, r) => sum + (r.totalTime || 0), 0);
      const avgEfficiency = records.reduce((sum, r) => sum + (r.efficiencyRating || 0), 0) / records.length;
      
      return {
        machineName,
        totalParts,
        utilization: Math.round((totalTime / (24 * 60)) * 100 * 10) / 10, // Примерная загрузка за сутки
        efficiency: Math.round(avgEfficiency * 10) / 10,
        status: 'active'
      };
    });
  }, [operationHistory]);

  if (!operation) return null;

  const operatorColumns = [
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (text: string, record: any) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
          {record.rating >= 8.5 && <TrophyOutlined style={{ color: '#faad14' }} />}
          <Text type="secondary">({record.recordsCount} смен)</Text>
        </Space>
      ),
    },
    {
      title: 'Производительность',
      children: [
        {
          title: 'Дет/час',
          dataIndex: ['productivity', 'partsPerHour'],
          key: 'partsPerHour',
          render: (value: number) => `${value} дет/ч`,
        },
        {
          title: 'План/Факт',
          dataIndex: ['productivity', 'planVsFact'],
          key: 'planVsFact',
          render: (value: number) => (
            <Text style={{ color: value >= 100 ? '#52c41a' : value >= 90 ? '#faad14' : '#ff4d4f' }}>
              {value.toFixed(1)}%
            </Text>
          ),
        },
      ],
    },
    {
      title: 'Качество',
      children: [
        {
          title: 'Время/деталь',
          dataIndex: ['quality', 'averageTimePerPart'],
          key: 'averageTimePerPart',
          render: (value: number) => `${value} мин`,
        },
        {
          title: 'Отклонение',
          dataIndex: ['quality', 'deviation'],
          key: 'deviation',
          render: (value: number) => (
            <Text style={{ color: Math.abs(value) <= 5 ? '#52c41a' : '#faad14' }}>
              {value > 0 ? '+' : ''}{value.toFixed(1)}%
            </Text>
          ),
        },
      ],
    },
    {
      title: 'Стабильность',
      dataIndex: ['stability', 'consistency'],
      key: 'consistency',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small" 
          status={value >= 90 ? 'success' : value >= 80 ? 'active' : 'exception'}
          format={(percent) => `${percent?.toFixed(0)}%`}
        />
      ),
    },
    {
      title: 'Эффективность',
      dataIndex: ['utilization', 'efficiency'],
      key: 'efficiency',
      render: (value: number) => (
        <Tag color={value >= 95 ? 'green' : value >= 85 ? 'orange' : 'red'}>
          {value.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Рейтинг',
      dataIndex: 'rating',
      key: 'rating',
      render: (value: number) => (
        <Text strong style={{ 
          color: value >= 8.5 ? '#52c41a' : value >= 7.5 ? '#faad14' : '#ff4d4f',
          fontSize: '16px'
        }}>
          {value.toFixed(1)}/10
        </Text>
      ),
    },
  ];

  const machineColumns = [
    {
      title: 'Станок',
      dataIndex: 'machineName',
      key: 'machineName',
    },
    {
      title: 'Произведено деталей',
      dataIndex: 'totalParts',
      key: 'totalParts',
      render: (value: number) => `${value} шт`,
    },
    {
      title: 'Загрузка',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (value: number) => (
        <Progress percent={Math.min(100, value)} size="small" />
      ),
    },
    {
      title: 'Эффективность',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (value: number) => `${value}%`,
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    if (!operation.orderDrawingNumber) {
      message.error('Номер чертежа не определен');
      return;
    }

    setExporting(true);
    try {
      const result = await operationHistoryApi.exportToExcel({
        drawingNumber: operation.orderDrawingNumber,
        dateFrom: dateRange[0].toDate(),
        dateTo: dateRange[1].toDate(),
        exportType: 'excel'
      });

      message.success('Файл Excel создан успешно');
      
      // Скачиваем файл
      operationHistoryApi.utils.downloadFileDirect(result.downloadUrl.split('/').pop() || '');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      message.error('Ошибка при создании файла Excel');
    } finally {
      setExporting(false);
    }
  };

  const totalProduced = operationHistory?.reduce((sum, record) => sum + record.quantityProduced, 0) || 0;
  const targetQuantity = operation.targetQuantity || 100;
  const progressPercent = (totalProduced / targetQuantity) * 100;

  const bestOperator = operatorStats[0];

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined />
          Детальная статистика операции {operation.operationNumber}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button 
          key="export" 
          icon={<DownloadOutlined />} 
          onClick={handleExport}
          loading={exporting}
          disabled={!operationHistory || operationHistory.length === 0}
        >
          Экспорт в Excel
        </Button>,
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          Печать отчета
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Фильтры */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Space>
                <Text strong>Период анализа:</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    if (dates) {
                      setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                    }
                  }}
                  format="DD.MM.YYYY"
                />
              </Space>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => refetchHistory()}
                loading={historyLoading}
              >
                Обновить
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Общая информация об операции */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Номер чертежа"
                value={operation.orderDrawingNumber}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Тип операции"
                value={operation.operationType}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Плановое время"
                value={operation.estimatedTime}
                suffix="мин"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Записей в истории"
                value={operationHistory?.length || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>

        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Загрузка данных истории операций...</Text>
            </div>
          </div>
        ) : !operationHistory || operationHistory.length === 0 ? (
          <Alert
            message="Нет данных"
            description="Для выбранного периода нет записей об операциях. Попробуйте расширить диапазон дат."
            type="warning"
            showIcon
          />
        ) : (
          <>
            {/* Прогресс выполнения */}
            <Card size="small" title="Общая статистика по операции" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Всего произведено"
                    value={totalProduced}
                    suffix="деталей"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Среднее время на деталь"
                    value={operationHistory.length > 0 ? 
                      Math.round(operationHistory.reduce((sum, r) => sum + (r.timePerUnit || 0), 0) / operationHistory.length * 10) / 10 
                      : 0}
                    suffix="мин"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Средняя эффективность"
                    value={operationHistory.length > 0 ? 
                      Math.round(operationHistory.reduce((sum, r) => sum + (r.efficiencyRating || 0), 0) / operationHistory.length)
                      : 0}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Статистика операторов */}
            <Card size="small" title="Эффективность операторов" style={{ marginBottom: 16 }}>
              {bestOperator && (
                <Alert
                  message="Лучший оператор"
                  description={`${bestOperator.operatorName} показывает лучшие результаты с рейтингом ${bestOperator.rating}/10`}
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Table
                dataSource={operatorStats}
                columns={operatorColumns}
                pagination={false}
                size="small"
                rowKey="operatorName"
                bordered
                scroll={{ x: 800 }}
              />
            </Card>

            {/* Эффективность станков */}
            <Card size="small" title="Статистика использования станков" style={{ marginBottom: 16 }}>
              <Table
                dataSource={machineStats}
                columns={machineColumns}
                pagination={false}
                size="small"
                rowKey="machineName"
              />
            </Card>

            {/* Рекомендации */}
            <Card size="small" title="Анализ и рекомендации">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {operatorStats.length > 1 && (
                  <Alert
                    message="Различия в эффективности операторов"
                    description={`Разброс рейтингов операторов составляет ${(operatorStats[0].rating - operatorStats[operatorStats.length - 1].rating).toFixed(1)} баллов. Рассмотрите возможность обучения или перераспределения задач.`}
                    type="info"
                    showIcon
                  />
                )}
                {operationHistory.some(r => (r.efficiencyRating || 0) < 70) && (
                  <Alert
                    message="Низкая эффективность"
                    description="Обнаружены смены с эффективностью ниже 70%. Проверьте настройки оборудования и качество исходных материалов."
                    type="warning"
                    showIcon
                  />
                )}
                <Alert
                  message="Данные обновлены"
                  description={`Анализ основан на ${operationHistory.length} записях за период ${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}`}
                  type="success"
                  showIcon
                />
              </Space>
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
};
