/**
 * @file: UpcomingDeadlines.tsx
 * @description: Компонент предстоящих дедлайнов (ОБНОВЛЕННЫЙ)
 * @dependencies: antd
 * @created: 2025-01-28
 * @updated: 2025-06-17 - Обновлен для работы с новым API
 */
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, InputNumber, Space, Alert, Spin, Badge } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// API для получения данных
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

const fetchUpcomingDeadlines = async (days: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/upcoming-deadlines?days=${days}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Ошибка загрузки дедлайнов:', error);
    return [];
  }
};

export const UpcomingDeadlines: React.FC = () => {
  const [daysAhead, setDaysAhead] = useState(14);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [daysAhead]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUpcomingDeadlines(daysAhead);
      setDeadlines(data);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Spin spinning={true}>
          <div className="loading-container" style={{ textAlign: 'center', padding: '40px', minHeight: '200px' }}>
            <div>Загрузка дедлайнов...</div>
          </div>
        </Spin>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Ошибка загрузки"
          description={error || 'Не удалось загрузить предстоящие дедлайны'}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  const columns = [
    {
      title: 'Чертеж',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      render: (text: string, record: any) => (
        <Space>
          {record.isAtRisk && (
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          )}
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Срок',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string, record: any) => {
        const color = record.daysUntilDeadline <= 3 ? 'red' : 
                     record.daysUntilDeadline <= 7 ? 'orange' : 'green';
        return (
          <Space direction="vertical" size={0}>
            <span>{dayjs(date).format('DD.MM.YYYY')}</span>
            <Tag color={color}>
              {record.daysUntilDeadline > 0 
                ? `Осталось ${record.daysUntilDeadline} дн.`
                : 'Просрочен!'}
            </Tag>
          </Space>
        );
      },
      sorter: (a: any, b: any) => a.daysUntilDeadline - b.daysUntilDeadline,
    },
    {
      title: 'Прогресс',
      key: 'progress',
      width: 200,
      render: (_: any, record: any) => {
        const percent = Math.round(
          (record.completedOperations / record.totalOperations) * 100
        );
        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={record.isAtRisk ? 'exception' : percent === 100 ? 'success' : 'active'}
            />
            <span style={{ fontSize: '12px', color: '#999' }}>
              {record.completedOperations} из {record.totalOperations} операций
            </span>
          </div>
        );
      },
    },
    {
      title: 'Статус',
      key: 'status',
      width: 120,
      render: (_: any, record: any) => {
        if (record.completedOperations === record.totalOperations) {
          return (
            <Badge
              status="success"
              text={
                <Space>
                  <CheckCircleOutlined />
                  Завершен
                </Space>
              }
            />
          );
        }
        
        if (record.isAtRisk) {
          return (
            <Badge
              status="error"
              text={
                <Space>
                  <ExclamationCircleOutlined />
                  Под угрозой
                </Space>
              }
            />
          );
        }

        return <Badge status="processing" text="В работе" />;
      },
    },
  ];

  const atRiskCount = Array.isArray(deadlines) ? deadlines.filter((d) => d.isAtRisk).length : 0;
  const completedCount = Array.isArray(deadlines) ? deadlines.filter(
    (d) => d.completedOperations === d.totalOperations
  ).length : 0;

  // Проверяем, что deadlines это массив
  const safeDeadlines = Array.isArray(deadlines) ? deadlines : [];

  return (
    <Card
      title="Предстоящие дедлайны"
      extra={
        <Space>
          <span>Показать заказы на</span>
          <InputNumber
            min={1}
            max={90}
            value={daysAhead}
            onChange={(value) => setDaysAhead(value || 14)}
            style={{ width: 80 }}
          />
          <span>дней вперед</span>
        </Space>
      }
    >
      {safeDeadlines && safeDeadlines.length > 0 ? (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Tag color="green">Завершено: {completedCount}</Tag>
            <Tag color="blue">В работе: {safeDeadlines.length - completedCount - atRiskCount}</Tag>
            {atRiskCount > 0 && (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                Под угрозой: {atRiskCount}
              </Tag>
            )}
          </Space>

          <Table
            columns={columns}
            dataSource={safeDeadlines}
            rowKey="orderId"
            pagination={false}
            rowClassName={(record) =>
              record.isAtRisk ? 'ant-table-row-error' : ''
            }
          />
        </>
      ) : (
        <Alert
          message="Нет предстоящих дедлайнов"
          description={`В ближайшие ${daysAhead} дней нет заказов с установленными сроками`}
          type="info"
          showIcon
        />
      )}
    </Card>
  );
};
