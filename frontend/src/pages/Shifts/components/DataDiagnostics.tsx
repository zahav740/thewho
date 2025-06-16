/**
 * @file: DataDiagnostics.tsx
 * @description: Диагностический компонент для отладки данных мониторинга
 */
import React from 'react';
import { Card, Typography, Divider, Tag, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { shiftsApi } from '../../../services/shiftsApi';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export const DataDiagnostics: React.FC = () => {
  // Получаем данные станков
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
  });

  // Получаем данные смен за сегодня
  const { data: todayShifts } = useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftsApi.getAll({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
  });

  return (
    <Card title="🔍 Диагностика данных мониторинга" style={{ margin: '16px 0' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* Диагностика станков */}
        <div>
          <Title level={5}>📟 Данные станков:</Title>
          {machines ? (
            <div>
              <Text>Всего станков: <Tag color="blue">{machines.length}</Tag></Text>
              <br />
              <Text>Станки с операциями: <Tag color="green">
                {machines.filter(m => m.currentOperationDetails).length}
              </Tag></Text>
              <Divider style={{ margin: '8px 0' }} />
              {machines.slice(0, 3).map(machine => (
                <div key={machine.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <Text strong>{machine.machineName}</Text>
                  <br />
                  <Text>ID: {machine.id}</Text>
                  <br />
                  <Text>Операция: {machine.currentOperationDetails ? 
                    `${machine.currentOperationDetails.operationNumber} (${machine.currentOperationDetails.orderDrawingNumber})` : 
                    'Нет'
                  }</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text type="danger">Данные станков не загружены</Text>
          )}
        </div>

        <Divider />

        {/* Диагностика смен */}
        <div>
          <Title level={5}>📊 Данные смен за сегодня:</Title>
          {todayShifts ? (
            <div>
              <Text>Всего записей смен: <Tag color="orange">{todayShifts.length}</Tag></Text>
              <br />
              <Text>Дата поиска: <Tag>{dayjs().format('YYYY-MM-DD')}</Tag></Text>
              <Divider style={{ margin: '8px 0' }} />
              {todayShifts.slice(0, 3).map(shift => (
                <div key={shift.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                  <Text strong>Смена #{shift.id}</Text>
                  <br />
                  <Text>Станок ID: {shift.machineId}</Text>
                  <br />
                  <Text>Чертеж: {shift.drawingNumber || shift.orderDrawingNumber || 'Не указан'}</Text>
                  <br />
                  <Text>День: {shift.dayShiftQuantity || 0} деталей (оператор: {shift.dayShiftOperator || '-'})</Text>
                  <br />
                  <Text>Ночь: {shift.nightShiftQuantity || 0} деталей (оператор: {shift.nightShiftOperator || '-'})</Text>
                  <br />
                  <Text>Дата: {shift.date}</Text>
                </div>
              ))}
              {todayShifts.length > 3 && (
                <Text type="secondary">... и еще {todayShifts.length - 3} записей</Text>
              )}
            </div>
          ) : (
            <Text type="danger">Данные смен не загружены</Text>
          )}
        </div>

        <Divider />

        {/* Сопоставление данных */}
        <div>
          <Title level={5}>🔗 Сопоставление данных:</Title>
          {machines && todayShifts ? (
            machines.filter(m => m.currentOperationDetails).map(machine => {
              const machineShifts = todayShifts.filter(shift => 
                shift.machineId === parseInt(machine.id)
              );
              
              const operationShifts = todayShifts.filter(shift => {
                const drawingNumber = shift.drawingNumber || shift.orderDrawingNumber;
                return shift.machineId === parseInt(machine.id) && 
                       drawingNumber === machine.currentOperationDetails?.orderDrawingNumber;
              });

              return (
                <div key={machine.id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fff7e6', borderRadius: '4px', border: '1px solid #faad14' }}>
                  <Text strong style={{ color: '#d46b08' }}>{machine.machineName}</Text>
                  <br />
                  <Text>Текущая операция: {machine.currentOperationDetails?.orderDrawingNumber}</Text>
                  <br />
                  <Text>Всех смен для станка: <Tag color="blue">{machineShifts.length}</Tag></Text>
                  <br />
                  <Text>Смен для текущей операции: <Tag color={operationShifts.length > 0 ? 'green' : 'red'}>{operationShifts.length}</Tag></Text>
                  
                  {operationShifts.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Text strong>Производство по операции:</Text>
                      <br />
                      {operationShifts.map(shift => (
                        <div key={shift.id} style={{ marginLeft: '16px' }}>
                          <Text>День: {shift.dayShiftQuantity || 0}, Ночь: {shift.nightShiftQuantity || 0}</Text>
                        </div>
                      ))}
                      <br />
                      <Text strong style={{ color: '#1890ff' }}>
                        Общий объем: {operationShifts.reduce((sum, shift) => 
                          sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
                        )} деталей
                      </Text>
                    </div>
                  )}

                  {operationShifts.length === 0 && machineShifts.length > 0 && (
                    <div style={{ marginTop: '8px', color: '#ff4d4f' }}>
                      <Text>⚠️ Станок имеет смены, но они не соответствуют текущей операции</Text>
                      <br />
                      <Text>Проверьте соответствие номеров чертежей</Text>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <Text>Ожидание данных для сопоставления...</Text>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default DataDiagnostics;
