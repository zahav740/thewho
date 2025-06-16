/**
 * @file: OperationDetailModal.tsx
 * @description: Модальное окно с деталями операции
 * @dependencies: antd
 * @created: 2025-06-12
 */
import React from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Space,
  Descriptions,
  Progress,
} from 'antd';
import {
  ClockCircleOutlined,
  ToolOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface OperationDetailModalProps {
  visible: boolean;
  operation: any;
  onClose: () => void;
}

export const OperationDetailModal: React.FC<OperationDetailModalProps> = ({
  visible,
  operation,
  onClose
}) => {
  if (!operation) return null;

  return (
    <Modal
      title={
        <Space>
          <ToolOutlined />
          <span>Детали операции {operation.operationNumber}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Основная информация" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Номер операции">
                <Tag color="blue">{operation.operationNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Тип операции">
                <Tag color="green">{operation.operationType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Номер чертежа">
                <Text strong>{operation.orderDrawingNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Расчетное время">
                <Space>
                  <ClockCircleOutlined />
                  <Text>{operation.estimatedTime} мин</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Прогресс выполнения" size="small">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={Math.round(operation.progress || 0)}
                size={120}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>
                  {operation.totalProduced || 0} / {operation.targetQuantity || 0} деталей
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Статистика производства" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Выполнено деталей"
                  value={operation.totalProduced || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Осталось выполнить"
                  value={(operation.targetQuantity || 0) - (operation.totalProduced || 0)}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Процент выполнения"
                  value={Math.round(operation.progress || 0)}
                  suffix="%"
                  prefix={<CalendarOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default OperationDetailModal;
