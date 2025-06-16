/**
 * @file: ProductionVolumeCard.tsx
 * @description: Компонент для отображения объемов производства по сменам (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @dependencies: antd, react-query, dayjs
 * @created: 2025-06-15
 */
import React from 'react';
import { Card, Row, Col, Typography, Tag, Space, Button, Tooltip, Spin } from 'antd';
import { ReloadOutlined, BarChartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../../../services/shiftsApi';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ProductionVolumeCardProps {
  machine: {
    id: string;
    machineName: string;
    currentOperationDetails?: {
      orderDrawingNumber?: string;
      operationNumber?: number;
      operationType?: string;
    };
  };
  showDetailed?: boolean;
}

export const ProductionVolumeCard: React.FC<ProductionVolumeCardProps> = ({ 
  machine, 
  showDetailed = false 
}) => {
  // Получаем все смены для этого станка за сегодня
  const { data: allMachineShifts, isLoading, refetch } = useQuery({
    queryKey: ['shifts', 'machine', machine.id, dayjs().format('YYYY-MM-DD')],
    queryFn: async () => {
      console.log(`🔄 Загружаем смены для станка ${machine.machineName} (ID: ${machine.id})`);
      
      const shifts = await shiftsApi.getAll({
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
      });
      
      // Фильтруем по станку
      const machineShifts = shifts.filter(shift => shift.machineId === parseInt(machine.id));
      
      console.log(`📋 Найдено ${machineShifts.length} смен для станка ${machine.machineName}`);
      console.log('📊 Смены:', machineShifts);
      
      return machineShifts;
    },
    refetchInterval: 5000, // Обновляем каждые 5 секунд
    staleTime: 2000, // Данные считаются свежими 2 секунды
  });

  // Фильтруем смены по текущей операции
  const currentOperationShifts = React.useMemo(() => {
    if (!allMachineShifts || !machine.currentOperationDetails?.orderDrawingNumber) {
      return [];
    }

    const filtered = allMachineShifts.filter(shift => {
      const shiftDrawingNumber = shift.drawingNumber || shift.orderDrawingNumber;
      return shiftDrawingNumber === machine.currentOperationDetails?.orderDrawingNumber;
    });

    console.log(`🎯 Операция ${machine.currentOperationDetails.orderDrawingNumber}: найдено ${filtered.length} смен`);
    
    return filtered;
  }, [allMachineShifts, machine.currentOperationDetails?.orderDrawingNumber]);

  // Вычисляем объемы производства
  const productionData = React.useMemo(() => {
    const data = {
      dayShift: { quantity: 0, operator: '-' },
      nightShift: { quantity: 0, operator: 'Аркадий' },
      totalQuantity: 0,
      hasProduction: false,
    };

    currentOperationShifts.forEach(shift => {
      const dayQty = shift.dayShiftQuantity || 0;
      const nightQty = shift.nightShiftQuantity || 0;

      data.dayShift.quantity += dayQty;
      data.nightShift.quantity += nightQty;
      
      if (shift.dayShiftOperator && dayQty > 0) {
        data.dayShift.operator = shift.dayShiftOperator;
      }
      if (shift.nightShiftOperator && nightQty > 0) {
        data.nightShift.operator = shift.nightShiftOperator;
      }
    });

    data.totalQuantity = data.dayShift.quantity + data.nightShift.quantity;
    data.hasProduction = data.totalQuantity > 0;

    console.log(`📊 Производство для ${machine.machineName}:`, data);

    return data;
  }, [currentOperationShifts, machine.machineName]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '12px' }}>
        <Spin size="small" />
        <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
          Загрузка данных производства...
        </Text>
      </div>
    );
  }

  if (!machine.currentOperationDetails) {
    return (
      <div style={{ textAlign: 'center', padding: '12px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Нет активной операции
        </Text>
      </div>
    );
  }

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Заголовок операции */}
        <div style={{ marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '13px' }}>Производство по операции:</Text>
          <br />
          <Tag color="purple" style={{ fontSize: '10px', marginTop: '4px' }}>
            📋 {machine.currentOperationDetails.orderDrawingNumber}
          </Tag>
          <Tooltip title="Обновить данные">
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              style={{ padding: '0 4px', fontSize: '10px' }}
            />
          </Tooltip>
        </div>

        {/* Индикатор новой операции */}
        {!productionData.hasProduction && (
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <Tag color="green" style={{ fontSize: '11px' }}>
              🆕 НОВАЯ ОПЕРАЦИЯ
            </Tag>
            <br />
            <Text type="secondary" style={{ fontSize: '10px' }}>
              Производство еще не началось
            </Text>
          </div>
        )}

        {/* Смены день/ночь */}
        <Row gutter={8}>
          <Col span={12}>
            <div style={{ 
              textAlign: 'center', 
              padding: '8px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '4px' 
            }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>День</Text>
              <br />
              <Text strong style={{ fontSize: '18px' }}>
                {productionData.dayShift.quantity}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {productionData.dayShift.operator}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ 
              textAlign: 'center', 
              padding: '8px', 
              backgroundColor: '#f6f6f6', 
              borderRadius: '4px' 
            }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Ночь</Text>
              <br />
              <Text strong style={{ fontSize: '18px' }}>
                {productionData.nightShift.quantity}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {productionData.nightShift.operator}
              </Text>
            </div>
          </Col>
        </Row>

        {/* ОБЩИЙ ОБЪЕМ - главный компонент */}
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
          border: '2px solid #1890ff'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
              📊 ОБЩИЙ ОБЪЕМ
            </Text>
            <br />
            <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
              {productionData.totalQuantity}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
              деталей
            </Text>
            <br />
            
            {/* Детализация */}
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                День: {productionData.dayShift.quantity} + Ночь: {productionData.nightShift.quantity}
              </Text>
            </div>
            
            {/* Отметка времени */}
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '10px', color: '#52c41a' }}>
                <ClockCircleOutlined /> Обновлено: {dayjs().format('HH:mm:ss')}
              </Text>
            </div>

            {/* Диагностическая информация */}
            {showDetailed && (
              <div style={{ 
                marginTop: '8px', 
                padding: '6px', 
                backgroundColor: '#fff7e6', 
                borderRadius: '4px',
                fontSize: '10px',
                color: '#8c5700'
              }}>
                <div>🔍 Всего смен станка: {allMachineShifts?.length || 0}</div>
                <div>📋 Смен операции: {currentOperationShifts.length}</div>
                <div>📅 Дата: {dayjs().format('DD.MM.YYYY')}</div>
              </div>
            )}
          </div>
        </div>
      </Space>
    </div>
  );
};

export default ProductionVolumeCard;