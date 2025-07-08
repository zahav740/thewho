/**
 * @file: DuplicateResolutionModal.tsx
 * @description: Модальное окно для выбора действий с дубликатами при импорте Excel
 * @created: 2025-07-08
 */
import React, { useState } from 'react';
import {
  Modal,
  Table,
  Radio,
  Button,
  Tag,
  Space,
  Alert,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Descriptions,
  Badge,
  Collapse
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  MergeCellsOutlined,
  StepForwardOutlined,
  UndoOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Типы данных
interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: string;
  workType?: string;
  operations: Array<{
    operationNumber: number;
    operationType: string;
    machineAxes: number;
    estimatedTime: number;
  }>;
}

interface ExistingOrder {
  id: number;
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: string;
  workType?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  operations: Array<{
    id: number;
    operationNumber: number;
    operationType: string;
    status: string;
    machineAxes: number;
    estimatedTime: number;
  }>;
}

interface DuplicateInfo {
  orderData: ParsedOrder;
  existingOrder: ExistingOrder;
  differences: string[];
}

interface ImportResultWithDuplicates {
  created: number;
  updated: number;
  duplicatesFound: DuplicateInfo[];
  errors: Array<{ order: string; error: string }>;
  needsUserDecision: boolean;
  fileId?: string;
}

interface DuplicateResolution {
  action: 'replace' | 'skip' | 'merge' | 'replace_completely' | 'restore';
  orderDrawingNumber: string;
}

