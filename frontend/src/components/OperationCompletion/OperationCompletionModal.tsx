/**
 * @file: OperationCompletionModal.tsx
 * @description: Модальное окно завершения операции с тремя вариантами действий
 * @dependencies: antd, react-query
 * @created: 2025-06-12
 */
import React from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Divider,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  WarningOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useTranslation } from '../../i18n';

const { Title, Text } = Typography;

interface CompletedOperation {
  id: string;
  operationNumber: number;
  operationType: string;
  orderDrawingNumber: string;
  machineName: string;
  machineType: string;
  targetQuantity: number;
  completedQuantity: number;
  progressPercentage: number;
  estimatedTime: number;
  actualTime?: number;
  dayShiftQuantity: number;
  nightShiftQuantity: number;
  dayShiftOperator?: string;
  nightShiftOperator?: string;
  startedAt: string;
  completedAt: string;
}

export interface OperationCompletionModalProps {
  visible: boolean;
  completedOperation: CompletedOperation | null;
  onClose: () => void;
  onCloseOperation: () => void;
  onContinueOperation: () => void;
  onPlanNewOperation: () => void;
  loading?: boolean;
}

export const OperationCompletionModal: React.FC<OperationCompletionModalProps> = ({
  visible,
  completedOperation,
  onClose,
  onCloseOperation,
  onContinueOperation,
  onPlanNewOperation,
  loading = false,
}) => {
  const { t } = useTranslation();

  if (!completedOperation) return null;

  const efficiency = completedOperation.actualTime && completedOperation.estimatedTime
    ? Math.round((completedOperation.estimatedTime / completedOperation.actualTime) * 100)
    : 100;

  const isOverproduced = completedOperation.completedQuantity > completedOperation.targetQuantity;
  const productionRate = completedOperation.actualTime 
    ? Math.round((completedOperation.completedQuantity / (completedOperation.actualTime / 60)) * 100) / 100
    : 0;

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
          <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
            🎉 Операция завершена!
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      centered
      style={{ borderRadius: '12px' }}
      className="operation-completion-modal"
    >
      <div style={{ padding: '20px 0' }}>
        {/* Информация об операции */}
        <Card
          style={{
            marginBottom: '20px',
            backgroundColor: '#f6ffed',
            borderColor: '#b7eb8f',
            borderRadius: '8px',
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col span={12}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: '16px' }}>
                  Операция #{completedOperation.operationNumber}
                </Text>
                <Text type="secondary">
                  📄 {completedOperation.orderDrawingNumber}
                </Text>
                <Text type="secondary">
                  🏭 {completedOperation.machineName} ({completedOperation.machineType})
                </Text>
                <Text type="secondary">
                  🔧 {completedOperation.operationType}
                </Text>
              </Space>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.min(completedOperation.progressPercentage, 100)}
                  size={100}
                  status={isOverproduced ? 'success' : 'active'}
                  strokeColor={isOverproduced ? '#52c41a' : '#1890ff'}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ fontSize: '14px' }}>
                    {completedOperation.completedQuantity} / {completedOperation.targetQuantity}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    деталей выполнено
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Производственная статистика */}
        <Card
          title="📊 Статистика производства"
          style={{ marginBottom: '20px', borderRadius: '8px' }}
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="Дневная смена"
                value={completedOperation.dayShiftQuantity}
                suffix="шт"
                prefix="☀️"
              />
              {completedOperation.dayShiftOperator && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {completedOperation.dayShiftOperator}
                </Text>
              )}
            </Col>
            <Col span={6}>
              <Statistic
                title="Ночная смена"
                value={completedOperation.nightShiftQuantity}
                suffix="шт"
                prefix="🌙"
              />
              {completedOperation.nightShiftOperator && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {completedOperation.nightShiftOperator}
                </Text>
              )}
            </Col>
            <Col span={6}>
              <Statistic
                title="Эффективность"
                value={efficiency}
                suffix="%"
                prefix="⚡"
                valueStyle={{ 
                  color: efficiency >= 100 ? '#3f8600' : efficiency >= 80 ? '#faad14' : '#ff4d4f'
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Скорость"
                value={productionRate}
                suffix="шт/ч"
                prefix="🚀"
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text type="secondary">⏱️ Плановое время: {completedOperation.estimatedTime} мин</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                ⏰ Фактическое время: {completedOperation.actualTime || 'не указано'} мин
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                🕐 Начато: {new Date(completedOperation.startedAt).toLocaleString('ru-RU')}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                ✅ Завершено: {new Date(completedOperation.completedAt).toLocaleString('ru-RU')}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Предупреждения и рекомендации */}
        {isOverproduced && (
          <Alert
            message="Перевыполнение плана"
            description={`Произведено на ${completedOperation.completedQuantity - completedOperation.targetQuantity} деталей больше запланированного.`}
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {efficiency < 80 && (
          <Alert
            message="Низкая эффективность"
            description="Рекомендуется проанализировать причины снижения производительности."
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {/* Кнопки действий */}
        <Card
          title="🎯 Выберите дальнейшие действия"
          style={{ borderRadius: '8px' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: '#52c41a',
                  backgroundColor: '#f6ffed',
                }}
                onClick={onCloseOperation}
              >
                <CheckCircleOutlined
                  style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }}
                />
                <Title level={4} style={{ color: '#52c41a', margin: '8px 0' }}>
                  Закрыть
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Завершить операцию, сохранить результат в БД и освободить станок
                </Text>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: '#faad14',
                  backgroundColor: '#fffbe6',
                }}
                onClick={onContinueOperation}
              >
                <PlayCircleOutlined
                  style={{ fontSize: '32px', color: '#faad14', marginBottom: '12px' }}
                />
                <Title level={4} style={{ color: '#faad14', margin: '8px 0' }}>
                  Продолжить
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Продолжить работу над операцией, накапливать результат
                </Text>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: '#1890ff',
                  backgroundColor: '#f0f9ff',
                }}
                onClick={onPlanNewOperation}
              >
                <SettingOutlined
                  style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }}
                />
                <Title level={4} style={{ color: '#1890ff', margin: '8px 0' }}>
                  Спланировать
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Сохранить результат и запланировать новую операцию
                </Text>
              </Card>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={onClose} size="large">
                Отмена
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: '16px' }}>
                Выберите один из вариантов выше или закройте это окно
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default OperationCompletionModal;
