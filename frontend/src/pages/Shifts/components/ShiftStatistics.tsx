/**
 * @file: ShiftStatistics.tsx
 * @description: Компонент статистики смен
 * @dependencies: antd, recharts, shiftsApi
 * @created: 2025-01-28
 */
import React from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Alert } from 'antd';
import { TeamOutlined, ClockCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../../../services/shiftsApi';
import { ShiftsFilter } from '../../../types/shift.types';
import { useTranslation } from '../../../i18n';

interface ShiftStatisticsProps {
  filter: ShiftsFilter;
}

export const ShiftStatistics: React.FC<ShiftStatisticsProps> = ({ filter }) => {
  const { t } = useTranslation();
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['shift-statistics', filter],
    queryFn: () => shiftsApi.getStatistics(filter),
  });

  if (isLoading) {
    return (
      <Card>
        <div className="loading-container">
          <Spin tip={t('shifts.loading_statistics')} />
        </div>
      </Card>
    );
  }

  if (error || !statistics) {
    return (
      <Card>
        <Alert
          message={t('shifts.loading_error')}
          description={t('shifts.statistics_error')}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const chartData = [
    {
      name: 'Дневная смена',
      количество: statistics.dayShiftStats.totalQuantity,
      время: Math.round(statistics.dayShiftStats.totalTime / 60),
    },
    {
      name: 'Ночная смена',
      количество: statistics.nightShiftStats.totalQuantity,
      время: Math.round(statistics.nightShiftStats.totalTime / 60),
    },
  ];

  const operatorColumns = [
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
    },
    {
      title: 'Количество деталей',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      sorter: (a: any, b: any) => a.totalQuantity - b.totalQuantity,
    },
    {
      title: 'Общее время',
      dataIndex: 'totalTime',
      key: 'totalTime',
      render: (time: number) => formatTime(time),
      sorter: (a: any, b: any) => a.totalTime - b.totalTime,
    },
    {
      title: 'Производительность',
      key: 'productivity',
      render: (record: any) => {
        const avgTime = record.totalTime / record.totalQuantity;
        return `${avgTime.toFixed(1)} мин/дет`;
      },
    },
  ];

  return (
    <Card title="Статистика смен">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Всего записей"
            value={statistics.totalRecords}
            prefix={<ToolOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Произведено деталей"
            value={statistics.totalQuantity}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Время наладки"
            value={formatTime(statistics.totalSetupTime)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Время производства"
            value={formatTime(statistics.totalProductionTime)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Распределение по сменам" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="количество" fill="#8884d8" name="Количество (шт)" />
                <Bar yAxisId="right" dataKey="время" fill="#82ca9d" name="Время (ч)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Статистика по операторам"
            size="small"
            extra={<TeamOutlined />}
          >
            <Table
              dataSource={statistics.operatorStats}
              columns={operatorColumns}
              rowKey="operatorName"
              size="small"
              pagination={false}
              scroll={{ y: 240 }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