interface Props {
  visible: boolean;
  analysisResult: ImportResultWithDuplicates | null;
  onResolve: (resolutions: DuplicateResolution[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Компонент для отображения различий
const DifferencesDisplay: React.FC<{ differences: string[] }> = ({ differences }) => {
  if (differences.length === 0) {
    return <Text type="success">Нет различий</Text>;
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {differences.map((diff, index) => (
        <Tag 
          key={index} 
          color={diff.includes('🗑️') ? 'red' : diff.includes('⚠️') ? 'orange' : 'blue'}
          style={{ marginBottom: 4 }}
        >
          {diff}
        </Tag>
      ))}
    </Space>
  );
};

// Компонент для выбора действия
const ActionSelector: React.FC<{
  duplicate: DuplicateInfo;
  selectedAction: string;
  onChange: (action: 'replace' | 'skip' | 'merge' | 'replace_completely' | 'restore') => void;
}> = ({ duplicate, selectedAction, onChange }) => {
  const isDeleted = duplicate.existingOrder.isDeleted;
  const hasCompletedOperations = duplicate.existingOrder.operations?.some(op => 
    op.status === 'COMPLETED' || op.status === 'IN_PROGRESS'
  ) || false;

  return (
    <Radio.Group value={selectedAction} onChange={(e) => onChange(e.target.value)}>
      <Space direction="vertical" size="small">
        {isDeleted ? (
          <Radio value="restore">
            <Space>
              <UndoOutlined style={{ color: '#52c41a' }} />
              <Text>Восстановить и обновить заказ</Text>
            </Space>
          </Radio>
        ) : (
          <>
            <Radio value="replace">
              <Space>
                <SyncOutlined style={{ color: '#1890ff' }} />
                <Text>Умное обновление (сохранить прогресс)</Text>
                <Tooltip title="Обновит данные заказа, но сохранит выполненные операции">
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            </Radio>
            
            {hasCompletedOperations && (
              <Radio value="replace_completely">
                <Space>
                  <ReloadOutlined style={{ color: '#ff7875' }} />
                  <Text>Полная замена (СБРОСИТЬ ВСЁ)</Text>
                  <Tooltip title="⚠️ ОПАСНО: Удалит ВСЕ операции включая выполненные!">
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                  </Tooltip>
                </Space>
              </Radio>
            )}
            
            <Radio value="merge">
              <Space>
                <MergeCellsOutlined style={{ color: '#722ed1' }} />
                <Text>Объединить с существующим</Text>
                <Tooltip title="Умное слияние данных">
                  <InfoCircleOutlined style={{ color: '#722ed1' }} />
                </Tooltip>
              </Space>
            </Radio>
          </>
        )}
        
        <Radio value="skip">
          <Space>
            <StepForwardOutlined style={{ color: '#faad14' }} />
            <Text>Пропустить (оставить как есть)</Text>
          </Space>
        </Radio>
      </Space>
    </Radio.Group>
  );
};

// Основной компонент
const DuplicateResolutionModal: React.FC<Props> = ({
  visible,
  analysisResult,
  onResolve,
  onCancel,
  loading = false
}) => {
  const [resolutions, setResolutions] = useState<Map<string, DuplicateResolution['action']>>(new Map());
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateInfo | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  if (!analysisResult) return null;

  const handleActionChange = (drawingNumber: string, action: DuplicateResolution['action']) => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(drawingNumber, action);
    setResolutions(newResolutions);
  };

  const applyToAll = (action: DuplicateResolution['action']) => {
    const newResolutions = new Map<string, DuplicateResolution['action']>();
    analysisResult.duplicatesFound.forEach(duplicate => {
      newResolutions.set(duplicate.orderData.drawingNumber, action);
    });
    setResolutions(newResolutions);
  };

  const handleResolve = async () => {
    const resolutionList: DuplicateResolution[] = Array.from(resolutions.entries()).map(([drawingNumber, action]) => ({
      orderDrawingNumber: drawingNumber,
      action,
    }));

    await onResolve(resolutionList);
  };

  const showDetails = (duplicate: DuplicateInfo) => {
    setSelectedDuplicate(duplicate);
    setDetailsVisible(true);
  };

  const duplicatesColumns = [
    {
      title: 'Номер чертежа',
      dataIndex: ['orderData', 'drawingNumber'],
      key: 'drawingNumber',
      width: 150,
      render: (text: string, record: DuplicateInfo) => (
        <Space direction="vertical">
          <Text strong>{text}</Text>
          {record.existingOrder.isDeleted && (
            <Badge status="error" text="Удален" />
          )}
        </Space>
      ),
    },
    {
      title: 'Различия',
      dataIndex: 'differences',
      key: 'differences',
      width: 200,
      render: (differences: string[]) => (
        <DifferencesDisplay differences={differences} />
      ),
    },
    {
      title: 'Действие',
      key: 'action',
      width: 280,
      render: (_: any, record: DuplicateInfo) => {
        const currentAction = resolutions.get(record.orderData.drawingNumber) || 'skip';
        return (
          <ActionSelector
            duplicate={record}
            selectedAction={currentAction}
            onChange={(action) => handleActionChange(record.orderData.drawingNumber, action)}
          />
        );
      },
    },
    {
      title: 'Детали',
      key: 'details',
      width: 80,
      render: (_: any, record: DuplicateInfo) => (
        <Button
          type="text"
          size="small"
          onClick={() => showDetails(record)}
        >
          Подробно
        </Button>
      ),
    },
  ];

  const getActionStats = () => {
    const stats = {
      replace: 0,
      replace_completely: 0,
      merge: 0,
      restore: 0,
      skip: 0
    };
    
    resolutions.forEach(action => {
      if (action in stats) {
        stats[action as keyof typeof stats]++;
      }
    });
    
    return stats;
  };

  const actionStats = getActionStats();
  const hasDecisions = resolutions.size > 0;
  const allDecided = resolutions.size === analysisResult.duplicatesFound.length;

  return (
    <>
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            Найдены дубликаты при импорте
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        width={1200}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Отмена
          </Button>,
          <Button
            key="resolve"
            type="primary"
            loading={loading}
            disabled={!allDecided}
            onClick={handleResolve}
          >
            Применить решения ({resolutions.size}/{analysisResult.duplicatesFound.length})
          </Button>,
        ]}
      >
        <Alert
          message={`Найдено ${analysisResult.duplicatesFound.length} дубликатов`}
          description="Выберите действие для каждого дубликата. Рекомендуется использовать 'Умное обновление' для сохранения прогресса выполненных операций."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="Новых заказов"
              value={analysisResult.created}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Дубликатов найдено"
              value={analysisResult.duplicatesFound.length}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Ошибок"
              value={analysisResult.errors.length}
              prefix={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Col>
        </Row>

        {hasDecisions && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5}>Сводка решений:</Title>
            <Space wrap>
              {actionStats.replace > 0 && (
                <Tag color="blue">Умных обновлений: {actionStats.replace}</Tag>
              )}
              {actionStats.replace_completely > 0 && (
                <Tag color="red">Полных замен: {actionStats.replace_completely}</Tag>
              )}
              {actionStats.merge > 0 && (
                <Tag color="purple">Объединений: {actionStats.merge}</Tag>
              )}
              {actionStats.restore > 0 && (
                <Tag color="green">Восстановлений: {actionStats.restore}</Tag>
              )}
              {actionStats.skip > 0 && (
                <Tag color="orange">Пропусков: {actionStats.skip}</Tag>
              )}
            </Space>
          </Card>
        )}

