/**
 * @file: SimpleProductionView.tsx
 * @description: Упрощенная версия мониторинга с отладкой данных
 */
import React from 'react';
import { Card, Typography, Divider, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { machinesApi } from '../../../services/machinesApi';
import { shiftsApi } from '../../../services/shiftsApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const SimpleProductionView: React.FC = () => {
  // Получаем данные станков
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
  });

  // Получаем данные смен за сегодня
  const { data: todayShifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftsApi.getAll({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
  });

  // Выводим данные в консоль для отладки
  React.useEffect(() => {
    console.log('=== ДАННЫЕ СТАНКОВ ===');
    console.log('Загружается:', machinesLoading);
    console.log('Данные:', machines);
    
    console.log('=== ДАННЫЕ СМЕН ===');
    console.log('Загружается:', shiftsLoading);
    console.log('Данные:', todayShifts);
    console.log('Дата поиска:', dayjs().format('YYYY-MM-DD'));
    
    if (machines && todayShifts) {
      console.log('=== АНАЛИЗ ДАННЫХ ===');
      machines.forEach(machine => {
        const machineShifts = todayShifts.filter(shift => shift.machineId === parseInt(machine.id));
        console.log(`Станок ${machine.machineName} (ID: ${machine.id}):`);
        console.log('  - Всего смен:', machineShifts.length);
        console.log('  - Текущая операция:', machine.currentOperationDetails?.orderDrawingNumber);
        
        if (machine.currentOperationDetails) {
          const operationShifts = machineShifts.filter(shift => {
            const drawingNumber = shift.drawingNumber || shift.orderDrawingNumber;
            return drawingNumber === machine.currentOperationDetails?.orderDrawingNumber;
          });
          
          console.log('  - Смен для текущей операции:', operationShifts.length);
          
          if (operationShifts.length > 0) {
            const dayTotal = operationShifts.reduce((sum, shift) => sum + (shift.dayShiftQuantity || 0), 0);
            const nightTotal = operationShifts.reduce((sum, shift) => sum + (shift.nightShiftQuantity || 0), 0);
            const grandTotal = dayTotal + nightTotal;
            
            console.log('  - День:', dayTotal);
            console.log('  - Ночь:', nightTotal);
            console.log('  - ОБЩИЙ ОБЪЕМ:', grandTotal);
          }
        }
        console.log('---');
      });
    }
  }, [machines, machinesLoading, todayShifts, shiftsLoading]);

  if (machinesLoading || shiftsLoading) {
    return <div>Загрузка данных...</div>;
  }

  return (
    <Card title="🔍 Упрощенный вид данных производства" style={{ margin: '16px 0' }}>
      <Row gutter={[16, 16]}>
        {machines?.map(machine => {
          const machineShifts = todayShifts?.filter(shift => shift.machineId === parseInt(machine.id)) || [];
          
          let operationShifts = [];
          let dayTotal = 0;
          let nightTotal = 0;
          let grandTotal = 0;
          
          if (machine.currentOperationDetails) {
            operationShifts = machineShifts.filter(shift => {
              const drawingNumber = shift.drawingNumber || shift.orderDrawingNumber;
              return drawingNumber === machine.currentOperationDetails?.orderDrawingNumber;
            });
            
            dayTotal = operationShifts.reduce((sum, shift) => sum + (shift.dayShiftQuantity || 0), 0);
            nightTotal = operationShifts.reduce((sum, shift) => sum + (shift.nightShiftQuantity || 0), 0);
            grandTotal = dayTotal + nightTotal;
          }
          
          return (
            <Col xs={24} sm={12} lg={8} key={machine.id}>
              <Card 
                size="small" 
                title={machine.machineName}
                style={{ 
                  borderColor: machine.currentOperationDetails ? '#1890ff' : '#d9d9d9',
                  backgroundColor: machine.currentOperationDetails ? '#f0f9ff' : '#fafafa'
                }}
              >
                <div style={{ fontSize: '12px' }}>
                  <Text strong>ID станка:</Text> {machine.id}
                  <br />
                  <Text strong>Всего смен:</Text> {machineShifts.length}
                  <br />
                  
                  {machine.currentOperationDetails ? (
                    <>
                      <Divider style={{ margin: '8px 0' }} />
                      <Text strong style={{ color: '#1890ff' }}>Текущая операция:</Text>
                      <br />
                      <Text>{machine.currentOperationDetails.orderDrawingNumber}</Text>
                      <br />
                      <Text strong>Смен для операции:</Text> {operationShifts.length}
                      <br />
                      
                      {operationShifts.length > 0 ? (
                        <>
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{ 
                            padding: '8px', 
                            backgroundColor: '#e6f7ff', 
                            borderRadius: '4px',
                            border: '1px solid #91d5ff'
                          }}>
                            <Text strong style={{ color: '#1890ff' }}>ПРОИЗВОДСТВО:</Text>
                            <br />
                            <Text>День: {dayTotal}</Text>
                            <br />
                            <Text>Ночь: {nightTotal}</Text>
                            <br />
                            <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                              ОБЩИЙ ОБЪЕМ: {grandTotal}
                            </Text>
                          </div>
                        </>
                      ) : (
                        <Text type="secondary">Нет данных производства</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Divider style={{ margin: '8px 0' }} />
                      <Text type="secondary">Нет текущей операции</Text>
                    </>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
      
      <Divider />
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <Text strong>Отладочная информация:</Text>
        <br />
        Станков загружено: {machines?.length || 0}
        <br />
        Смен за сегодня: {todayShifts?.length || 0}
        <br />
        Дата поиска: {dayjs().format('YYYY-MM-DD')}
        <br />
        <Text type="secondary">Подробности в консоли браузера (F12)</Text>
      </div>
    </Card>
  );
};

export default SimpleProductionView;
