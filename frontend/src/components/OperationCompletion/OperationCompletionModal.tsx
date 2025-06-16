/**
 * @file: OperationCompletionModal.tsx (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @description: Модальное окно завершения операции с исправлением неточных данных
 * @dependencies: antd, react-query
 * @created: 2025-06-12
 * @fixed: 2025-06-16 - Исправлены неточные данные и добавлена отладка
 */
import React, { useEffect, useState } from 'react';
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
  BugOutlined,
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

const OperationCompletionModal: React.FC<OperationCompletionModalProps> = ({
  visible,
  completedOperation,
  onClose,
  onCloseOperation,
  onContinueOperation,
  onPlanNewOperation,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [isDataValid, setIsDataValid] = useState(true);
  const [correctedData, setCorrectedData] = useState<CompletedOperation | null>(null);

  // Проверяем и исправляем данные при открытии модального окна
  useEffect(() => {
    if (completedOperation && visible) {
      console.log('🔍 ИСПРАВЛЕННЫЙ КОМПОНЕНТ: Проверка данных модального окна:', {
        original: completedOperation,
        targetQuantity: completedOperation.targetQuantity,
        completedQuantity: completedOperation.completedQuantity,
        dayShift: completedOperation.dayShiftQuantity,
        nightShift: completedOperation.nightShiftQuantity,
        calculatedTotal: completedOperation.dayShiftQuantity + completedOperation.nightShiftQuantity
      });

      // Исправляем данные на основе реальных смен
      const realCompletedQuantity = completedOperation.dayShiftQuantity + completedOperation.nightShiftQuantity;
      const realProgressPercentage = Math.round((realCompletedQuantity / completedOperation.targetQuantity) * 100);
      
      // Проверяем корректность данных
      const dataIsIncorrect = Math.abs(realCompletedQuantity - completedOperation.completedQuantity) > 0.1;
      
      if (dataIsIncorrect) {
        console.warn('❌ ОБНАРУЖЕНЫ НЕТОЧНЫЕ ДАННЫЕ:', {
          'Оригинальные данные completedQuantity': completedOperation.completedQuantity,
          'Реальные данные (день + ночь)': realCompletedQuantity,
          'Разница': Math.abs(realCompletedQuantity - completedOperation.completedQuantity),
          'Исправленный прогресс': realProgressPercentage + '%'
        });
        
        setIsDataValid(false);
      } else {
        setIsDataValid(true);
      }

      // Создаем исправленную версию данных
      const corrected: CompletedOperation = {
        ...completedOperation,
        completedQuantity: realCompletedQuantity,
        progressPercentage: realProgressPercentage,
      };
      
      setCorrectedData(corrected);
    }
  }, [completedOperation, visible]);

  if (!completedOperation || !correctedData) return null;

  const efficiency = correctedData.actualTime && correctedData.estimatedTime
    ? Math.round((correctedData.estimatedTime / correctedData.actualTime) * 100)
    : 100;

  const isOverproduced = correctedData.completedQuantity > correctedData.targetQuantity;
  const isTargetReached = correctedData.completedQuantity >= correctedData.targetQuantity;
  const productionRate = correctedData.actualTime 
    ? Math.round((correctedData.completedQuantity / (correctedData.actualTime / 60)) * 100) / 100
    : 0;

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: isTargetReached ? '#52c41a' : '#faad14', fontSize: '24px' }} />
          <Title level={3} style={{ margin: 0, color: isTargetReached ? '#52c41a' : '#faad14' }}>
            {isTargetReached ? '🎉 Операция завершена!' : '⚠️ Операция в процессе'}
          </Title>
          {!isDataValid && (
            <BugOutlined 
              style={{ color: '#ff4d4f', fontSize: '20px', marginLeft: 8 }} 
              title="Обнаружены неточные данные"
            />
          )}
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
        {/* Предупреждение о неточных данных */}
        {!isDataValid && (
          <Alert
            message="🐛 Исправлены неточные данные!"
            description={
              <div>
                <Text>Обнаружены несоответствия в данных операции. Используются исправленные расчеты:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li><strong>Исходные данные:</strong> {completedOperation.completedQuantity} деталей ({completedOperation.progressPercentage}%)</li>
                  <li><strong>Исправленные данные:</strong> {correctedData.completedQuantity} деталей ({correctedData.progressPercentage}%)</li>
                  <li><strong>Расчет:</strong> День ({correctedData.dayShiftQuantity}) + Ночь ({correctedData.nightShiftQuantity}) = {correctedData.completedQuantity}</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        {/* Информация об операции */}
        <Card
          style={{
            marginBottom: '20px',
            backgroundColor: isTargetReached ? '#f6ffed' : '#fff7e6',
            borderColor: isTargetReached ? '#b7eb8f' : '#ffd591',
            borderRadius: '8px',
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col span={12}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: '16px' }}>
                  Операция #{correctedData.operationNumber}
                </Text>
                <Text type="secondary">
                  📄 {correctedData.orderDrawingNumber}
                </Text>
                <Text type="secondary">
                  🏭 {correctedData.machineName} ({correctedData.machineType})
                </Text>
                <Text type="secondary">
                  🔧 {correctedData.operationType}
                </Text>
              </Space>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.min(correctedData.progressPercentage, 100)}
                  size={100}
                  status={isTargetReached ? 'success' : 'active'}
                  strokeColor={isTargetReached ? '#52c41a' : '#faad14'}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ fontSize: '14px', color: isTargetReached ? '#52c41a' : '#faad14' }}>
                    {correctedData.completedQuantity} / {correctedData.targetQuantity}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    деталей выполнено
                  </Text>
                  {!isDataValid && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="orange" style={{ fontSize: '10px' }}>
                        Данные исправлены
                      </Tag>
                    </div>
                  )}
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
                value={correctedData.dayShiftQuantity}
                suffix="шт"
                prefix="☀️"
              />
              {correctedData.dayShiftOperator && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {correctedData.dayShiftOperator}
                </Text>
              )}
            </Col>
            <Col span={6}>
              <Statistic
                title="Ночная смена"
                value={correctedData.nightShiftQuantity}
                suffix="шт"
                prefix="🌙"
              />
              {correctedData.nightShiftOperator && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {correctedData.nightShiftOperator}
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
              <Text type="secondary">⏱️ Плановое время: {correctedData.estimatedTime} мин</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                ⏰ Фактическое время: {correctedData.actualTime || 'не указано'} мин
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                🕐 Начато: {new Date(correctedData.startedAt).toLocaleString('ru-RU')}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                ✅ {isTargetReached ? 'Завершено' : 'Обновлено'}: {new Date(correctedData.completedAt).toLocaleString('ru-RU')}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Предупреждения и рекомендации */}
        {isOverproduced && (
          <Alert
            message="Перевыполнение плана"
            description={`Произведено на ${correctedData.completedQuantity - correctedData.targetQuantity} деталей больше запланированного.`}
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

        {!isTargetReached && (
          <Alert
            message="Операция не завершена"
            description={`Осталось выполнить: ${correctedData.targetQuantity - correctedData.completedQuantity} деталей до достижения плановой цели.`}
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {/* Кнопки действий */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              {isTargetReached ? "🎯 Операция завершена! Выберите дальнейшие действия" : "⚡ Операция в процессе. Доступные действия:"}
            </Space>
          }
          style={{ borderRadius: '8px' }}
        >
          <Row gutter={[16, 16]}>
            {isTargetReached && (
              <Col span={8}>
                <Card
                  hoverable
                  style={{
                    textAlign: 'center',
                    borderColor: '#52c41a',
                    backgroundColor: '#f6ffed',
                  }}
                  onClick={() => {
                    console.log('✅ Закрытие операции с исправленными данными:', {
                      targetQuantity: correctedData.targetQuantity,
                      completedQuantity: correctedData.completedQuantity,
                      isDataValid
                    });
                    onCloseOperation();
                  }}
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
            )}
            
            <Col span={isTargetReached ? 8 : 12}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: '#faad14',
                  backgroundColor: '#fffbe6',
                }}
                onClick={() => {
                  console.log('🔄 Продолжение операции с исправленными данными:', correctedData);
                  onContinueOperation();
                }}
              >
                <PlayCircleOutlined
                  style={{ fontSize: '32px', color: '#faad14', marginBottom: '12px' }}
                />
                <Title level={4} style={{ color: '#faad14', margin: '8px 0' }}>
                  Продолжить
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {isTargetReached 
                    ? "Продолжить работу над операцией, накапливать результат"
                    : "Продолжить до достижения планового количества"
                  }
                </Text>
              </Card>
            </Col>
            
            <Col span={isTargetReached ? 8 : 12}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: '#1890ff',
                  backgroundColor: '#f0f9ff',
                }}
                onClick={() => {
                  console.log('📋 Планирование новой операции:', correctedData);
                  onPlanNewOperation();
                }}
              >
                <SettingOutlined
                  style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }}
                />
                <Title level={4} style={{ color: '#1890ff', margin: '8px 0' }}>
                  Спланировать
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {isTargetReached 
                    ? "Сохранить результат и запланировать новую операцию"
                    : "Завершить текущую и назначить следующую операцию"
                  }
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

        {/* Отладочная информация */}
        <Card 
          size="small" 
          title="🔍 Отладочная информация" 
          style={{ marginTop: 16, borderRadius: '8px', backgroundColor: '#fafafa' }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Исходные данные:</Text>
                <ul style={{ marginTop: 4, marginBottom: 0 }}>
                  <li>Цель: {completedOperation.targetQuantity} деталей</li>
                  <li>Выполнено (БД): {completedOperation.completedQuantity} деталей</li>
                  <li>Прогресс (БД): {completedOperation.progressPercentage}%</li>
                </ul>
              </Col>
              <Col span={12}>
                <Text strong>Исправленные данные:</Text>
                <ul style={{ marginTop: 4, marginBottom: 0 }}>
                  <li>Выполнено (реальное): {correctedData.completedQuantity} деталей</li>
                  <li>Прогресс (реальный): {correctedData.progressPercentage}%</li>
                  <li>Статус: {isTargetReached ? 'Цель достигнута' : 'В процессе'}</li>
                </ul>
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Text>
              <strong>Формула:</strong> День ({correctedData.dayShiftQuantity}) + Ночь ({correctedData.nightShiftQuantity}) = {correctedData.completedQuantity} деталей
            </Text>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export { OperationCompletionModal };
export default OperationCompletionModal;