        <Card title="Быстрые действия" size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Button onClick={() => applyToAll('replace')} icon={<SyncOutlined />}>
              Умное обновление для всех
            </Button>
            <Button onClick={() => applyToAll('merge')} icon={<MergeCellsOutlined />}>
              Объединить все
            </Button>
            <Button onClick={() => applyToAll('skip')} icon={<StepForwardOutlined />}>
              Пропустить все
            </Button>
          </Space>
        </Card>

        <Table
          columns={duplicatesColumns}
          dataSource={analysisResult.duplicatesFound}
          rowKey={(record) => record.orderData.drawingNumber}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 800 }}
        />

        {analysisResult.errors.length > 0 && (
          <Card title="Ошибки импорта" style={{ marginTop: 16 }}>
            <Collapse size="small">
              {analysisResult.errors.slice(0, 5).map((error, index) => (
                <Panel header={error.order} key={index}>
                  <Text type="danger">{error.error}</Text>
                </Panel>
              ))}
              {analysisResult.errors.length > 5 && (
                <Panel header={`... и еще ${analysisResult.errors.length - 5} ошибок`} key="more">
                  <Text type="secondary">Показаны только первые 5 ошибок</Text>
                </Panel>
              )}
            </Collapse>
          </Card>
        )}
      </Modal>

      {/* Модальное окно деталей */}
      <Modal
        title={`Детали дубликата: ${selectedDuplicate?.orderData.drawingNumber}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Закрыть
          </Button>,
        ]}
      >
        {selectedDuplicate && (
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Новые данные" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Номер чертежа">
                    {selectedDuplicate.orderData.drawingNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Количество">
                    {selectedDuplicate.orderData.quantity}
                  </Descriptions.Item>
                  <Descriptions.Item label="Дедлайн">
                    {new Date(selectedDuplicate.orderData.deadline).toLocaleDateString('ru-RU')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Приоритет">
                    {selectedDuplicate.orderData.priority}
                  </Descriptions.Item>
                  <Descriptions.Item label="Операции">
                    {selectedDuplicate.orderData.operations.length}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Существующие данные" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Номер чертежа">
                    {selectedDuplicate.existingOrder.drawingNumber}
                    {selectedDuplicate.existingOrder.isDeleted && (
                      <Badge status="error" text="Удален" style={{ marginLeft: 8 }} />
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Количество">
                    {selectedDuplicate.existingOrder.quantity}
                  </Descriptions.Item>
                  <Descriptions.Item label="Дедлайн">
                    {new Date(selectedDuplicate.existingOrder.deadline).toLocaleDateString('ru-RU')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Приоритет">
                    {selectedDuplicate.existingOrder.priority}
                  </Descriptions.Item>
                  <Descriptions.Item label="Операции">
                    {selectedDuplicate.existingOrder.operations?.length || 0}
                    {selectedDuplicate.existingOrder.operations?.some(op => op.status === 'COMPLETED') && (
                      <Tag color="green" style={{ marginLeft: 8 }}>Есть выполненные</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}
      </Modal>
    </>
  );
};

export default DuplicateResolutionModal;
