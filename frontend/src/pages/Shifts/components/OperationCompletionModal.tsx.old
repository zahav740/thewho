/**
 * @file: OperationCompletionModal.tsx
 * @description: Модальное окно уведомления о завершении операции
 * @dependencies: antd, PlanningModal
 * @created: 2025-06-12
 */
import React, { useState } from 'react';
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
  Alert
} from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ToolOutlined,
  ClockCircleOutlined
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

  if (!data) return null;

  const totalCompleted = data.dayShift.quantity + data.nightShift.quantity;
  const progressPercent = Math.round((totalCompleted / data.operationDetails.targetQuantity) * 100);

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
  } as any; // Используем any для совместимости с PlanningModal

  return (
    <>
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Операция выполнена!
            </span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={null}
        centered
      >
        <Result
          status="success"
          title={`Операция ${data.operationDetails.operationNumber} завершена`}
          subTitle={`На станке ${data.machineName} выполнено ${totalCompleted} из ${data.operationDetails.targetQuantity} деталей`}
          style={{ padding: '20px 0' }}
        />

        <Alert
          message="🎉 Поздравляем с завершением операции!"
          description={`Чертеж ${data.operationDetails.orderDrawingNumber} - операция ${data.operationDetails.operationNumber} достигла целевого количества деталей.`}
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: '8px' }}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px', backgroundColor: '#f6ffed' }}>
              <Statistic
                title="Выполнено деталей"
                value={totalCompleted}
                suffix={`/ ${data.operationDetails.targetQuantity}`}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                prefix={<CheckCircleOutlined />}
              />
              <Tag color="green" style={{ marginTop: 8 }}>
                {progressPercent}% выполнено
              </Tag>
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
          title="Что делать дальше?"
          style={{ borderRadius: '12px', backgroundColor: '#fafafa' }}
        >
          <Text style={{ fontSize: '16px', marginBottom: 24, display: 'block' }}>
            Операция завершена успешно. Выберите дальнейшие действия:
          </Text>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={<StopOutlined />}
              onClick={() => {
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

            <Button
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => {
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
                  Продолжить накапливать результат (перевыполнение плана)
                </div>
              </div>
            </Button>

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
          </Space>
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
