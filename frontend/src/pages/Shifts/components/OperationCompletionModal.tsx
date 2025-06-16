/**
 * @file: FixedOperationCompletionModal.tsx
 * @description: ИСПРАВЛЕННОЕ модальное окно завершения операции с правильными данными
 * @created: 2025-06-16
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Result,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Typography,
  Tag,
  Alert,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import PlanningModal from '../../../components/PlanningModal/PlanningModal';

const { Title, Text } = Typography;

interface OperationCompletionData {
  machineName: string;
  machineId: string;
  machineType: string;
  operationDetails: {
    orderDrawingNumber: string;
    operationNumber: number;
    targetQuantity: number;
    completedQuantity: number;
    estimatedTime: number;
  };
  dayShift: {
    quantity: number;
    operator: string;
  };
  nightShift: {
    quantity: number;
    operator: string;
  };
}

interface OperationCompletionModalProps {
  visible: boolean;
  data: OperationCompletionData | null;
  onClose: () => void;
  onCloseOperation: () => void;
  onContinueOperation: () => void;
  onPlanNewOperation: () => void;
}

export const OperationCompletionModal: React.FC<OperationCompletionModalProps> = ({
  visible,
  data,
  onClose,
  onCloseOperation,
  onContinueOperation,
  onPlanNewOperation
}) => {
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [isDataValid, setIsDataValid] = useState(true);

  // Проверяем данные при открытии модального окна
  useEffect(() => {
    if (data && visible) {
      console.log('🔍 ПРОВЕРКА ДАННЫХ МОДАЛЬНОГО ОКНА:', {
        original: data,
        targetQuantity: data.operationDetails.targetQuantity,
        completedQuantity: data.operationDetails.completedQuantity,
        dayShift: data.dayShift.quantity,
        nightShift: data.nightShift.quantity,
        totalCalculated: data.dayShift.quantity + data.nightShift.quantity
      });

      // Проверяем корректность данных
      const totalCalculated = data.dayShift.quantity + data.nightShift.quantity;
      const isValid = totalCalculated === data.operationDetails.completedQuantity;
      
      if (!isValid) {
        console.warn('❌ ОБНАРУЖЕНА ОШИБКА В ДАННЫХ:', {
          'Указано выполнено': data.operationDetails.completedQuantity,
          'Расчетное выполнено': totalCalculated,
          'День': data.dayShift.quantity,
          'Ночь': data.nightShift.quantity
        });
      }
      
      setIsDataValid(isValid);
    }
  }, [data, visible]);

  if (!data) return null;

  // ИСПРАВЛЕННЫЕ РАСЧЕТЫ
  const totalCompleted = data.dayShift.quantity + data.nightShift.quantity;
  const correctedCompletedQuantity = totalCompleted; // Используем реальные данные смен
  const progressPercent = Math.round((correctedCompletedQuantity / data.operationDetails.targetQuantity) * 100);
  
  // Проверяем достижение цели
  const isTargetReached = correctedCompletedQuantity >= data.operationDetails.targetQuantity;
  const isOverproduced = correctedCompletedQuantity > data.operationDetails.targetQuantity;

  const handlePlanNewOperation = () => {
    onClose();
    setShowPlanningModal(true);
  };

  const selectedMachine = {
    id: data.machineId,
    machineName: data.machineName,
    machineType: data.machineType,
    isAvailable: true,
    lastFreedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any;

  return (
    <>
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: isTargetReached ? '#52c41a' : '#faad14', fontSize: '24px' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {isTargetReached ? '🎉 Операция завершена!' : '⚠️ Операция в процессе'}
            </span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={null}
        centered
      >
        {/* Предупреждение о неточных данных */}
        {!isDataValid && (
          <Alert
            message="⚠️ Обнаружена ошибка в данных!"
            description={
              <div>
                <Text>Данные из БД содержат ошибки. Используются исправленные расчеты:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>Исходные данные: {data.operationDetails.completedQuantity} деталей</li>
                  <li>Исправленные данные: {correctedCompletedQuantity} деталей</li>
                  <li>Расчет: День ({data.dayShift.quantity}) + Ночь ({data.nightShift.quantity}) = {correctedCompletedQuantity}</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Result
          status={isTargetReached ? "success" : "info"}
          title={
            isTargetReached 
              ? `Операция ${data.operationDetails.operationNumber} завершена` 
              : `Операция ${data.operationDetails.operationNumber} в процессе`
          }
          subTitle={
            <div>
              <Text>На станке {data.machineName} выполнено </Text>
              <Text strong style={{ color: isTargetReached ? '#52c41a' : '#faad14' }}>
                {correctedCompletedQuantity} из {data.operationDetails.targetQuantity}
              </Text>
              <Text> деталей</Text>
              {isOverproduced && (
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue">Перевыполнение на {correctedCompletedQuantity - data.operationDetails.targetQuantity} деталей</Tag>
                </div>
              )}
            </div>
          }
          style={{ padding: '20px 0' }}
        />

        {isTargetReached && (
          <Alert
            message="🎉 Поздравляем с завершением операции!"
            description={`Чертеж ${data.operationDetails.orderDrawingNumber} - операция ${data.operationDetails.operationNumber} достигла целевого количества деталей.`}
            type="success"
            showIcon
            style={{ marginBottom: 24, borderRadius: '8px' }}
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col span={8}>
            <Card size="small" style={{ 
              textAlign: 'center', 
              borderRadius: '8px', 
              backgroundColor: isTargetReached ? '#f6ffed' : '#fff7e6' 
            }}>
              <Statistic
                title="Выполнено деталей"
                value={correctedCompletedQuantity}
                suffix={`/ ${data.operationDetails.targetQuantity}`}
                valueStyle={{ 
                  color: isTargetReached ? '#52c41a' : '#faad14', 
                  fontSize: '24px' 
                }}
                prefix={isTargetReached ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              />
              <Tag color={isTargetReached ? 'green' : 'orange'} style={{ marginTop: 8 }}>
                {progressPercent}% выполнено
              </Tag>
              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={Math.min(progressPercent, 100)}
                  size="small"
                  strokeColor={isTargetReached ? '#52c41a' : '#faad14'}
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px', backgroundColor: '#f0f9ff' }}>
              <Statistic
                title="Дневная смена"
                value={data.dayShift.quantity}
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                prefix={<ToolOutlined />}
              />
              <Text type="secondary">{data.dayShift.operator}</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px', backgroundColor: '#f6f6f6' }}>
              <Statistic
                title="Ночная смена"
                value={data.nightShift.quantity}
                valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                prefix={<ClockCircleOutlined />}
              />
              <Text type="secondary">{data.nightShift.operator}</Text>
            </Card>
          </Col>
        </Row>

        <Card 
          title={
            <Space>
              <ToolOutlined />
              {isTargetReached ? "Операция завершена! Что делать дальше?" : "Операция в процессе. Доступные действия:"}
            </Space>
          }
          style={{ borderRadius: '12px', backgroundColor: '#fafafa' }}
        >
          <Text style={{ fontSize: '16px', marginBottom: 24, display: 'block' }}>
            {isTargetReached 
              ? "Целевое количество достигнуто. Выберите дальнейшие действия:"
              : `Осталось выполнить: ${data.operationDetails.targetQuantity - correctedCompletedQuantity} деталей`
            }
          </Text>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {isTargetReached && (
              <Button
                type="primary"
                size="large"
                icon={<StopOutlined />}
                onClick={() => {
                  console.log('✅ Закрытие операции с исправленными данными:', {
                    targetQuantity: data.operationDetails.targetQuantity,
                    completedQuantity: correctedCompletedQuantity
                  });
                  onCloseOperation();
                  onClose();
                }}
                block
                style={{ 
                  height: '60px', 
                  fontSize: '16px', 
                  borderRadius: '8px',
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>Закрыть операцию</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Операция завершена, станок освобожден, результат сохранен
                  </div>
                </div>
              </Button>
            )}

            <Button
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                console.log('🔄 Продолжение операции:', { correctedCompletedQuantity });
                onContinueOperation();
                onClose();
              }}
              block
              style={{ 
                height: '60px', 
                fontSize: '16px', 
                borderRadius: '8px'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Продолжить операцию</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  {isTargetReached 
                    ? "Продолжить накапливать результат (перевыполнение плана)"
                    : "Продолжить работу до достижения целевого количества"
                  }
                </div>
              </div>
            </Button>

            {isTargetReached && (
              <Button
                size="large"
                icon={<ToolOutlined />}
                onClick={handlePlanNewOperation}
                block
                style={{ 
                  height: '60px', 
                  fontSize: '16px', 
                  borderRadius: '8px'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>Спланировать новую операцию</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Завершить текущую и назначить следующую операцию
                  </div>
                </div>
              </Button>
            )}
          </Space>

          {/* Кнопка отладки */}
          <div style={{ marginTop: 16, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <strong>Отладочная информация:</strong><br/>
              • Цель: {data.operationDetails.targetQuantity} деталей<br/>
              • Выполнено (исправлено): {correctedCompletedQuantity} деталей<br/>
              • Исходные данные БД: {data.operationDetails.completedQuantity} деталей<br/>
              • Прогресс: {progressPercent}%<br/>
              • Достигнута цель: {isTargetReached ? 'Да' : 'Нет'}
            </Text>
          </div>
        </Card>
      </Modal>

      <PlanningModal
        visible={showPlanningModal}
        onCancel={() => setShowPlanningModal(false)}
        selectedMachine={selectedMachine}
      />
    </>
  );
};

export default OperationCompletionModal;
