/**
 * @file: ShiftsDataTest.tsx
 * @description: Тестовый компонент для диагностики загрузки данных смен
 * @dependencies: antd, react-query, shiftsApi
 * @created: 2025-06-15
 */
import React from 'react';
import { Card, Button, Spin, Typography, Space, Table, Tag, message } from 'antd';
import { ReloadOutlined, BugOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../../../services/shiftsApi';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export const ShiftsDataTest: React.FC = () => {
  const { data: shiftsData, isLoading, error, refetch } = useQuery({
    queryKey: ['shifts', 'test', dayjs().format('YYYY-MM-DD')],
    queryFn: async () => {
      console.log('🧪 ТЕСТ: Загружаем данные смен за сегодня');
      
      const shifts = await shiftsApi.getAll({
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
      });
      
      console.log('🧪 ТЕСТ: Получены смены:', shifts);
      console.log('🧪 ТЕСТ: Количество смен:', shifts.length);
      
      // Группируем по станкам
      const machineGroups = shifts.reduce((acc, shift) => {
        const machineId = shift.machineId;
        if (machineId !== undefined && machineId !== null) {
          if (!acc[machineId]) {
            acc[machineId] = [];
          }
          acc[machineId].push(shift);
        }
        return acc;
      }, {} as Record<number, any[]>);
      
      console.log('🧪 ТЕСТ: Группировка по станкам:', machineGroups);
      
      return {
        rawShifts: shifts,
        machineGroups,
        summary: {
          totalShifts: shifts.length,
          machinesWithShifts: Object.keys(machineGroups).length,
          totalDayProduction: shifts.reduce((sum, s) => sum + (s.dayShiftQuantity || 0), 0),
          totalNightProduction: shifts.reduce((sum, s) => sum + (s.nightShiftQuantity || 0), 0),
        }
      };
    },
    refetchInterval: 10000, // Обновляем каждые 10 секунд для теста
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Станок',
      dataIndex: 'machineId',
      key: 'machineId',
      width: 80,
      render: (machineId: number) => <Tag color="blue">{machineId}</Tag>,
    },
    {
      title: 'Чертеж',
      key: 'drawing',
      render: (record: any) => {
        const drawing = record.drawingNumber || record.orderDrawingNumber || 'Нет';
        return <Text code style={{ fontSize: '11px' }}>{drawing}</Text>;
      },
    },
    {
      title: 'День',
      children: [
        {
          title: 'Кол-во',
          dataIndex: 'dayShiftQuantity',
          key: 'dayQty',
          width: 60,
          render: (qty: number) => qty || 0,
        },
        {
          title: 'Оператор',
          dataIndex: 'dayShiftOperator',
          key: 'dayOp',
          width: 100,
          render: (op: string) => op || '-',
        },
      ],
    },
    {
      title: 'Ночь',
      children: [
        {
          title: 'Кол-во',
          dataIndex: 'nightShiftQuantity',
          key: 'nightQty',
          width: 60,
          render: (qty: number) => qty || 0,
        },
        {
          title: 'Оператор',
          dataIndex: 'nightShiftOperator',
          key: 'nightOp',
          width: 100,
          render: (op: string) => op || '-',
        },
      ],
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date: string) => dayjs(date).format('DD.MM'),
    },
  ];

  const handleTestSpecificMachine = (machineId: number) => {
    console.log(`🎯 ТЕСТ: Проверяем станок ${machineId}`);
    
    const machineShifts = shiftsData?.rawShifts.filter(s => s.machineId === machineId) || [];
    
    console.log(`📊 Станок ${machineId}:`, {
      totalShifts: machineShifts.length,
      dayProduction: machineShifts.reduce((sum, s) => sum + (s.dayShiftQuantity || 0), 0),
      nightProduction: machineShifts.reduce((sum, s) => sum + (s.nightShiftQuantity || 0), 0),
      shifts: machineShifts
    });
    
    message.info(`Станок ${machineId}: ${machineShifts.length} смен. Проверьте консоль для деталей.`);
  };

  if (isLoading) {
    return (
      <Card title="🧪 Тест загрузки данных смен" style={{ margin: '16px 0' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Загружаем данные смен...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="🧪 Тест загрузки данных смен" style={{ margin: '16px 0' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="danger">Ошибка загрузки: {(error as Error).message}</Text>
          <br />
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            style={{ marginTop: '16px' }}
          >
            Повторить попытку
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="🧪 Тест загрузки данных смен" 
      style={{ margin: '16px 0' }}
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            size="small"
          >
            Обновить
          </Button>
          <Tag color="green">
            Автообновление: 10сек
          </Tag>
        </Space>
      }
    >
      {/* Сводка */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={5}>📊 Сводка данных</Title>
        <Space wrap>
          <Tag color="blue" style={{ padding: '4px 8px' }}>
            📅 Дата: {dayjs().format('DD.MM.YYYY')}
          </Tag>
          <Tag color="green" style={{ padding: '4px 8px' }}>
            📋 Всего смен: {shiftsData?.summary.totalShifts || 0}
          </Tag>
          <Tag color="orange" style={{ padding: '4px 8px' }}>
            🏭 Станков: {shiftsData?.summary.machinesWithShifts || 0}
          </Tag>
          <Tag color="cyan" style={{ padding: '4px 8px' }}>
            ☀️ День: {shiftsData?.summary.totalDayProduction || 0} дет.
          </Tag>
          <Tag color="purple" style={{ padding: '4px 8px' }}>
            🌙 Ночь: {shiftsData?.summary.totalNightProduction || 0} дет.
          </Tag>
          <Tag color="red" style={{ padding: '4px 8px' }}>
            📊 Общий объем: {(shiftsData?.summary.totalDayProduction || 0) + (shiftsData?.summary.totalNightProduction || 0)} дет.
          </Tag>
        </Space>
      </div>

      {/* Кнопки тестирования по станкам */}
      {shiftsData?.machineGroups && Object.keys(shiftsData.machineGroups).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <Title level={5}>🎯 Тест по станкам</Title>
          <Space wrap>
            {Object.keys(shiftsData.machineGroups).map(machineId => (
              <Button
                key={machineId}
                size="small"
                icon={<BugOutlined />}
                onClick={() => handleTestSpecificMachine(parseInt(machineId))}
                style={{ marginBottom: '4px' }}
              >
                Станок {machineId} ({shiftsData.machineGroups[parseInt(machineId)].length})
              </Button>
            ))}
          </Space>
        </div>
      )}

      {/* Таблица данных */}
      <div>
        <Title level={5}>📋 Данные смен</Title>
        {shiftsData?.rawShifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">
              ⚠️ Нет данных смен за сегодня ({dayjs().format('DD.MM.YYYY')})
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Убедитесь что в базе данных есть записи в таблице shifts для текущей даты
            </Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={shiftsData?.rawShifts || []}
            rowKey="id"
            size="small"
            scroll={{ x: 700 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Всего ${total} записей`,
            }}
          />
        )}
      </div>

      {/* Диагностическая информация */}
      <div style={{ 
        marginTop: '24px', 
        padding: '12px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <Title level={5} style={{ fontSize: '14px', margin: 0, marginBottom: '8px' }}>
          🔍 Диагностика
        </Title>
        <div>
          <Text strong>API Endpoint:</Text> GET /shifts
        </div>
        <div>
          <Text strong>Параметры:</Text> startDate={dayjs().format('YYYY-MM-DD')}, endDate={dayjs().format('YYYY-MM-DD')}
        </div>
        <div>
          <Text strong>Статус:</Text> {error ? '❌ Ошибка' : '✅ OK'}
        </div>
        <div>
          <Text strong>Последнее обновление:</Text> {dayjs().format('HH:mm:ss')}
        </div>
        <div style={{ marginTop: '8px', color: '#666' }}>
          💡 Откройте консоль браузера (F12) для детальных логов загрузки и обработки данных
        </div>
      </div>
    </Card>
  );
};

export default ShiftsDataTest;