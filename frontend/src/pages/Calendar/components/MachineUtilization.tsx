/**
 * @file: MachineUtilization.tsx
 * @description: Компонент загруженности станков
 * @dependencies: antd, recharts, calendarApi
 * @created: 2025-01-28
 */
import React from 'react';
import { Card, Progress, Row, Col, Statistic, Spin, Alert } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '../../../services/calendarApi';

interface MachineUtilizationProps {
  filter: {
    startDate: string;
    endDate: string;
  };
}

export const MachineUtilization: React.FC<MachineUtilizationProps> = ({ filter }) => {
  const { data: utilization, isLoading, error } = useQuery({
    queryKey: ['machine-utilization', filter],
    queryFn: () => calendarApi.getMachineUtilization(filter.startDate, filter.endDate),
  });

  if (isLoading) {
    return (
      <Card>
        <Spin spinning={true}>
          <div className="loading-container" style={{ textAlign: 'center', padding: '40px', minHeight: '200px' }}>
            <div>Загрузка данных...</div>
          </div>
        </Spin>
      </Card>
    );
  }

  if (error || !utilization) {
    return (
      <Card>
        <Alert
          message="Ошибка загрузки"
          description="Не удалось загрузить данные о загруженности"
          type="error"
          showIcon
        />
      </Card>
    );
  }

  const chartData = utilization.map((machine) => {
    // Проверяем и очищаем данные для предотвращения SVG ошибок
    const utilizationPercent = typeof machine.utilizationPercent === 'number' && !isNaN(machine.utilizationPercent) 
      ? Math.max(0, Math.min(100, machine.utilizationPercent)) 
      : 0;
    
    return {
      name: machine.machineCode || 'Неизвестный станок',
      загруженность: Math.round(utilizationPercent * 100) / 100, // Округляем до 2 знаков
      свободно: Math.round((100 - utilizationPercent) * 100) / 100,
    };
  });

  const averageUtilization = utilization.length > 0
    ? Math.round(
        utilization.reduce((sum, m) => {
          const percent = typeof m.utilizationPercent === 'number' && !isNaN(m.utilizationPercent) 
            ? m.utilizationPercent 
            : 0;
          return sum + percent;
        }, 0) / utilization.length
      )
    : 0;

  const getProgressColor = (percent: number) => {
    if (percent < 50) return '#52c41a';
    if (percent < 80) return '#1890ff';
    return '#ff4d4f';
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Statistic
              title="Средняя загруженность станков"
              value={averageUtilization}
              suffix="%"
              valueStyle={{ color: getProgressColor(averageUtilization) }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Загруженность по станкам" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Legend />
                <Bar dataKey="загруженность" stackId="a" fill="#1890ff" />
                <Bar dataKey="свободно" stackId="a" fill="#f0f0f0" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Детальная информация" size="small">
            {utilization.map((machine) => {
              const safeUtilizationPercent = typeof machine.utilizationPercent === 'number' && !isNaN(machine.utilizationPercent)
                ? Math.max(0, Math.min(100, machine.utilizationPercent))
                : 0;
              const safeUsedMinutes = typeof machine.usedMinutes === 'number' && !isNaN(machine.usedMinutes)
                ? machine.usedMinutes
                : 0;
              const safeTotalMinutes = typeof machine.totalCapacityMinutes === 'number' && !isNaN(machine.totalCapacityMinutes)
                ? machine.totalCapacityMinutes
                : 0;
              
              return (
                <div key={machine.machineId} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>
                      <strong>{machine.machineCode || 'Неизвестный станок'}</strong>
                    </span>
                    <span style={{ color: '#999' }}>
                      {formatMinutes(safeUsedMinutes)} / {formatMinutes(safeTotalMinutes)}
                    </span>
                  </div>
                  <Progress
                    percent={Math.round(safeUtilizationPercent * 100) / 100}
                    strokeColor={getProgressColor(safeUtilizationPercent)}
                    format={(percent) => `${percent || 0}%`}
                  />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>
    </>
  );
};
